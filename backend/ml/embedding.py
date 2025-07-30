# ml/embedding.py
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("paraphrase-MiniLM-L3-v2")

def get_embedding(title: str = "", description: str = ""):
    text = f"{title} {description}".strip()
    return model.encode(text).tolist()
