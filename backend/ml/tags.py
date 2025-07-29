# ml/tags.py
from keybert import KeyBERT

tagger = KeyBERT("all-MiniLM-L6-v2")

def extract_tags(text: str):
    return [kw[0] for kw in tagger.extract_keywords(text, top_n=5)]