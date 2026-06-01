from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from rag.pipeline import run_classifier

router = APIRouter()

class ClassifyRequest(BaseModel):
    description: str

class ClassifyResponse(BaseModel):
    risk_level: str
    reasoning: str
    relevant_article: str | None
    annex_entry: str | None

@router.post("/classify-system", response_model=ClassifyResponse)
async def classify_system(request: ClassifyRequest):
    if not request.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty")

    try:
        result = run_classifier(request.description)
        return ClassifyResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
