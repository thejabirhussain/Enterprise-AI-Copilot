# Enterprise AI Copilot Platform (Phase 2)

> A production-grade Enterprise AI Copilot platform demonstrating Retrieval-Augmented Generation (RAG), vector databases, semantic search, role-based access control (RBAC), data governance, and interactive AI infrastructure.

[![Frontend](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%20%2B%20TS-22d3ee)](#)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-6366f1)](#)
[![LLM](https://img.shields.io/badge/LLM-Ollama%20%28Local%29-34d399)](#)
[![Vector DB](https://img.shields.io/badge/Vector%20DB-Qdrant-f43f5e)](#)

---

## 🏗 System Architecture

The platform operates as a multi-tier enterprise architecture separating UI, orchestration, and local AI infrastructure.

```
┌─────────────────────────────────────────────────────────────────┐
│                     ENTERPRISE AI COPILOT                       │
├───────────────────────────┬─────────────────────────────────────┤
│      FRONTEND (:5173)     │         BACKEND (:8000)             │
│  Vite 6 + React 19 + TS   │   FastAPI + Python 3.14             │
│  Zustand + React Query    │   Clean Architecture Services       │
│  Vanilla CSS (Sleek UI)   │   RBAC + Audit Logging Middleware   │
└───────────────────────────┴─────────────────────────────────────┘
                               ↕ REST + SSE (Streaming)
┌─────────────────────────────────────────────────────────────────┐
│                      AI INFRASTRUCTURE                           │
├──────────────────┬──────────────────┬───────────────────────────┤
│  Ollama (:11434) │  Qdrant (:6333)  │  SentenceTransformers     │
│  Llama 3.2 (3B)  │  Vector Search   │  BAAI/bge-small-en-v1.5   │
│  Mistral / Phi3  │  384-dim vectors │  (Optional Mock Mode)     │
└──────────────────┴──────────────────┴───────────────────────────┘
```

---

## 🔁 RAG Pipeline Flow

The platform implements a **7-Step Grounding Pipeline** visualized in real-time on the frontend:

1. **Query Received**: API receives and validates the user request, mapping the user's role and permission level.
2. **Embedding Generation**: Query text is converted to a 384-dimensional vector representation.
3. **Vector Search**: Performs cosine similarity search across Qdrant collection points.
4. **Chunk Retrieval**: Extracts top-K relevant chunks, filtered dynamically based on the user's access level (Public, Internal, Confidential, Restricted).
5. **Context Injection**: Retracted chunks are formatted and injected as grounding text into the LLM prompt.
6. **LLM Generation**: Ollama processes the prompt through Llama 3.2 to generate a response.
7. **Grounded Response**: Delivers the final token stream with sources, confidence scores, and audit signatures.

---

## 📺 Application Dashboards (11 Interfaces)

The platform provides a comprehensive administrative and operational suite across 11 key views:

1. **AI Copilot Chat**: Main chat interface with real-time streaming, RAG ON/OFF toggle, model switching, and inline RAG step trace.
2. **System Dashboard**: Operational overview showing service statuses, integration health, knowledge base analytics, and config details.
3. **Knowledge Base Manager**: Browse, filter, and search ingested files. Shows chunk splits and metadata.
4. **Embedding Visualizer**: Interactive 2D PCA/t-SNE semantic scatter plot mapping documents and user queries in vector space.
5. **RAG Workflow Trace**: Step-by-step visual audit of the retrieval pipeline, tracking latency and metadata per step.
6. **Enterprise Integration**: Interactive flow diagram displaying data ingestion webhooks, API gateways, and downstream connections.
7. **Compliance & Governance**: Compliance audit log tracking query histories, accessed document classifications, and risk distributions.
8. **Ingestion Pipeline**: Simulate manual or automated document ingestion, tracking splits, embedding generations, and indexing tasks.
9. **Role & Security Manager**: Visual permission matrix showing Role-Based Access Control (RBAC) levels (Intern, Engineer, HR Manager, Executive).
10. **Knowledge Health**: Visual metrics highlighting document coverage, knowledge gaps, and quality index scores.
11. **Learn Center**: 6 interactive slide-based lessons explaining vector embeddings, cosine similarity, prompt engineering, and governance.

---

## ⚙ Configuration & Environment Variables

Create `.env` inside the `backend/` directory to configure the services.

### Constrained Local Runtimes (e.g. CPU Sandbox)
In resource-constrained environments (like IDE terminals or CPU-only containers), importing PyTorch and SentenceTransformers can exceed memory limits and cause operating systems to issue a `SIGKILL (exit code 137)`. 

To run the application stably under these constraints, the backend includes a lightweight **Mock Embedding Service** that generates deterministic 384-dimensional vector hashes in microseconds using standard Numpy. This allows you to test the full RAG pipeline, Qdrant database indexes, and Ollama LLM queries without heavy ML libraries.

Set the following in `backend/.env`:
```ini
USE_MOCK_EMBEDDINGS=true
```

### Full Configuration Reference
```ini
# Application Settings
APP_NAME="Enterprise AI Copilot"
ENVIRONMENT="development"
DEBUG=true

# API Server Ports
HOST="0.0.0.0"
PORT=8000

# Ollama LLM Connection
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_DEFAULT_MODEL="llama3.2"  # Primary model
OLLAMA_TIMEOUT=120

# Qdrant Vector Database
QDRANT_HOST="localhost"
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME="enterprise_knowledge"

# Embeddings Config
EMBEDDING_MODEL="BAAI/bge-small-en-v1.5"
EMBEDDING_DEVICE="cpu"

# RAG Hyperparameters
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.3
RAG_CHUNK_SIZE=512
RAG_CHUNK_OVERLAP=64

# Lightweight Execution (Prevents SIGKILL 137)
USE_MOCK_EMBEDDINGS=true
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 18 or higher
- **Python** 3.11 or higher
- **Qdrant** running locally
- **Ollama** running locally

---

### Step 1: Start Qdrant Vector Database
Run Qdrant locally using Docker:
```bash
docker run -p 6333:6333 -p 6334:6334 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```
Verify that Qdrant is running by visiting: http://localhost:6333/dashboard

---

### Step 2: Set up Ollama LLM
1. Install Ollama from [ollama.com](https://ollama.com).
2. Start the Ollama background daemon:
   ```bash
   ollama serve
   ```
3. Pull the required models:
   ```bash
   ollama pull llama3.2  # Primary model (3B parameters)
   ```

---

### Step 3: Run the Backend API
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Copy the environment configuration:
   ```bash
   cp .env.example .env
   # Add USE_MOCK_EMBEDDINGS=true if running on restricted CPU resources
   ```
5. Start the FastAPI application:
   ```bash
   uvicorn app.main:app --port 8000
   ```
   On startup, the backend automatically:
   - Connects to the local Qdrant server.
   - Verifies the Ollama LLM connection.
   - Loads the 14 enterprise markdown documents from `app/data/knowledge_base/`.
   - Chunks, embeds, and indexes the documents into the Qdrant `enterprise_knowledge` collection.

---

### Step 4: Run the Frontend Application
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install the JavaScript dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to: **http://localhost:5173**

---

## 🧪 End-to-End Testing & Verification

### 1. API Verification (Health Check)
Run a curl query to inspect the backend orchestration statuses:
```bash
curl -s http://localhost:8000/health | jq .
```
You should see:
- `"status": "healthy"`
- `"Qdrant Vector DB" -> status: "online"` with points indexed.
- `"Ollama LLM Engine" -> status: "online"` listing pulled models.

### 2. RAG Query Test (Grounded Response)
Ask the copilot an onboarding question:
```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the onboarding checklist for new engineers?", "use_rag": true}' | jq .
```
The response will include:
- A response string generated by Llama 3.2 using the fetched markdown context.
- Sources detailing document references, departments, and similarity scores.
- RAG pipeline execution logs tracing latency per step.

### 3. Permission Blocking Check (RBAC Verification)
Run a query for highly confidential executive details as an **Intern**:
```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is in the executive AI strategy roadmap?", "use_rag": true, "access_level": "public"}' | jq .
```
Because the document classification for the executive memo requires a **confidential/restricted** clearance level, the backend RAG pipeline blocks the query context, and the Hallucination Guard causes the LLM to refuse to answer.

---

## 📁 Project Structure

```
enterprise-ai-copilot/
├── backend/
│   ├── app/
│   │   ├── config/              # Configuration (Pydantic Settings)
│   │   ├── models/              # Pydantic schemas (FastAPI payloads)
│   │   ├── routers/             # Routers (chat, retrieval, health, docs)
│   │   ├── services/            # Logic (RAG, Ollama, Embeddings)
│   │   ├── repositories/        # Vector database client (Qdrant)
│   │   ├── middleware/          # Audit logging
│   │   └── data/knowledge_base/ # 14 Enterprise knowledge markdown files
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # Container setup
├── frontend/
│   ├── src/
│   │   ├── components/          # Sidebar, Chat, RAG Visualizers, etc.
│   │   ├── pages/               # 11 application views
│   │   ├── stores/              # State management (Zustand)
│   │   ├── api/                 # Axios clients
│   │   └── types/               # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml           # Complete containerized RAG stack
```

---

Built with ❤️ for production-ready Enterprise AI demonstrations.
