from fastapi import APIRouter, Depends
from db import db
from utils import decode_token
from bson import ObjectId
from fastapi import Header, HTTPException

analytics = APIRouter()

def get_user_id(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        return decode_token(token)["sub"]
    except:
        raise HTTPException(401, "Invalid token")

@analytics.get("/analytics/broken_bookmarks")
def broken_bookmarks_count(user_id=Depends(get_user_id)):
    broken_count = db.bookmarks.count_documents({
        "user_id": ObjectId(user_id),
        "is_broken": True
    })
    return {"broken_bookmarks_count": broken_count}
