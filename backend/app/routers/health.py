"""Health check router — system status for all services."""
import time
import logging
from fastapi import APIRouter, Depends
from app.models.schemas import HealthResponse, ServiceStatus
from app.config.settings import settings

router = APIRouter(prefix="/health", tags=["Health"])
logger = logging.getLogger(__name__)

@router.get("", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check for all enterprise AI services.
    Frontend uses this to display system status indicators.
    """
    from app.main import get_services
    services_state = get_services()
    
    service_statuses = []
    
    # ─── Check Qdrant ─────────────────────────────────────────────────
    qdrant_start = time.time()
    vector_repo = services_state.get("vector_repo")
    qdrant_connected = vector_repo.is_connected() if vector_repo else False
    qdrant_latency = int((time.time() - qdrant_start) * 1000)
    qdrant_stats = vector_repo.get_collection_stats() if vector_repo else {}
    
    service_statuses.append(ServiceStatus(
        name="Qdrant Vector DB",
        status="online" if qdrant_connected else "offline",
        latency_ms=qdrant_latency,
        details=qdrant_stats,
    ))
    
    # ─── Check Ollama ─────────────────────────────────────────────────
    llm_service = services_state.get("llm_service")
    ollama_start = time.time()
    ollama_available = False
    ollama_info = {}
    if llm_service:
        ollama_available = await llm_service.check_availability()
        ollama_info = await llm_service.get_service_info()
    ollama_latency = int((time.time() - ollama_start) * 1000)
    
    service_statuses.append(ServiceStatus(
        name="Ollama LLM Engine",
        status="online" if ollama_available else "offline",
        latency_ms=ollama_latency,
        details=ollama_info,
    ))
    
    # ─── Check Embedding Service ───────────────────────────────────────
    embedding_service = services_state.get("embedding_service")
    embed_info = embedding_service.get_model_info() if embedding_service else {}
    service_statuses.append(ServiceStatus(
        name="Embedding Model",
        status="online" if embed_info.get("loaded", False) else "degraded",
        latency_ms=0,
        details=embed_info,
    ))
    
    # ─── RAG Pipeline ─────────────────────────────────────────────────
    service_statuses.append(ServiceStatus(
        name="RAG Pipeline",
        status="online",
        details={"pipeline": "active", "steps": 7},
    ))
    
    doc_service = services_state.get("document_service")
    doc_count = len(doc_service.list_documents()) if doc_service else 0
    
    overall = "healthy"
    if not qdrant_connected and not ollama_available:
        overall = "degraded"
    
    return HealthResponse(
        status=overall,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        services=service_statuses,
        document_count=doc_count,
        collection_name=settings.QDRANT_COLLECTION_NAME,
    )
