"""
Enterprise AI Copilot - Pydantic Schemas
All request/response models for the API layer.
Strict typing ensures data integrity across the RAG pipeline.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime
import uuid


# ─── Document & Knowledge Base Models ─────────────────────────────────────────

class DocumentMetadata(BaseModel):
    """Metadata attached to each document chunk stored in Qdrant."""
    document_id: str
    title: str
    category: Literal[
        "hr_policy", "engineering", "security", "onboarding",
        "api_docs", "runbook", "incident", "architecture", "support", "deployment"
    ]
    source_file: str
    department: str
    access_level: Literal["public", "internal", "confidential", "restricted"] = "internal"
    chunk_index: int = 0
    total_chunks: int = 1
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class DocumentChunk(BaseModel):
    """A single chunk of a document with its embedding metadata."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    metadata: DocumentMetadata
    score: Optional[float] = None          # Similarity score from vector search


class DocumentUploadRequest(BaseModel):
    """Request to ingest a new document into the knowledge base."""
    title: str
    content: str
    category: str
    department: str = "Engineering"
    access_level: str = "internal"


class DocumentUploadResponse(BaseModel):
    """Response after ingesting a document."""
    document_id: str
    title: str
    chunks_created: int
    collection: str
    message: str


# ─── RAG Pipeline Models ───────────────────────────────────────────────────────

class WorkflowStep(BaseModel):
    """
    Represents one step in the RAG pipeline visualization.
    Frontend uses these to animate the workflow diagram.
    """
    step_id: str
    name: str
    description: str
    status: Literal["pending", "running", "completed", "failed"] = "pending"
    duration_ms: Optional[int] = None
    metadata: Dict[str, Any] = {}


class RAGWorkflow(BaseModel):
    """Full RAG pipeline execution trace for visualization."""
    query_id: str
    steps: List[WorkflowStep]
    total_duration_ms: int
    retrieval_count: int
    model_used: str


# ─── Chat Models ──────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    """A single message in a conversation."""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ChatRequest(BaseModel):
    """
    Incoming chat request from the frontend.
    Supports RAG mode toggle and model selection.
    """
    query: str = Field(..., min_length=1, max_length=4096)
    conversation_id: Optional[str] = None
    model: Optional[str] = None                    # Override default model
    use_rag: bool = True                           # Enable RAG retrieval
    stream: bool = False                           # Enable streaming response
    access_level: str = "internal"                 # Role-based access filter
    top_k: int = Field(default=5, ge=1, le=20)    # Retrieval count


class SourceCitation(BaseModel):
    """
    A retrieved source document chunk shown alongside AI responses.
    Critical for grounding — proves the answer comes from real docs.
    """
    chunk_id: str
    document_title: str
    document_category: str
    content_preview: str                           # First 200 chars
    full_content: str
    similarity_score: float = Field(ge=0.0, le=1.0)
    confidence_label: Literal["high", "medium", "low"]
    source_file: str
    department: str
    access_level: str
    chunk_index: int


class ChatResponse(BaseModel):
    """
    Complete AI response with RAG metadata for the frontend.
    Includes sources, workflow trace, and confidence scoring.
    """
    query_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    query: str
    response: str
    model_used: str
    use_rag: bool
    sources: List[SourceCitation] = []
    workflow: Optional[RAGWorkflow] = None
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    response_time_ms: int = 0
    tokens_used: Optional[int] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    hallucination_guarded: bool = False


# ─── Retrieval Models ─────────────────────────────────────────────────────────

class RetrievalRequest(BaseModel):
    """Standalone retrieval request (without LLM generation)."""
    query: str
    top_k: int = Field(default=5, ge=1, le=20)
    category_filter: Optional[str] = None
    access_level: str = "internal"
    similarity_threshold: float = Field(default=0.3, ge=0.0, le=1.0)


class RetrievalResponse(BaseModel):
    """Results from vector search without LLM generation."""
    query: str
    query_embedding_preview: List[float] = []      # First 10 dims for visualization
    retrieved_chunks: List[DocumentChunk]
    retrieval_time_ms: int
    collection_stats: Dict[str, Any] = {}


# ─── Embedding Models ─────────────────────────────────────────────────────────

class EmbeddingRequest(BaseModel):
    """Request to generate embeddings for visualization."""
    texts: List[str] = Field(..., min_length=1, max_length=20)


class EmbeddingPoint(BaseModel):
    """A single point in the 2D embedding visualization space."""
    text: str
    embedding_preview: List[float]                 # Full embedding
    x: float                                       # 2D projection (t-SNE/PCA)
    y: float
    cluster: int = 0
    label: str = ""


class EmbeddingResponse(BaseModel):
    """2D projection of embeddings for the visualization panel."""
    points: List[EmbeddingPoint]
    model: str
    dimensions: int
    projection_method: str = "PCA"


# ─── Health & System Models ───────────────────────────────────────────────────

class ServiceStatus(BaseModel):
    name: str
    status: Literal["online", "offline", "degraded"]
    latency_ms: Optional[int] = None
    details: Dict[str, Any] = {}


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"]
    version: str
    environment: str
    services: List[ServiceStatus]
    document_count: int = 0
    collection_name: str = ""
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ─── Conversation Models ──────────────────────────────────────────────────────

class ConversationSummary(BaseModel):
    """Summary of a conversation for the sidebar."""
    conversation_id: str
    title: str
    last_message: str
    message_count: int
    created_at: str
    model_used: str
