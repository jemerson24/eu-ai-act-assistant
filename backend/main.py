from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routes.query import router as query_router
from routes.classify import router as classify_router
import os

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="EU AI Act Compliance Assistant",
    description="RAG-powered legal assistant for the EU AI Act",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Only mount documents if the directory exists
DOCUMENTS_PATH = os.path.join(os.path.dirname(__file__), "..", "documents")
if os.path.exists(DOCUMENTS_PATH):
    app.mount("/documents", StaticFiles(directory=DOCUMENTS_PATH), name="documents")

app.include_router(query_router)
app.include_router(classify_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
