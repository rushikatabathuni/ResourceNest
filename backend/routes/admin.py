from fastapi import APIRouter, Header, HTTPException, Depends
from db import db
from utils import decode_token

admin = APIRouter()

# Check if the requester is an admin user
def is_admin(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        if not payload.get("admin"):
            raise HTTPException(status_code=403, detail="Admin access only")
        return True
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@admin.get("/admin/analytics")
def get_analytics(admin_auth=Depends(is_admin)):
    total_users = db.users.count_documents({})
    total_bookmarks = db.bookmarks.count_documents({})
    top_tags = list(
        db.bookmarks.aggregate([
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ])
    )
    return {
        "total_users": total_users,
        "total_bookmarks": total_bookmarks,
        "top_tags": top_tags
    }
