"""
Enterprise AI Copilot - Document Service
Handles enterprise document ingestion, chunking, and knowledge base management.

Document Processing Pipeline:
  Raw Text → Chunk Splitting → Embedding Generation → Qdrant Storage

Chunking Strategy:
  - Fixed-size chunks (512 chars) with overlap (64 chars)
  - Overlap prevents important context from being split across chunks
  - Metadata preserved per chunk for filtering and citation
"""

import logging
import uuid
import os
import glob
from typing import List, Optional
from datetime import datetime

from app.models.schemas import (
    DocumentChunk, DocumentMetadata, DocumentUploadRequest, DocumentUploadResponse
)
from app.config.settings import settings

logger = logging.getLogger(__name__)


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 64) -> List[str]:
    """
    Split text into overlapping chunks for embedding.
    
    Why overlap? Text often spans sentence boundaries. Overlap ensures
    that concepts split across chunks are captured in at least one chunk.
    
    Example: chunk_size=512, overlap=64
    Chunk 1: chars 0-512
    Chunk 2: chars 448-960  (64 char overlap with chunk 1)
    Chunk 3: chars 896-1408
    """
    if not text or len(text) <= chunk_size:
        return [text] if text else []
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        
        # Try to break at sentence boundary for cleaner chunks
        if end < len(text):
            last_period = chunk.rfind('. ')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)
            if break_point > chunk_size * 0.5:  # Only if break is in second half
                chunk = text[start:start + break_point + 1]
        
        chunks.append(chunk.strip())
        if start + len(chunk) >= len(text):
            break
        start += len(chunk) - overlap
    
    return [c for c in chunks if len(c) > 50]  # Filter very short chunks


class DocumentService:
    """
    Manages enterprise knowledge base documents.
    Handles ingestion from files, API uploads, and retrieval.
    """

    def __init__(self, embedding_service, vector_repository):
        self.embedding = embedding_service
        self.vector_repo = vector_repository
        self._ingested_docs: List[dict] = []  # Track ingested docs in memory

    async def ingest_document(self, request: DocumentUploadRequest) -> DocumentUploadResponse:
        """
        Ingest a single document into the knowledge base.
        Chunks it, embeds each chunk, and stores in Qdrant.
        """
        document_id = str(uuid.uuid4())
        
        # Split document into chunks
        chunks_text = chunk_text(
            request.content,
            chunk_size=settings.RAG_CHUNK_SIZE,
            overlap=settings.RAG_CHUNK_OVERLAP,
        )
        
        if not chunks_text:
            return DocumentUploadResponse(
                document_id=document_id,
                title=request.title,
                chunks_created=0,
                collection=settings.QDRANT_COLLECTION_NAME,
                message="No valid content to ingest",
            )
        
        # Create DocumentChunk objects
        chunks = []
        for i, chunk_text_content in enumerate(chunks_text):
            metadata = DocumentMetadata(
                document_id=document_id,
                title=request.title,
                category=request.category,
                source_file=f"{request.title.lower().replace(' ', '_')}.md",
                department=request.department,
                access_level=request.access_level,
                chunk_index=i,
                total_chunks=len(chunks_text),
            )
            chunk = DocumentChunk(
                id=f"{document_id}_chunk_{i}",
                content=chunk_text_content,
                metadata=metadata,
            )
            chunks.append(chunk)
        
        # Generate embeddings for all chunks
        embeddings = self.embedding.embed_batch([c.content for c in chunks])
        
        # Store in Qdrant
        stored = self.vector_repo.upsert_chunks(chunks, embeddings)
        
        # Track in memory
        self._ingested_docs.append({
            "document_id": document_id,
            "title": request.title,
            "category": request.category,
            "department": request.department,
            "chunks": len(chunks),
            "ingested_at": datetime.utcnow().isoformat(),
        })
        
        logger.info(f"Ingested document '{request.title}' | {len(chunks)} chunks | id={document_id}")
        
        return DocumentUploadResponse(
            document_id=document_id,
            title=request.title,
            chunks_created=stored,
            collection=settings.QDRANT_COLLECTION_NAME,
            message=f"Successfully ingested {stored} chunks from '{request.title}'",
        )

    async def load_knowledge_base(self) -> int:
        """
        Load all enterprise documents from the knowledge base directory.
        Called on application startup to populate Qdrant.
        Returns total chunks ingested.
        """
        kb_path = settings.KNOWLEDGE_BASE_PATH
        
        if not os.path.exists(kb_path):
            logger.warning(f"Knowledge base path not found: {kb_path}")
            return 0
        
        md_files = glob.glob(os.path.join(kb_path, "*.md"))
        
        if not md_files:
            logger.warning("No markdown files found in knowledge base")
            return 0
        
        total_chunks = 0
        
        for filepath in md_files:
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Parse metadata from file header (YAML frontmatter style)
                metadata = self._parse_frontmatter(content, filepath)
                clean_content = self._strip_frontmatter(content)
                
                request = DocumentUploadRequest(
                    title=metadata.get("title", os.path.basename(filepath).replace(".md", "")),
                    content=clean_content,
                    category=metadata.get("category", "engineering"),
                    department=metadata.get("department", "Engineering"),
                    access_level=metadata.get("access_level", "internal"),
                )
                
                result = await self.ingest_document(request)
                total_chunks += result.chunks_created
                logger.info(f"Loaded: {result.title} ({result.chunks_created} chunks)")
                
            except Exception as e:
                logger.error(f"Failed to load {filepath}: {e}")
        
        logger.info(f"Knowledge base loaded: {len(md_files)} documents, {total_chunks} total chunks")
        return total_chunks

    def _parse_frontmatter(self, content: str, filepath: str) -> dict:
        """Parse YAML-like frontmatter from markdown files."""
        meta = {}
        if content.startswith("---"):
            end = content.find("---", 3)
            if end > 0:
                frontmatter = content[3:end].strip()
                for line in frontmatter.split("\n"):
                    if ":" in line:
                        key, val = line.split(":", 1)
                        meta[key.strip()] = val.strip().strip('"')
        
        # Fallback from filename
        if "title" not in meta:
            basename = os.path.basename(filepath).replace(".md", "")
            meta["title"] = basename.replace("_", " ").title()
        
        return meta

    def _strip_frontmatter(self, content: str) -> str:
        """Remove YAML frontmatter from markdown content."""
        if content.startswith("---"):
            end = content.find("---", 3)
            if end > 0:
                return content[end + 3:].strip()
        return content

    def list_documents(self) -> List[dict]:
        """Return list of ingested documents."""
        return self._ingested_docs

    def get_stats(self) -> dict:
        """Return knowledge base statistics."""
        categories = {}
        for doc in self._ingested_docs:
            cat = doc.get("category", "unknown")
            categories[cat] = categories.get(cat, 0) + 1
        
        return {
            "total_documents": len(self._ingested_docs),
            "total_chunks": sum(d.get("chunks", 0) for d in self._ingested_docs),
            "categories": categories,
            "vector_store": self.vector_repo.get_collection_stats(),
        }
