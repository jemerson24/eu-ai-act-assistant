<div align="center">

# 🏛️ EU AI Act Compliance Assistant

**Ask questions about the EU AI Act in plain English. Get cited, accurate answers in seconds.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=for-the-badge)](https://eu-ai-act-assistant-460016298946.us-central1.run.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/jemerson24/eu-ai-act-assistant)

![EU AI Act Assistant](https://storage.googleapis.com/eu-ai-act-pdf/preview.png)

</div>

---

## ✨ What is this?

The EU AI Act (August 2024) is a 144-page regulation that applies to every company building AI in or selling to Europe — including enterprises like L'Oréal, Philips, and Lenovo.

This tool lets **compliance officers** and **developers** query the Act in natural language instead of manually searching through legal text.

### Features

| Feature | Description |
|---|---|
| 💬 **Natural language Q&A** | Ask anything about the EU AI Act, get a plain-English answer with Article citations |
| ⚠️ **Risk Classifier** | Describe your AI system, get a High / Limited / Minimal risk classification |
| 📄 **Source Citations** | Every answer shows exactly which pages and articles it drew from |
| 🔓 **No sign-up needed** | Fully public, no API key required |

---

## 🚀 Try it now

**Live app:** [eu-ai-act-assistant-460016298946.us-central1.run.app](https://eu-ai-act-assistant-460016298946.us-central1.run.app)

Try asking:
> *"What are the obligations for high-risk AI providers?"*

> *"Does the EU AI Act apply to open-source models?"*

> *"What are the transparency requirements for chatbots?"*

Or use the **Risk Classifier** tab and describe your AI system:
> *"An algorithm that scores job applicants based on their CV and social media data"*

---

## 🧠 How it works

This is a **RAG (Retrieval-Augmented Generation)** system — it doesn't just send your question to ChatGPT. Instead:

```
Your question
      │
      ▼
Convert to a vector (numbers that represent meaning)
      │
      ▼
Search 1,429 chunks of the EU AI Act for the most relevant passages
      │
      ▼
Send only those passages to GPT-4o
      │
      ▼
Get a grounded answer that only uses what's in the Act
```

This means the AI **can't hallucinate** answers — it can only use text that actually exists in the official document.

---

## 🛠️ Tech stack

```
Frontend          Backend           AI / Data
─────────         ────────          ─────────
Next.js 16        FastAPI           OpenAI GPT-4o
Tailwind CSS      Python 3.11       text-embedding-3-small
Vercel            GCP Cloud Run     LangChain
                  Docker            Qdrant Cloud
```

---

## 💻 Run it locally

### What you need

- Python 3.11
- Node.js 18+
- Docker Desktop
- An [OpenAI API key](https://platform.openai.com)
- A free [Qdrant Cloud](https://cloud.qdrant.io) account

### Step 1 — Clone

```bash
git clone https://github.com/jemerson24/eu-ai-act-assistant.git
cd eu-ai-act-assistant
```

### Step 2 — Configure

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```bash
OPENAI_API_KEY=sk-...
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key
QDRANT_COLLECTION=eu_ai_act
```

### Step 3 — Download the EU AI Act

```bash
mkdir -p documents
curl -L 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202401689' \
     -o documents/eu_ai_act.pdf
```

### Step 4 — Index the document

This runs once to chunk, embed, and store the Act in Qdrant (~60 seconds):

```bash
python -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
python ingestion_scripts/ingest_docs.py
```

You'll see:
```
Loaded 144 pages → Created 1429 chunks → Stored in Qdrant ✓
```

### Step 5 — Start everything

Open 3 terminal tabs:

```bash
# Tab 1 — Qdrant (local)
docker run -p 6333:6333 qdrant/qdrant

# Tab 2 — Backend
cd backend && uvicorn main:app --reload --port 8000

# Tab 3 — Frontend
cd frontend && npm install && npm run dev
```

Open **http://localhost:3000** 🎉

---

## 📡 API reference

Base URL: `https://eu-ai-act-assistant-460016298946.us-central1.run.app`

### `POST /query`

Ask a question about the EU AI Act.

```bash
curl -X POST /query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the transparency requirements for chatbots?"}'
```

**Response:**
```json
{
  "answer": "Chatbots must clearly identify themselves as AI...",
  "sources": [
    { "page": 81, "text": "Article 50 — Transparency obligations..." }
  ]
}
```

### `POST /classify-system`

Classify an AI system by EU AI Act risk level.

```bash
curl -X POST /classify-system \
  -H "Content-Type: application/json" \
  -d '{"description": "A CV screening algorithm for hiring"}'
```

**Response:**
```json
{
  "risk_level": "High",
  "reasoning": "Employment-related AI systems fall under Annex III...",
  "relevant_article": "Article 6, Annex III",
  "annex_entry": "Annex III, point 4(a)"
}
```

### `GET /health`

```bash
curl /health
# {"status": "ok"}
```

---

## 🗂️ Project structure

```
eu-ai-act-assistant/
├── backend/
│   ├── main.py              # FastAPI app + rate limiting
│   ├── rag/
│   │   ├── ingestion.py     # PDF → chunks → embeddings → Qdrant
│   │   ├── retriever.py     # Similarity search
│   │   └── pipeline.py      # RAG chain + risk classifier
│   └── routes/
│       ├── query.py         # POST /query
│       └── classify.py      # POST /classify-system
├── frontend/
│   └── src/
│       ├── app/page.tsx
│       └── components/
│           ├── ChatPanel.tsx
│           ├── SourcesPanel.tsx
│           └── ClassifierPanel.tsx
├── ingestion_scripts/
│   └── ingest_docs.py
├── Dockerfile
└── .env.example
```

---

## 🚢 Deploy your own

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
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "OPENAI_API_KEY=...,QDRANT_URL=...,QDRANT_API_KEY=...,QDRANT_COLLECTION=eu_ai_act"
```

---

## 🔭 What's next

- [ ] **Evaluation pipeline** — RAGAS metrics to automatically score answer quality
- [ ] **Conversation memory** — maintain context across multi-turn conversations  
- [ ] **Multi-document** — extend to other EU regulations (GDPR, AI Liability Directive)
- [ ] **Authentication** — per-user rate limits and usage tracking
- [ ] **Hybrid search** — combine vector search with BM25 for better retrieval on exact legal terms

---

## 📄 License

MIT — free to use, modify, and deploy.

---

<div align="center">
Built with FastAPI · LangChain · Qdrant · GPT-4o · Next.js
</div>
