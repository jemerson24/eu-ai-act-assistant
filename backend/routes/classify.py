from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from rag.pipeline import run_classifier
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

class ClassifyRequest(BaseModel):
    description: str

class ClassifyResponse(BaseModel):
    risk_level: str
    reasoning: str
    relevant_article: str | None
    annex_entry: str | None

@router.post("/classify-system", response_model=ClassifyResponse)
@limiter.limit("10/minute")
async def classify_system(request: Request, body: ClassifyRequest):
    if not body.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty")

    try:
        result = run_classifier(body.description)
        return ClassifyResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
