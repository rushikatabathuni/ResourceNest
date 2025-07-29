from passlib.context import CryptContext
from jose import JWTError
import jwt
import os
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Header
from typing import Optional, Union
from bson import ObjectId
from db import db
from urllib.parse import urlparse

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET")


def hash_pass(password: str) -> str:
    return pwd_context.hash(password)


def verify_pass(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_token(user_id: str, is_admin=False) -> str:
    payload = {
        "sub": user_id,
        "admin": is_admin,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


async def get_current_user(authorization: Optional[str] = Header(None)):
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid Authorization header")

    token = authorization[7:]
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        user.pop("password_hash", None)
        return user

    except (JWTError, Exception):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token decode failed")


def convert_objectid_to_str(doc: Union[dict, list, ObjectId]):
    if isinstance(doc, list):
        return [convert_objectid_to_str(item) for item in doc]
    if isinstance(doc, dict):
        return {k: convert_objectid_to_str(v) for k, v in doc.items()}
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc



def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme:
        return "https://" + url
    return url



import requests

def check_url_health(url: str, timeout: int = 10) -> str:
    """
    Return 'alive' if URL is reachable and returns 2xx or 3xx status,
    else 'broken'.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }

    try:
        response = requests.head(url, allow_redirects=True, timeout=timeout, headers=headers)
        if response.status_code >= 200 and response.status_code < 400:
            return "alive"
        else:
            return "broken"
    except Exception:
        return "broken"
