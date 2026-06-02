# EU AI Act Compliance Assistant

A production-grade RAG (Retrieval-Augmented Generation) application that lets compliance officers and developers query the EU AI Act in natural language and get accurate, cited answers grounded in the official legal text.

**Live demo:** `https://eu-ai-act-assistant-460016298946.us-central1.run.app`

---

## What it does

- **Natural language Q&A** — ask anything about the EU AI Act and get a plain-English answer with Article citations
- **AI system risk classifier** — describe your AI system and get a High / Limited / Minimal risk classification with Annex III references
- **Clickable source cards** — every answer shows the exact chunks retrieved from the Act, linked to the official PDF at the right page
- **No API key required** — rate-limited at 10 requests/minute per user

---

## Architecture

```
User (Next.js frontend)
        │
        ▼
FastAPI backend (GCP Cloud Run)
        │
   ┌────┴────┐
   │         │
   ▼         ▼
Qdrant    OpenAI
Cloud     GPT-4o
(1429     (answer
chunks)   generation)
```

**Query flow:**
1. User submits a question
2. FastAPI embeds the question via `text-embedding-3-small`
3. Qdrant returns the top-5 most relevant chunks (cosine similarity)
4. GPT-4o generates a grounded answer from those chunks
5. Answer + source documents returned to the frontend

---

## Tech stack

| Layer | Technology |
|---|---|
| LLM | OpenAI GPT-4o (temperature=0) |
| Embeddings | text-embedding-3-small (1536 dimensions) |
| Vector DB | Qdrant Cloud |
| Orchestration | LangChain |
| Backend | FastAPI + Python 3.11 |
| Frontend | Next.js 16 + Tailwind CSS |
| PDF storage | Google Cloud Storage |
| Deployment | GCP Cloud Run + Docker |
| Rate limiting | slowapi (10 req/min per IP) |

---

## Project structure

```
eu-ai-act-assistant/
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── config.py               # Environment config
│   ├── rag/
│   │   ├── ingestion.py        # PDF load, chunk, embed, store
│   │   ├── retriever.py        # Qdrant similarity search
│   │   └── pipeline.py         # LangChain RAG + classifier chains
│   ├── routes/
│   │   ├── query.py            # POST /query
│   │   └── classify.py         # POST /classify-system
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/page.tsx        # Main layout + state
│       └── components/
│           ├── ChatPanel.tsx   # Chat interface
│           ├── SourcesPanel.tsx # Source citation cards
│           └── ClassifierPanel.tsx # Risk classifier UI
├── ingestion_scripts/
│   └── ingest_docs.py          # Run once to populate Qdrant
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Local setup

### Prerequisites

- Python 3.11
- Node.js 18+
- Docker Desktop
- OpenAI API key
- Qdrant Cloud account (free tier)

### 1. Clone the repo

```bash
git clone https://github.com/jemerson24/eu-ai-act-assistant.git
cd eu-ai-act-assistant
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```
OPENAI_API_KEY=your-openai-api-key
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION=eu_ai_act
```

### 3. Download the EU AI Act PDF

```bash
mkdir -p documents
curl -L 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202401689' \
     -o documents/eu_ai_act.pdf
```

### 4. Run ingestion

```bash
python -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
python ingestion_scripts/ingest_docs.py
```

This chunks the PDF into 1429 pieces, embeds them, and stores them in Qdrant (~60 seconds).

### 5. Start the backend

```bash
cd backend && uvicorn main:app --reload --port 8000
```

### 6. Start the frontend

```bash
cd frontend && npm install && npm run dev
```

Open `http://localhost:3000`.

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/query` | Ask a question about the EU AI Act |
| POST | `/classify-system` | Classify an AI system by risk level |

### Example: Query

```bash
curl -X POST https://eu-ai-act-assistant-460016298946.us-central1.run.app/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the obligations for high-risk AI providers?"}'
```

### Example: Risk classifier

```bash
curl -X POST https://eu-ai-act-assistant-460016298946.us-central1.run.app/classify-system \
  -H "Content-Type: application/json" \
  -d '{"description": "An algorithm that scores job applicants based on CV analysis"}'
```

---

## Example queries

**Compliance questions:**
- "What are the obligations for high-risk AI providers?"
- "What are the transparency requirements for chatbots?"
- "Does the EU AI Act apply to open-source models?"
- "What is prohibited under Article 5?"
- "What are the post-market monitoring requirements?"

**Risk classifier inputs:**
- "A CV screening algorithm for hiring decisions" → High risk (Annex III, 4a)
- "A customer service chatbot for e-commerce" → Minimal risk
- "A real-time facial recognition system in public spaces" → Prohibited

---

## Key design decisions

**Why RAG over full-document context?**
The EU AI Act is 144 pages (~80,000 words). Sending the full document on every query is slow, expensive, and suffers from the "lost-in-the-middle" problem. RAG retrieves only the 5 most relevant chunks per query — faster, cheaper, and more accurate.

**Why chunk_size=512 with Article-aware separators?**
Legal text has natural clause boundaries at Article level. Using `"Article "` as a primary separator prevents clauses from being split across chunks, which improves retrieval precision.

**Why temperature=0?**
This is a legal accuracy use case. Deterministic outputs are essential — the same question should always return the same answer.

**Why Qdrant over Chroma?**
Qdrant supports metadata filtering and has a production-hosted option. The data layer is designed so adding per-domain collections (HR agent, Finance agent) is a clean extension.

---

## Deployment

### Docker

```bash
docker build -t eu-ai-act-assistant .
docker run -p 8080:8080 --env-file .env eu-ai-act-assistant
```

### GCP Cloud Run

```bash
gcloud run deploy eu-ai-act-assistant \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "OPENAI_API_KEY=...,QDRANT_URL=...,QDRANT_API_KEY=...,QDRANT_COLLECTION=eu_ai_act"
```

---

## What I would add next

- **Evaluation pipeline** — RAGAS metrics (faithfulness, answer relevance, context recall) to score retrieval quality automatically
- **Multi-agent routing** — supervisor agent that routes queries to domain-specific sub-agents (HR, Finance, Legal, Product) each with their own Qdrant namespace
- **Authentication** — per-user API keys and usage tracking for production use
- **Conversation memory** — maintain context across multi-turn conversations
- **Hybrid search** — combine dense vector search with BM25 sparse search for better retrieval on exact legal terms

---

## License

MIT
