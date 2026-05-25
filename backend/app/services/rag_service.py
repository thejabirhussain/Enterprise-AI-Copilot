"""
Enterprise AI Copilot - RAG Orchestration Service
The core intelligence layer — orchestrates the full Retrieval-Augmented Generation pipeline.

RAG Pipeline:
  1. Receive user query
  2. Generate query embedding (semantic representation)
  3. Search Qdrant vector database (find similar documents)
  4. Retrieve top-K relevant chunks (ranked by cosine similarity)
  5. Format context (inject retrieved text into prompt)
  6. Generate response via Ollama (grounded in retrieved docs)
  7. Produce source citations (traceability + trust)
  8. Return structured response with workflow trace

This architecture prevents hallucination by grounding the LLM
in verified enterprise documents rather than parametric memory.
"""

import logging
import time
import uuid
from typing import List, Optional, AsyncGenerator

from app.models.schemas import (
    ChatRequest, ChatResponse, SourceCitation, WorkflowStep,
    RAGWorkflow, DocumentChunk, DocumentMetadata
)
from app.services.embedding_service import EmbeddingService, MockEmbeddingService
from app.services.llm_service import LLMService
from app.repositories.vector_repository import VectorRepository, MockVectorRepository
from app.config.settings import settings

logger = logging.getLogger(__name__)


def _confidence_label(score: float) -> str:
    """Map similarity score to human-readable confidence label."""
    if score >= 0.75:
        return "high"
    elif score >= 0.50:
        return "medium"
    return "low"


