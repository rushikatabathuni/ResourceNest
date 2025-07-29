from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List
from bson import ObjectId, errors
from db import db
from models import CollectionInput # Assuming this is defined in models.py
from utils import decode_token, convert_objectid_to_str # Assuming these are in utils.py

collection_router = APIRouter()

def get_user_id(authorization: str = Header(...)):
    """Extracts user ID from the Authorization header token."""
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

class CollectionUpdateInput(BaseModel):
    name: str

class BookmarkIdsInput(BaseModel):
    bookmark_ids: List[str]

@collection_router.post("/collections/", status_code=201)
def create_collection(data: CollectionInput, user_id: str = Depends(get_user_id)):
    """Creates a new collection for the user."""
    try:
        user_object_id = ObjectId(user_id)
        bookmark_object_ids = [ObjectId(bid) for bid in data.bookmark_ids]
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format provided.")

    # Validate that all provided bookmarks exist and belong to the user
    valid_bms_count = db.bookmarks.count_documents({
        "_id": {"$in": bookmark_object_ids},
        "user_id": user_object_id
    })
    if valid_bms_count != len(data.bookmark_ids):
        raise HTTPException(status_code=400, detail="One or more bookmarks are invalid or do not belong to the user")

    collection_data = {
        "user_id": user_object_id,
        "name": data.name,
        "bookmarks": bookmark_object_ids # Changed from bookmark_ids to match frontend Collection type
    }
    res = db.collections.insert_one(collection_data)
    
    # Return the newly created collection object
    new_collection = db.collections.find_one({"_id": res.inserted_id})
    return convert_objectid_to_str(new_collection)

@collection_router.get("/collections/")
def get_collections(user_id: str = Depends(get_user_id)):
    """Retrieves all collections for the user."""
    collections = list(db.collections.find({"user_id": ObjectId(user_id)}))
    return convert_objectid_to_str(collections)

@collection_router.get("/collections/{collection_id}")
def get_collection(collection_id: str, user_id: str = Depends(get_user_id)):
    """Retrieves a single collection and its bookmarks."""
    coll = db.collections.find_one({"_id": ObjectId(collection_id), "user_id": ObjectId(user_id)})
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Populate bookmarks within the collection
    coll["bookmarks"] = list(db.bookmarks.find({
        "_id": {"$in": coll.get("bookmarks", [])}
    }))
    
    return convert_objectid_to_str(coll)

@collection_router.put("/collections/{collection_id}/rename")
def rename_collection(collection_id: str, data: CollectionUpdateInput, user_id: str = Depends(get_user_id)):
    """Renames a collection."""
    res = db.collections.update_one(
        {"_id": ObjectId(collection_id), "user_id": ObjectId(user_id)},
        {"$set": {"name": data.name}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found or user not authorized")
    
    updated_collection = db.collections.find_one({"_id": ObjectId(collection_id)})
    return convert_objectid_to_str(updated_collection)

@collection_router.delete("/collections/{collection_id}", status_code=204)
def delete_collection(collection_id: str, user_id: str = Depends(get_user_id)):
    """Deletes a collection."""
    res = db.collections.delete_one({"_id": ObjectId(collection_id), "user_id": ObjectId(user_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found or user not authorized")
    return

@collection_router.post("/collections/{collection_id}/add-bookmarks")
def add_bookmarks_to_collection(collection_id: str, data: BookmarkIdsInput, user_id: str = Depends(get_user_id)):
    """Adds bookmarks to a specific collection."""
    bookmark_object_ids = [ObjectId(bid) for bid in data.bookmark_ids]
    
    # Validate bookmarks
    valid_bms_count = db.bookmarks.count_documents({
        "_id": {"$in": bookmark_object_ids},
        "user_id": ObjectId(user_id)
    })
    if valid_bms_count != len(data.bookmark_ids):
        raise HTTPException(status_code=400, detail="One or more bookmarks are invalid or do not belong to the user")

    res = db.collections.update_one(
        {"_id": ObjectId(collection_id), "user_id": ObjectId(user_id)},
        {"$addToSet": {"bookmarks": {"$each": bookmark_object_ids}}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")

    updated_collection = db.collections.find_one({"_id": ObjectId(collection_id)})
    return convert_objectid_to_str(updated_collection)

@collection_router.post("/collections/{collection_id}/remove-bookmarks")
def remove_bookmarks_from_collection(collection_id: str, data: BookmarkIdsInput, user_id: str = Depends(get_user_id)):
    """Removes bookmarks from a specific collection."""
    res = db.collections.update_one(
        {"_id": ObjectId(collection_id), "user_id": ObjectId(user_id)},
        {"$pull": {"bookmarks": {"$in": [ObjectId(bid) for bid in data.bookmark_ids]}}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    updated_collection = db.collections.find_one({"_id": ObjectId(collection_id)})
    return convert_objectid_to_str(updated_collection)
