import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from dotenv import load_dotenv
import os

load_dotenv()

from rag.ingestion import ingest_documents

PDF_PATH = Path(__file__).parent.parent / "documents" / "eu_ai_act.pdf"
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION = os.getenv("QDRANT_COLLECTION", "eu_ai_act")

if __name__ == "__main__":
    if not PDF_PATH.exists():
        print(f"ERROR: PDF not found at {PDF_PATH}")
        sys.exit(1)

    if not os.getenv("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY not set in .env")
        sys.exit(1)

    if not QDRANT_API_KEY:
        print("ERROR: QDRANT_API_KEY not set in .env")
        sys.exit(1)

    print("=== EU AI Act Ingestion Pipeline ===\n")
    print(f"Qdrant URL: {QDRANT_URL}")
    count = ingest_documents(
        pdf_path=str(PDF_PATH),
        qdrant_url=QDRANT_URL,
        collection_name=COLLECTION,
    )
    print(f"\nReady to query — {count} chunks in Qdrant collection '{COLLECTION}'")
