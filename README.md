<div align="center">

# 🏛️ EU AI Act Compliance Assistant

**Ask questions about the EU AI Act in plain English. Get cited, accurate answers in seconds.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=for-the-badge)](https://eu-ai-act-assistant.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/jemerson24/eu-ai-act-assistant)

</div>

---

## What is this?

The EU AI Act (August 2024) is a 144-page regulation that applies to every company building or deploying AI in Europe — including enterprises like L'Oréal, Philips, and Lenovo.

This tool lets **compliance officers** and **developers** query the Act in natural language instead of manually searching through dense legal text.

---

## Features

| | |
|---|---|
| 💬 **Natural language Q&A** | Ask anything about the EU AI Act and get a plain-English answer with Article citations |
| ⚠️ **Risk Classifier** | Describe your AI system and get a High / Limited / Minimal risk classification with Annex III references |
| 📄 **Source Citations** | Every answer shows exactly which pages and articles it drew from — click to open the source |
| 🔓 **No sign-up needed** | Fully public, no API key required |

---

## Try it

**Live app:** [eu-ai-act-assistant.vercel.app](https://eu-ai-act-assistant.vercel.app)

Example questions to try:

- *"What are the obligations for high-risk AI providers?"*
- *"Does the EU AI Act apply to open-source models?"*
- *"What are the transparency requirements for chatbots?"*
- *"What is prohibited under Article 5?"*

Or use the **Risk Classifier** tab and describe your AI system:

- *"An algorithm that scores job applicants based on their CV and social media data"* → High risk
- *"A customer service chatbot for an e-commerce website"* → Minimal risk
- *"A real-time facial recognition system in public spaces"* → Prohibited

---

## How it was built

### The core idea — RAG

Rather than sending every user question directly to an LLM with the full 144-page document, the app uses a **RAG (Retrieval-Augmented Generation)** pipeline. This means the system first finds the most relevant passages from the Act, then passes only those to the LLM to generate an answer. The result is faster, cheaper, and more accurate — the model can only answer from text that actually exists in the official document.

### Document ingestion

The official EU AI Act PDF was downloaded from EUR-Lex and processed using **LangChain's PyPDFLoader**. The document was then split into 1,429 chunks using a `RecursiveCharacterTextSplitter` with Article-aware separators — meaning the splitter respects Article boundaries instead of cutting mid-clause. Each chunk was embedded using **OpenAI's text-embedding-3-small** model (1,536 dimensions) and stored in **Qdrant Cloud** with page number and source metadata.

### Retrieval pipeline

When a user asks a question, it gets embedded using the same model and compared against all stored chunks using cosine similarity. The top 5 most relevant chunks are retrieved and assembled into a context window.

### Answer generation

The retrieved context is passed to **GPT-4o at temperature 0** via a LangChain chain with a custom system prompt that instructs the model to answer in plain English, cite specific Articles, and refuse to speculate beyond what the text says. Temperature 0 ensures deterministic, legally grounded responses — the same question always returns the same answer.

### Risk classifier

A separate LangChain chain handles risk classification. The user describes their AI system in plain text, and GPT-4o classifies it as High, Limited, or Minimal risk according to the EU AI Act framework, returning structured JSON with the relevant Article and Annex III entry.

### Backend

The backend is built with **FastAPI** and exposes two endpoints — `/query` for Q&A and `/classify-system` for risk classification. A rate limiter (slowapi) caps usage at 10 requests per minute per IP so users don't need their own API keys. The EU AI Act PDF is served from **Google Cloud Storage** so source cards link directly to the exact page in the official document.

### Frontend

The frontend is built with **Next.js** and styled with Tailwind CSS. The interface has two panels — a chat window on the left and a sources panel on the right showing the retrieved chunks with page numbers and article labels. Clicking a source card opens the PDF at the exact page. A second tab exposes the Risk Classifier with colour-coded risk level output.

### Deployment

The backend is containerised with **Docker** and deployed to **GCP Cloud Run** in `us-central1`. The frontend is deployed on **Vercel**, which auto-deploys on every push to the main branch. The vector database runs on **Qdrant Cloud** (free tier).

---

## Tech stack

| Layer | Technology |
|---|---|
| LLM | OpenAI GPT-4o |
| Embeddings | text-embedding-3-small |
| Vector database | Qdrant Cloud |
| Orchestration | LangChain |
| Backend | FastAPI + Python 3.11 |
| Frontend | Next.js + Tailwind CSS |
| PDF storage | Google Cloud Storage |
| Deployment | GCP Cloud Run + Docker + Vercel |

---

## What I would add next

- **Evaluation pipeline** — RAGAS metrics to automatically score answer faithfulness and retrieval quality
- **Conversation memory** — maintain context across multi-turn conversations
- **Multi-document support** — extend to GDPR, the AI Liability Directive, and other EU regulations
- **Authentication** — per-user rate limits and usage tracking for production use
- **Hybrid search** — combine dense vector search with BM25 sparse search for better retrieval on exact legal terms and Article numbers

---

<div align="center">
Built with FastAPI · LangChain · Qdrant · GPT-4o · Next.js · GCP · Vercel
</div>
