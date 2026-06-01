from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.query import router as query_router
from routes.classify import router as classify_router
import os

app = FastAPI(
    title="EU AI Act Compliance Assistant",
    description="RAG-powered legal assistant for the EU AI Act",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the PDF as a static file
DOCUMENTS_PATH = os.path.join(os.path.dirname(__file__), "..", "documents")
app.mount("/documents", StaticFiles(directory=DOCUMENTS_PATH), name="documents")

app.include_router(query_router)
app.include_router(classify_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
