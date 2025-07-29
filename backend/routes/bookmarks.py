from fastapi import APIRouter, Depends, Header, HTTPException, Query
from models import Bookmark, SearchQuery, ShareRequest
from db import db
from utils import decode_token, normalize_url, convert_objectid_to_str
from ml.embedding import get_embedding
from ml.tags import extract_tags
from ml.scraper import scrape_metadata
from bson import ObjectId
from sklearn.metrics.pairwise import cosine_similarity
import uuid
from utils import check_url_health

book = APIRouter()

def get_user_id(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        return decode_token(token)["sub"]
    except:
        raise HTTPException(401, "Invalid token")

@book.get("/bookmarks/")
def get_all(user_id=Depends(get_user_id)):
    raw_bookmarks = list(db.bookmarks.find({"user_id": ObjectId(user_id)}))
    return convert_objectid_to_str(raw_bookmarks)

@book.post("/bookmarks/add")
def add(bm: Bookmark, user_id=Depends(get_user_id)):
    url = normalize_url(bm.url)
    
    title = bm.title
    description = bm.description
    
    # Scrape if missing title or description
    if not title or not description:
        scraped_title, scraped_description = scrape_metadata(url)
        title = title or scraped_title or url
        description = description or scraped_description or ""

    status = check_url_health(url)
    
    emb = get_embedding(title, description)
    tags = extract_tags(f"{title} {description}")

    data = bm.dict()
    data.update({
        "url": url,
        "title": title,
        "description": description,
        "user_id": ObjectId(user_id),
        "embedding": emb,
        "tags": tags,
        "status": status,
        "visit_count": 0,
        "is_broken": (status == "broken"),
        "shared": False,
        "last_checked": None
    })
    # Remove category if present just in case
    data.pop("category", None)
    db.bookmarks.insert_one(data)
    return {"msg": "Added"}

@book.put("/bookmarks/edit/{id}")
def edit(id: str, bm: Bookmark, user_id=Depends(get_user_id)):
    url = normalize_url(bm.url)
    title = bm.title.strip() if bm.title else ""
    description = bm.description.strip() if bm.description else ""

    # Re-generate metadata if not provided
    if not title or not description:
        scraped_title, scraped_description = scrape_metadata(url)
        title = title or scraped_title or url
        description = description or scraped_description or ""

    tags = bm.tags if bm.tags else extract_tags(f"{title} {description}")
    embedding = get_embedding(title, description)
    status = check_url_health(url)

    updated_data = {
        "url": url,
        "title": title,
        "description": description,
        "tags": tags or [],
        "embedding": embedding,
        "shared": bm.shared,
        "status": status,
        "is_broken": (status == "broken"),
        "last_checked": None
    }

    result = db.bookmarks.update_one(
        {"_id": ObjectId(id), "user_id": ObjectId(user_id)},
        {"$set": updated_data}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Bookmark not found or not owned by user")
    return {"msg": "Updated"}

@book.delete("/bookmarks/delete/{id}")
def delete(id: str, user_id=Depends(get_user_id)):
    result = db.bookmarks.delete_one({"_id": ObjectId(id), "user_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Bookmark not found or not owned by user")
    return {"msg": "Deleted"}

@book.post("/bookmarks/share")
def share(req: ShareRequest, user_id=Depends(get_user_id)):
    share_id = str(uuid.uuid4())
    db.bookmarks.update_many(
        {"_id": {"$in": [ObjectId(bid) for bid in req.bookmark_ids]}, "user_id": ObjectId(user_id)},
        {"$set": {"shared": share_id}}
    )
    return {"share_id": share_id}

@book.get("/shared/{share_id}")
def shared_bookmarks(share_id: str):
    raw_shared = list(db.bookmarks.find({"shared": share_id}))
    return convert_objectid_to_str(raw_shared)

@book.post("/search")
def search(q: SearchQuery, user_id=Depends(get_user_id)):
    query_emb = get_embedding(q.query, "")
    raw_bookmarks = list(db.bookmarks.find({"user_id": ObjectId(user_id)}))
    bookmarks = convert_objectid_to_str(raw_bookmarks)

    scored = [
        (cosine_similarity([query_emb], [bm["embedding"]])[0][0], bm)
        for bm in bookmarks if "embedding" in bm
    ]
    scored.sort(reverse=True, key=lambda x: x[0])
    return [bm for _, bm in scored[:q.limit]]

@book.get("/bookmarks/broken")
def get_broken_bookmarks(user_id=Depends(get_user_id), tag: str = Query(None)):
    query = {"user_id": ObjectId(user_id), "is_broken": True}
    if tag:
        query["tags"] = tag
    broken = list(db.bookmarks.find(query))
    count = len(broken)
    return {
        "count": count,
        "bookmarks": convert_objectid_to_str(broken)
    }

@book.get("/bookmarks/tag/{tag}")
def get_bookmarks_by_tag(tag: str, user_id=Depends(get_user_id)):
    bookmarks = list(db.bookmarks.find({
        "user_id": ObjectId(user_id),
        "tags": tag
    }))
    return convert_objectid_to_str(bookmarks)