class RAGService:
    """
    Orchestrates the complete RAG pipeline.
    
    This is the heart of the Enterprise AI Copilot — it coordinates
    embeddings, vector search, and LLM generation to produce
    grounded, verifiable AI responses.
    """

    def __init__(
        self,
        embedding_service,
        vector_repository,
        llm_service: LLMService,
    ):
        self.embedding = embedding_service
        self.vector_repo = vector_repository
        self.llm = llm_service
        logger.info("RAGService initialized — pipeline ready")

    async def process_query(self, request: ChatRequest) -> ChatResponse:
        """
        Full RAG pipeline execution with workflow tracing.
        
        Every step is timed and recorded for the frontend visualization.
        This gives users transparency into how the AI reached its answer.
        """
        query_id = str(uuid.uuid4())
        conversation_id = request.conversation_id or str(uuid.uuid4())
        model = request.model or settings.OLLAMA_DEFAULT_MODEL
        pipeline_start = time.time()

        # ─── Workflow Steps (for visualization) ─────────────────────────
        steps: List[WorkflowStep] = [
            WorkflowStep(step_id="1", name="Query Received", 
                        description="User query received and validated",
                        status="completed", duration_ms=1),
        ]

        # ─── Step 2: Generate Query Embedding ────────────────────────────
        step_start = time.time()
        steps.append(WorkflowStep(step_id="2", name="Embedding Generation",
                                  description=f"Converting query to 384-dim vector using {settings.EMBEDDING_MODEL}",
                                  status="running"))
        
        query_embedding = self.embedding.embed_text(request.query)
        embed_time = int((time.time() - step_start) * 1000)
        steps[-1].status = "completed"
        steps[-1].duration_ms = embed_time
        steps[-1].metadata = {
            "model": settings.EMBEDDING_MODEL,
            "dimensions": len(query_embedding),
            "preview": query_embedding[:5],
        }
        logger.info(f"Query embedded in {embed_time}ms")

        # ─── Step 3 & 4: Vector Search + Retrieval ───────────────────────
        retrieved_chunks = []
        source_citations = []

        if request.use_rag:
            step_start = time.time()
            steps.append(WorkflowStep(step_id="3", name="Vector Search",
                                      description=f"Searching Qdrant with cosine similarity (top-{request.top_k})",
                                      status="running"))
            
            raw_results = self.vector_repo.search(
                query_vector=query_embedding,
                top_k=request.top_k,
                score_threshold=settings.RAG_SIMILARITY_THRESHOLD,
                access_level=request.access_level,
            )
            search_time = int((time.time() - step_start) * 1000)
            steps[-1].status = "completed"
            steps[-1].duration_ms = search_time
            steps[-1].metadata = {
                "results_found": len(raw_results),
                "threshold": settings.RAG_SIMILARITY_THRESHOLD,
                "top_score": raw_results[0]["score"] if raw_results else 0,
            }

            # ─── Step 4: Build Source Citations ──────────────────────────
            steps.append(WorkflowStep(step_id="4", name="Chunk Retrieval",
                                      description="Extracting relevant document chunks with metadata",
                                      status="running"))
            
            for result in raw_results:
                payload = result["payload"]
                score = result["score"]
                
                chunk_for_llm = {
                    "title": payload.get("title", "Unknown"),
                    "content": payload.get("content", ""),
                    "category": payload.get("category", ""),
                    "score": score,
                }
                retrieved_chunks.append(chunk_for_llm)
                
                citation = SourceCitation(
                    chunk_id=payload.get("chunk_id", result["id"]),
                    document_title=payload.get("title", "Unknown Document"),
                    document_category=payload.get("category", "general"),
                    content_preview=payload.get("content", "")[:200] + "...",
                    full_content=payload.get("content", ""),
                    similarity_score=score,
                    confidence_label=_confidence_label(score),
                    source_file=payload.get("source_file", ""),
                    department=payload.get("department", "General"),
                    access_level=payload.get("access_level", "internal"),
                    chunk_index=payload.get("chunk_index", 0),
                )
                source_citations.append(citation)
            
            steps[-1].status = "completed"
            steps[-1].duration_ms = 2

        # ─── Step 5: Context Injection ─────────────────────────────────────
        steps.append(WorkflowStep(step_id="5", name="Context Injection",
                                  description="Injecting retrieved documents into LLM prompt",
                                  status="running"))
        context_chars = sum(len(c.get("content", "")) for c in retrieved_chunks)
        steps[-1].status = "completed"
        steps[-1].duration_ms = 1
        steps[-1].metadata = {
            "chunks_injected": len(retrieved_chunks),
            "context_chars": context_chars,
            "use_rag": request.use_rag,
        }

        # ─── Step 6: LLM Generation ───────────────────────────────────────
        step_start = time.time()
        steps.append(WorkflowStep(step_id="6", name="LLM Generation",
                                  description=f"Generating grounded response via {model} (Ollama)",
                                  status="running"))
        
        response_text, tokens_used = await self.llm.generate(
            query=request.query,
            context_chunks=retrieved_chunks,
            model=model,
            use_rag=request.use_rag,
        )
        llm_time = int((time.time() - step_start) * 1000)
        steps[-1].status = "completed"
        steps[-1].duration_ms = llm_time
        steps[-1].metadata = {
            "model": model,
            "tokens": tokens_used,
            "context_docs": len(retrieved_chunks),
        }

        # ─── Step 7: Final Response ───────────────────────────────────────
        steps.append(WorkflowStep(step_id="7", name="Grounded Response",
                                  description="Response grounded in enterprise knowledge delivered",
                                  status="completed", duration_ms=1))

        total_ms = int((time.time() - pipeline_start) * 1000)

        # ─── Confidence Score ──────────────────────────────────────────────
        # Weighted average of top retrieved chunk scores
        if source_citations:
            top_scores = sorted([c.similarity_score for c in source_citations], reverse=True)
            confidence = sum(s * (0.8 ** i) for i, s in enumerate(top_scores[:3])) / min(3, len(top_scores))
        else:
            confidence = 0.0

        workflow = RAGWorkflow(
            query_id=query_id,
            steps=steps,
            total_duration_ms=total_ms,
            retrieval_count=len(retrieved_chunks),
            model_used=model,
        )

        logger.info(
            f"RAG pipeline complete | query_id={query_id} | "
            f"sources={len(source_citations)} | time={total_ms}ms | model={model}"
        )

        return ChatResponse(
            query_id=query_id,
            conversation_id=conversation_id,
            query=request.query,
            response=response_text,
            model_used=model,
            use_rag=request.use_rag,
            sources=source_citations,
            workflow=workflow,
            confidence_score=round(min(confidence, 1.0), 3),
            response_time_ms=total_ms,
            tokens_used=tokens_used,
            hallucination_guarded=settings.ENABLE_HALLUCINATION_GUARD,
        )
