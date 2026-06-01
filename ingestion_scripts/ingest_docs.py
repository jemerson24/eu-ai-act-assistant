"""
Run this once to populate Qdrant with the EU AI Act.

Usage (from project root):
    python ingestion_scripts/ingest_docs.py

Make sure:
  1. Qdrant is running:
     docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
  2. Your .env file has OPENAI_API_KEY set
"""

import sys
from pathlib import Path

# Allow imports from backend/
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from dotenv import load_dotenv
import os

load_dotenv()

from rag.ingestion import ingest_documents

PDF_PATH = Path(__file__).parent.parent / "documents" / "eu_ai_act.pdf"
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION = os.getenv("QDRANT_COLLECTION", "eu_ai_act")


if __name__ == "__main__":
    if not PDF_PATH.exists():
        print(f"ERROR: PDF not found at {PDF_PATH}")
        print("Download it first:")
        print("  curl -L 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202401689' -o documents/eu_ai_act.pdf")
        sys.exit(1)

    if not os.getenv("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY not set in .env")
        sys.exit(1)

    print("=== EU AI Act Ingestion Pipeline ===\n")
    count = ingest_documents(
        pdf_path=str(PDF_PATH),
        qdrant_url=QDRANT_URL,
        collection_name=COLLECTION,
    )
    print(f"\nReady to query — {count} chunks in Qdrant collection '{COLLECTION}'")