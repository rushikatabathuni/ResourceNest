from pydantic import BaseModel
from typing import List, Optional


class User(BaseModel):
    email: str
    password: str


class Bookmark(BaseModel):
    title: Optional[str] = ""
    url: str
    description: Optional[str] = ""
    tags: List[str] = []
    shared: Optional[bool] = False
    status: Optional[str] = "alive"


class SearchQuery(BaseModel):
    query: str
    limit: int = 20


class ShareRequest(BaseModel):
    bookmark_ids: List[str]


class CollectionInput(BaseModel):
    name: str
    bookmark_ids: List[str]