# To run Qdrant locally with Docker:
# docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant

import time
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams


def ingest_documents(pdf_path: str, qdrant_url: str, collection_name: str) -> int:
    """
    Load, chunk, embed, and store the EU AI Act PDF in Qdrant.
    Returns the number of chunks stored.
    """
    start = time.time()

    # ── 1. Load ──────────────────────────────────────────────────────
    print(f"Loading PDF: {pdf_path}")
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()
    print(f"  Loaded {len(pages)} pages")

    # ── 2. Chunk ──────────────────────────────────────────────────────
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=64,
        separators=["Article ", "Recital ", "\n\n", "\n", " "],
    )
    chunks = splitter.split_documents(pages)

    # Normalise metadata: ensure every chunk has page (int) and source (str)
    for chunk in chunks:
        chunk.metadata["page"] = int(chunk.metadata.get("page", 0))
        chunk.metadata["source"] = Path(pdf_path).name

    print(f"  Created {len(chunks)} chunks")

    # ── 3. Embed + Store ──────────────────────────────────────────────
    print("Connecting to Qdrant...")
    client = QdrantClient(url=qdrant_url)

    # Create collection if it doesn't exist
    existing = [c.name for c in client.get_collections().collections]
    if collection_name in existing:
        print(f"  Collection '{collection_name}' already exists — deleting and recreating")
        client.delete_collection(collection_name)

    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    )
    print(f"  Collection '{collection_name}' created")

    print("Embedding and storing chunks (this may take 1-2 mins)...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    QdrantVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        url=qdrant_url,
        collection_name=collection_name,
    )

    elapsed = round(time.time() - start, 1)
    print(f"\nDone! {len(chunks)} chunks stored in '{collection_name}' ({elapsed}s)")
    return len(chunks)

def clean_chunk_text(text: str) -> str:
    """Fix PDF extraction spacing artifacts like 'Ar ticle' and 'distr ibut or'"""
    import re
    # Fix single/double letter splits: "Ar ticle" → "Article", "pro vider" → "provider"
    text = re.sub(r'\b([A-Za-z]{1,2})\s([a-z]{2,})\b', r'\1\2', text)
    # Fix hyphenated line breaks: "high-\nrisk" → "high-risk"
    text = re.sub(r'-\n', '-', text)
    # Collapse multiple spaces
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()
