from langchain_qdrant import QdrantVectorStore
from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient


def get_retriever(qdrant_url: str, collection_name: str, k: int = 5):
    """
    Returns a LangChain retriever backed by Qdrant.
    k = number of chunks to retrieve per query.
    """
    client = QdrantClient(url=qdrant_url)

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
