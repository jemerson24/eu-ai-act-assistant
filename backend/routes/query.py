from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from rag.pipeline import get_qa_chain_with_sources
from rag.retriever import get_retriever
from config import QDRANT_URL, QDRANT_COLLECTION
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

class QueryRequest(BaseModel):
    question: str

class SourceDocument(BaseModel):
    page: int
    text: str

class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceDocument]

@router.post("/query", response_model=QueryResponse)
@limiter.limit("10/minute")
async def query(request: Request, body: QueryRequest):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        retriever = get_retriever(QDRANT_URL, QDRANT_COLLECTION)
        qa_chain = get_qa_chain_with_sources(retriever)
        result = qa_chain(body.question)

        sources = [
            SourceDocument(
                page=int(doc.metadata.get("page", 0)),
                text=doc.page_content[:500]
            )
            for doc in result["source_documents"]
        ]

        return QueryResponse(answer=result["result"], sources=sources)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
