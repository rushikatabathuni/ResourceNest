from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import List
from bson import ObjectId
import io
from bs4 import BeautifulSoup, Tag
import csv
import json
import asyncio
from datetime import datetime
from urllib.parse import urlparse

from db import db
from utils import get_current_user
from ml.embedding import get_embedding
from ml.tags import extract_tags
from utils import check_url_health
from ml.scraper import scrape_metadata

router = APIRouter()

def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme:
        return "https://" + url
    return url

def import_bookmark_html(html_content: str):
    soup = BeautifulSoup(html_content, "html.parser")
    bookmarks = []
    top_dl = soup.find('dl')
    if not top_dl:
        return bookmarks

    dt_tags = top_dl.find_all('dt')
    for dt in dt_tags:
        a_tag = dt.find('a')
        if a_tag and a_tag.has_attr('href'):
            bookmarks.append({
                'url': a_tag['href'],
                'title': a_tag.get_text(strip=True),
                'collections': []
            })
    return bookmarks

async def parse_bookmark_json(file_bytes: bytes) -> List[dict]:
    try:
        data = json.loads(file_bytes.decode("utf-8"))
        if isinstance(data, list):
            bookmarks = []
            for item in data:
                url = item.get("url")
                title = item.get("title") or url
                collections = item.get("collections") or []
                if url:
                    bookmarks.append({
                        "url": url,
                        "title": title,
                        "collections": collections,
                        "description": item.get("description", "")
                    })
            return bookmarks
        else:
            return []
    except Exception:
        return []

async def parse_bookmark_csv(file_bytes: bytes) -> List[dict]:
    try:
        decoded = file_bytes.decode("utf-8")
        reader = csv.DictReader(io.StringIO(decoded))
        bookmarks = []
        for row in reader:
            url = row.get("url")
            if not url:
                continue
            title = row.get("title") or url
            description = row.get("description") or ""
            collections = row.get("collections", "")
            collections_list = [c.strip() for c in collections.split(";")] if collections else []
            bookmarks.append({
                "url": url,
                "title": title,
                "description": description,
                "collections": collections_list
            })
        return bookmarks
    except Exception:
        return []

async def generate_embedding(title: str, description: str):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, get_embedding, title, description)

async def generate_tags(title: str, description: str):
    loop = asyncio.get_running_loop()
    text = f"{title} {description}".strip()
    return await loop.run_in_executor(None, extract_tags, text)

async def find_bookmark(user_id, url):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: db.bookmarks.find_one({"user_id": ObjectId(user_id), "url": url}))

async def insert_bookmark(bookmark_doc):
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, lambda: db.bookmarks.insert_one(bookmark_doc))
    return result


@router.post("/bookmarks/import")
async def import_bookmarks(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    content = await file.read()
    filename = file.filename.lower()
    content_type = file.content_type

    if filename.endswith(".html") or content_type == "text/html":
        bookmarks = import_bookmark_html(content.decode("utf-8", errors="ignore"))
    elif filename.endswith(".json") or content_type == "application/json":
        bookmarks = await parse_bookmark_json(content)
    elif filename.endswith(".csv") or content_type == "text/csv":
        bookmarks = await parse_bookmark_csv(content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    if not bookmarks:
        raise HTTPException(status_code=400, detail="No bookmarks found in file")


    errors = []

    semaphore = asyncio.Semaphore(10)

    print(f"Total bookmarks parsed: {len(bookmarks)}")
    counters = {
        "inserted": 0,
        "duplicates": 0,
        "errors": 0
    }
    async def process_bookmark(bm):
        try:
            existing = await find_bookmark(current_user["_id"], bm["url"])
            if existing:
                print(f"Duplicate bookmark skipped: {bm['url']}")
                counters["duplicates"] += 1
                return
            # fallback title/description scrape if missing
            title = bm.get("title") or bm["url"]
            description = bm.get("description") or ""
            if not description:
                scraped = scrape_metadata(bm["url"])
                description = scraped.get("description", "")
                title = title or scraped.get("title", bm["url"])

            tags = await generate_tags(title, description)
            embedding = await generate_embedding(title, description)
            broken = not check_url_health(bm["url"])

            bookmark_doc = {
                "user_id": ObjectId(current_user["_id"]),
                "url": bm["url"],
                "title": title,
                "description": description,
                "category": " / ".join(bm.get("collections", [])) if bm.get("collections") else "",
                "tags": tags,
                "embedding": embedding,
                "shared": False,
                "created_at": datetime.utcnow(),
                "is_broken": broken,
                "visit_count": 0,
                "last_checked": None
            }
            await insert_bookmark(bookmark_doc)
            print(f"Inserted bookmark: {bm['url']}")
        except Exception as e:
            print(f"Error inserting bookmark {bm.get('url')}: {e}")
            error_count += 1

        await insert_bookmark(bookmark_doc)
        counters["inserted"] += 1

    async def sem_task(bm):
        async with semaphore:
            try:
                await process_bookmark(bm)
            except Exception as e:
                errors.append({"bookmark": bm, "error": str(e)})
                counters["errors"] += 1

    await asyncio.gather(*(sem_task(bm) for bm in bookmarks))

    return {
        "importedCount": counters["inserted"],
        "duplicatesSkipped": counters["duplicates"],
        "errors": counters["errors"],
        "total": len(bookmarks)
    }
