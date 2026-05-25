"""
Enterprise AI Copilot - FastAPI Application Entry Point

Clean Architecture principles applied:
- Dependency Injection via application state
- Separation of concerns (routers, services, repositories)
- Lifespan management for startup/shutdown
- Middleware stack for cross-cutting concerns

Service initialization order:
  1. Embedding Service (SentenceTransformers)
  2. Vector Repository (Qdrant)
  3. LLM Service (Ollama)
  4. Document Service (ingestion + chunking)
  5. RAG Service (orchestration)
  6. Knowledge Base Loading (from /data/knowledge_base)
"""

import logging
import sys
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.middleware.logging_middleware import AuditLoggingMiddleware
from app.routers import chat, documents, retrieval, embeddings, sources, workflow, health
from app.services.embedding_service import get_embedding_service
from app.repositories.vector_repository import get_vector_repository
from app.services.llm_service import LLMService
from app.services.document_service import DocumentService
from app.services.rag_service import RAGService

# ─── Logging Configuration ────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ─── Global Service Registry (Dependency Injection Container) ─────────────────
_services: Dict[str, Any] = {}


def get_services() -> Dict[str, Any]:
    """Return the global service registry for dependency injection."""
    return _services


# ─── Application Lifespan ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup/shutdown lifecycle.
    All services are initialized once and shared across requests.
    """
    logger.info("=" * 60)
    logger.info(f"  {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"  Environment: {settings.ENVIRONMENT}")
    logger.info("=" * 60)

    # ── 1. Embedding Service ──────────────────────────────────────────
    logger.info("Initializing Embedding Service...")
    embedding_service = get_embedding_service(
        model_name=settings.EMBEDDING_MODEL,
        device=settings.EMBEDDING_DEVICE,
    )
    _services["embedding_service"] = embedding_service
    logger.info(f"  ✓ Embedding Model: {settings.EMBEDDING_MODEL}")

    # ── 2. Vector Repository ──────────────────────────────────────────
    logger.info("Connecting to Qdrant...")
    vector_repo = get_vector_repository(
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
        collection=settings.QDRANT_COLLECTION_NAME,
        vector_size=settings.QDRANT_VECTOR_SIZE,
    )
    _services["vector_repo"] = vector_repo
    status = "✓ Connected" if vector_repo.is_connected() else "⚠ Mock Mode (Qdrant offline)"
    logger.info(f"  {status}")

    # ── 3. LLM Service ────────────────────────────────────────────────
    logger.info("Initializing LLM Service (Ollama)...")
    llm_service = LLMService(
        base_url=settings.OLLAMA_BASE_URL,
        default_model=settings.OLLAMA_DEFAULT_MODEL,
        timeout=settings.OLLAMA_TIMEOUT,
    )
    _services["llm_service"] = llm_service
    ollama_available = await llm_service.check_availability()
    status = "✓ Ollama Connected" if ollama_available else "⚠ Demo Mode (Ollama offline)"
    logger.info(f"  {status} | Default Model: {settings.OLLAMA_DEFAULT_MODEL}")

    # ── 4. Document Service ───────────────────────────────────────────
    logger.info("Initializing Document Service...")
    document_service = DocumentService(
        embedding_service=embedding_service,
        vector_repository=vector_repo,
    )
    _services["document_service"] = document_service

    # ── 5. RAG Service ────────────────────────────────────────────────
    logger.info("Initializing RAG Orchestration Service...")
    rag_service = RAGService(
        embedding_service=embedding_service,
        vector_repository=vector_repo,
        llm_service=llm_service,
    )
    _services["rag_service"] = rag_service
    logger.info("  ✓ RAG Pipeline: 7-step pipeline active")

    # ── 6. Load Knowledge Base ────────────────────────────────────────
    logger.info("Loading Enterprise Knowledge Base...")
    total_chunks = await document_service.load_knowledge_base()
    logger.info(f"  ✓ Knowledge Base: {total_chunks} chunks loaded")

    logger.info("=" * 60)
    logger.info("  🚀 Enterprise AI Copilot is READY")
    logger.info(f"  📡 API: http://{settings.HOST}:{settings.PORT}")
    logger.info(f"  📚 Docs: http://{settings.HOST}:{settings.PORT}/docs")
    logger.info("=" * 60)

    yield  # Application runs

    # ── Shutdown ──────────────────────────────────────────────────────
    logger.info("Shutting down Enterprise AI Copilot...")
    _services.clear()


# ─── FastAPI Application ──────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Enterprise AI Copilot API

A production-ready RAG (Retrieval-Augmented Generation) API powering
enterprise AI workflows with semantic search and grounded responses.

### Architecture
- **RAG Pipeline**: 7-step pipeline (embed → search → retrieve → inject → generate)
- **Vector DB**: Qdrant with cosine similarity search
- **Embeddings**: BAAI/bge-small-en-v1.5 (384 dimensions)
- **LLM**: Ollama (Llama3, Mistral, DeepSeek, Phi-3)

### Key Endpoints
- `POST /chat` — Main AI copilot with RAG
- `POST /retrieval` — Standalone vector search
- `POST /embeddings` — Embedding generation + 2D visualization
- `GET /workflow` — RAG pipeline definition
- `GET /health` — System health status
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── Middleware Stack ─────────────────────────────────────────────────────────
app.add_middleware(AuditLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(retrieval.router)
app.include_router(embeddings.router)
app.include_router(sources.router)
app.include_router(workflow.router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }
