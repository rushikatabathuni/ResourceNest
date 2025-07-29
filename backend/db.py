from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client["resourcenest"]

# Collections (optional shortcut aliases)
users_col = db["users"]
bookmarks_col = db["bookmarks"]
collections_col = db["collections"]
