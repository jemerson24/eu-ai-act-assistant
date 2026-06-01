from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from rag.pipeline import get_qa_chain_with_sources
from rag.retriever import get_retriever
from config import QDRANT_URL, QDRANT_COLLECTION

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
async def query(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        retriever = get_retriever(QDRANT_URL, QDRANT_COLLECTION)
        qa_chain = get_qa_chain_with_sources(retriever)
        result = qa_chain(request.question)

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
