from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import auth
from routes.bookmarks import book
from routes.admin import admin
from routes.import_bookmarks import router as import_bookmarks_router
from routes.analytics import analytics 
from routes.collection import collection_router


app = FastAPI()

# Add this CORS config
origins = [
    "http://localhost:5173",
    "https://resource-nest.vercel.app/",# Your frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Allows only this origin
    allow_credentials=True,
    allow_methods=["*"],         # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],         # Allow all headers
)

# ✅ Router registrations
app.include_router(auth)
app.include_router(book)
app.include_router(admin)
app.include_router(import_bookmarks_router)
app.include_router(analytics)
app.include_router(collection_router)
