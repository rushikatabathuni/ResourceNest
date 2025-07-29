from fastapi import APIRouter, HTTPException
from models import User
from db import db
from utils import hash_pass, verify_pass, create_token
from bson import ObjectId

auth = APIRouter()

@auth.post("/register")
def register(user: User):
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    db.users.insert_one({
        "email": user.email,
        "password_hash": hash_pass(user.password),
        "is_admin": False
    })

    return {"msg": "Registration successful"}

@auth.post("/login")
def login(user: User):
    record = db.users.find_one({"email": user.email})
    if not record or not verify_pass(user.password, record["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(str(record["_id"]), record.get("is_admin", False))
    return {
        "access_token": token,
        "user": {
            "id": str(record["_id"]),
            "email": record["email"],
            "is_admin": record.get("is_admin", False)
        }
    }

@auth.post("/admin/login")
def admin_login(user: User):
    record = db.users.find_one({"email": user.email, "is_admin": True})
    if not record or not verify_pass(user.password, record["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    token = create_token(str(record["_id"]), True)
    return {
        "access_token": token,
        "user": {
            "id": str(record["_id"]),
            "email": record["email"],
            "is_admin": True
        }
    }
