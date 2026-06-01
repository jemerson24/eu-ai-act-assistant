from langchain_qdrant import QdrantVectorStore
from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient


def get_retriever(qdrant_url: str, collection_name: str, k: int = 5, api_key: str = None):
    client = QdrantClient(
        url=qdrant_url,
        api_key=api_key,
    )

    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
    )

    return vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": k},
    )
