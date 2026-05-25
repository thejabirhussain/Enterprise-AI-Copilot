"""
Enterprise AI Copilot - Configuration Settings
Using Pydantic BaseSettings for type-safe, environment-driven configuration.
Supports multiple deployment environments (local, staging, production).
"""

from pydantic_settings import BaseSettings
from typing import Literal
import os


class Settings(BaseSettings):
    """
    Central configuration for all services.
    Values are loaded from environment variables with sensible defaults
    for local development with Ollama + Qdrant running via Docker Compose.
    """

    # ─── Application ─────────────────────────────────────────────────────────
    APP_NAME: str = "Enterprise AI Copilot"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True

    # ─── API Server ───────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",
        "http://frontend:5173",    # Docker service name
    ]

    # ─── Ollama (Local LLM Inference) ─────────────────────────────────────────
    # Ollama runs locally or via Docker, serving open-source LLMs
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_DEFAULT_MODEL: str = "llama3.2"          # Primary model
    OLLAMA_FALLBACK_MODEL: str = "mistral"          # Fallback if primary unavailable
    OLLAMA_TIMEOUT: int = 120                        # Seconds for LLM response
    OLLAMA_TEMPERATURE: float = 0.1                 # Low temp for factual enterprise responses
    OLLAMA_MAX_TOKENS: int = 2048

    # Available models for UI model switching
    AVAILABLE_MODELS: list[str] = [
        "llama3.2",
        "llama3.1",
        "mistral",
        "deepseek-r1",
        "phi3",
        "qwen2.5",
    ]

    # ─── Qdrant (Vector Database) ─────────────────────────────────────────────
    # Qdrant stores document embeddings for semantic similarity search
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION_NAME: str = "enterprise_knowledge"
    QDRANT_VECTOR_SIZE: int = 384                   # BAAI/bge-small-en-v1.5 dimension

    # ─── Embedding Model (SentenceTransformers) ───────────────────────────────
    # BAAI/bge-small-en-v1.5 is a high-quality, lightweight embedding model
    # Dimensions: 384 | Optimized for retrieval tasks
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_BATCH_SIZE: int = 32
    EMBEDDING_DEVICE: str = "cpu"                   # Use "cuda" if GPU available
    USE_MOCK_EMBEDDINGS: bool = False

    # ─── RAG Pipeline Configuration ───────────────────────────────────────────
    RAG_TOP_K: int = 5                              # Number of chunks to retrieve
    RAG_SIMILARITY_THRESHOLD: float = 0.3           # Minimum similarity score
    RAG_CHUNK_SIZE: int = 512                       # Characters per document chunk
    RAG_CHUNK_OVERLAP: int = 64                     # Overlap between chunks
    RAG_MAX_CONTEXT_LENGTH: int = 3000             # Max chars injected into prompt

    # ─── Enterprise Features ──────────────────────────────────────────────────
    ENABLE_AUDIT_LOGGING: bool = True
    ENABLE_STREAMING: bool = True
    ENABLE_CONFIDENCE_SCORING: bool = True
    ENABLE_HALLUCINATION_GUARD: bool = True         # Refuse to answer outside context

    # ─── Data Paths ───────────────────────────────────────────────────────────
    KNOWLEDGE_BASE_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "knowledge_base"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Singleton settings instance
settings = Settings()
