import time
import os
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams


def ingest_documents(pdf_path: str, qdrant_url: str, collection_name: str) -> int:
    start = time.time()

    print(f"Loading PDF: {pdf_path}")
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()
    print(f"  Loaded {len(pages)} pages")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=64,
        separators=["Article ", "Recital ", "\n\n", "\n", " "],
    )
    chunks = splitter.split_documents(pages)

    for chunk in chunks:
        chunk.metadata["page"] = int(chunk.metadata.get("page", 0))
        chunk.metadata["source"] = Path(pdf_path).name

    print(f"  Created {len(chunks)} chunks")

    api_key = os.getenv("QDRANT_API_KEY")

    print("Connecting to Qdrant...")
    client = QdrantClient(url=qdrant_url, api_key=api_key)

    existing = [c.name for c in client.get_collections().collections]
    if collection_name in existing:
        print(f"  Collection '{collection_name}' already exists — deleting and recreating")
        client.delete_collection(collection_name)

    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    )
    print(f"  Collection '{collection_name}' created")

    print("Embedding and storing chunks...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    QdrantVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        url=qdrant_url,
        collection_name=collection_name,
        api_key=api_key,
    )

    elapsed = round(time.time() - start, 1)
    print(f"\nDone! {len(chunks)} chunks stored in '{collection_name}' ({elapsed}s)")
    return len(chunks)
