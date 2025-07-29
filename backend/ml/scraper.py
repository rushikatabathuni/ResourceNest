# utils/scraper.py
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def clean_url(url: str):
    if not url.startswith("http://") and not url.startswith("https://"):
        return "https://" + url
    return url
def scrape_metadata(url: str) -> dict:
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        title = soup.title.string.strip() if soup.title and soup.title.string else url
        description = ""
        if soup.find("meta", attrs={"name": "description"}):
            description = soup.find("meta", attrs={"name": "description"}).get("content", "")
        elif soup.find("meta", attrs={"property": "og:description"}):
            description = soup.find("meta", attrs={"property": "og:description"}).get("content", "")

        return {
            "title": title or url,
            "description": description.strip()
        }
    except Exception as e:
        print(f"Scraping failed for {url}: {e}")
        return {
            "title": url,
            "description": "",
        }

