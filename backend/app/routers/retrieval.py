"""Retrieval router — standalone vector search without LLM generation."""
import logging
import time
from fastapi import APIRouter
from app.models.schemas import RetrievalRequest, RetrievalResponse, DocumentChunk, DocumentMetadata

router = APIRouter(prefix="/retrieval", tags=["Retrieval"])
logger = logging.getLogger(__name__)


@router.post("", response_model=RetrievalResponse)
async def retrieve(request: RetrievalRequest):
    """
    Pure vector similarity search — no LLM generation.
    Useful for testing retrieval quality and building visualization demos.
    """
    from app.main import get_services
    services = get_services()
    embedding_service = services["embedding_service"]
    vector_repo = services["vector_repo"]
    
    start = time.time()
    query_embedding = embedding_service.embed_text(request.query)
    
    raw_results = vector_repo.search(
        query_vector=query_embedding,
        top_k=request.top_k,
        score_threshold=request.similarity_threshold,
        category_filter=request.category_filter,
        access_level=request.access_level,
    )
    elapsed = int((time.time() - start) * 1000)
    
    chunks = []
    for result in raw_results:
        payload = result["payload"]
        meta = DocumentMetadata(
            document_id=payload.get("document_id", ""),
            title=payload.get("title", ""),
            category=payload.get("category", "engineering"),
            source_file=payload.get("source_file", ""),
            department=payload.get("department", ""),
            access_level=payload.get("access_level", "internal"),
            chunk_index=payload.get("chunk_index", 0),
            total_chunks=payload.get("total_chunks", 1),
        )
        chunk = DocumentChunk(
            id=payload.get("chunk_id", result["id"]),
            content=payload.get("content", ""),
            metadata=meta,
            score=result["score"],
        )
        chunks.append(chunk)
    
    return RetrievalResponse(
        query=request.query,
        query_embedding_preview=query_embedding[:10],
        retrieved_chunks=chunks,
        retrieval_time_ms=elapsed,
        collection_stats=vector_repo.get_collection_stats(),
    )
