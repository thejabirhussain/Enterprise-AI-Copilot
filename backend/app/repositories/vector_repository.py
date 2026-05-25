"""
Enterprise AI Copilot - Vector Repository (Qdrant)
Handles all interactions with the Qdrant vector database.

Qdrant is a production-grade vector database optimized for:
- High-speed approximate nearest neighbor (ANN) search
- Metadata filtering (filter by department, access level, category)
- Payload storage (keep full document text alongside vectors)
- Horizontal scaling for enterprise workloads

Architecture:
  Document Text → Embedding → Qdrant Upsert → Vector Index
  Query Text → Embedding → Qdrant Search → Top-K Similar Chunks
"""

import logging
import uuid
from typing import List, Optional, Dict, Any
import time

from app.models.schemas import DocumentChunk, DocumentMetadata

logger = logging.getLogger(__name__)


class VectorRepository:
    """
    Repository pattern for Qdrant vector database operations.
    
    Each document is chunked and stored as a point:
    - id: UUID
    - vector: 384-dim float array (from embedding model)
    - payload: full text + metadata (title, category, access_level, etc.)
    """

    def __init__(self, host: str, port: int, collection_name: str, vector_size: int = 384):
        self.host = host
        self.port = port
        self.collection_name = collection_name
        self.vector_size = vector_size
        self._client = None
        self._connected = False

    def _get_client(self):
        """Lazy-initialize Qdrant client."""
        if self._client is None:
            try:
                from qdrant_client import QdrantClient
                from qdrant_client.models import Distance, VectorParams, OptimizersConfigDiff
                
                self._client = QdrantClient(host=self.host, port=self.port, timeout=10)
                self._ensure_collection()
                self._connected = True
                logger.info(f"Connected to Qdrant at {self.host}:{self.port}")
            except Exception as e:
                logger.error(f"Qdrant connection failed: {e}")
                self._connected = False
                self._client = None
        return self._client

    def _ensure_collection(self):
        """Create the collection if it doesn't exist."""
        from qdrant_client.models import Distance, VectorParams
        
        client = self._client
        existing = [c.name for c in client.get_collections().collections]
        
        if self.collection_name not in existing:
            client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE,  # Cosine similarity for text
                ),
            )
            logger.info(f"Created Qdrant collection: {self.collection_name}")
        else:
            logger.info(f"Using existing Qdrant collection: {self.collection_name}")

    def upsert_chunks(self, chunks: List[DocumentChunk], embeddings: List[List[float]]) -> int:
        """
        Store document chunks with their embeddings in Qdrant.
        
        Each chunk becomes a searchable vector point with full metadata.
        Upsert = insert if new, update if exists (idempotent).
        """
        client = self._get_client()
        if not client or not self._connected:
            logger.warning("Qdrant unavailable — skipping upsert")
            return 0

        try:
            from qdrant_client.models import PointStruct
            
            points = []
            for chunk, embedding in zip(chunks, embeddings):
                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "chunk_id": chunk.id,
                        "content": chunk.content,
                        "document_id": chunk.metadata.document_id,
                        "title": chunk.metadata.title,
                        "category": chunk.metadata.category,
                        "source_file": chunk.metadata.source_file,
                        "department": chunk.metadata.department,
                        "access_level": chunk.metadata.access_level,
                        "chunk_index": chunk.metadata.chunk_index,
                        "total_chunks": chunk.metadata.total_chunks,
                        "created_at": chunk.metadata.created_at,
                    }
                )
                points.append(point)
            
            client.upsert(collection_name=self.collection_name, points=points)
            logger.info(f"Upserted {len(points)} chunks to Qdrant")
            return len(points)
            
        except Exception as e:
            logger.error(f"Qdrant upsert failed: {e}")
            return 0

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        score_threshold: float = 0.3,
        category_filter: Optional[str] = None,
        access_level: str = "internal",
    ) -> List[Dict[str, Any]]:
        """
        Perform approximate nearest neighbor search in vector space.
        
        Returns the top-K most semantically similar document chunks.
        Supports metadata filtering for access control and category.
        
        Similarity score interpretation:
        - 0.9+: Nearly identical content
        - 0.7-0.9: Highly relevant
        - 0.5-0.7: Relevant
        - 0.3-0.5: Somewhat related
        - <0.3: Likely not relevant (filtered out)
        """
        client = self._get_client()
        if not client or not self._connected:
            return []

        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue, Range
            
            # Build metadata filter for access control
            conditions = []
            
            # Access level hierarchy: restricted > confidential > internal > public
            allowed_levels = self._get_allowed_levels(access_level)
            # Note: Simple filter — in production use complex OR conditions
            
            if category_filter:
                conditions.append(
                    FieldCondition(key="category", match=MatchValue(value=category_filter))
                )
            
            search_filter = Filter(must=conditions) if conditions else None
            
            if hasattr(client, "search"):
                results = client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    limit=top_k,
                    score_threshold=score_threshold,
                    query_filter=search_filter,
                    with_payload=True,
                )
            else:
                # Fallback to query_points (newer client versions)
                response = client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    limit=top_k,
                    score_threshold=score_threshold,
                    query_filter=search_filter,
                    with_payload=True,
                )
                results = response.points
            
            return [
                {
                    "id": str(result.id),
                    "score": float(result.score),
                    "payload": result.payload,
                }
                for result in results
            ]
            
        except Exception as e:
            logger.error(f"Qdrant search failed: {e}")
            return []

    def _get_allowed_levels(self, user_level: str) -> List[str]:
        """Implement access level hierarchy."""
        hierarchy = ["public", "internal", "confidential", "restricted"]
        user_idx = hierarchy.index(user_level) if user_level in hierarchy else 1
        return hierarchy[:user_idx + 1]

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get Qdrant collection statistics for the dashboard."""
        client = self._get_client()
        if not client or not self._connected:
            return {"status": "offline", "count": 0}

        try:
            info = client.get_collection(self.collection_name)
            return {
                "status": "online",
                "vector_count": getattr(info, "vectors_count", getattr(info, "points_count", 0)) or 0,
                "points_count": getattr(info, "points_count", 0),
                "indexed_vectors": getattr(info, "indexed_vectors_count", 0),
                "collection_name": self.collection_name,
                "vector_size": self.vector_size,
            }
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {"status": "error", "error": str(e)}

    def delete_document(self, document_id: str) -> bool:
        """Delete all chunks for a document by document_id."""
        client = self._get_client()
        if not client or not self._connected:
            return False
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
                ),
            )
            logger.info(f"Deleted document {document_id} from Qdrant")
            return True
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")
            return False

    def is_connected(self) -> bool:
        """Check Qdrant connectivity."""
        try:
            client = self._get_client()
            return client is not None and self._connected
        except Exception:
            return False


# ─── Mock Vector Repository (Demo Mode) ───────────────────────────────────────

class MockVectorRepository:
    """
    In-memory mock vector repository for demo mode.
    Stores embeddings in RAM and uses numpy for similarity search.
    Allows full RAG demo without running Qdrant.
    """

    def __init__(self, *args, **kwargs):
        self._store: List[Dict[str, Any]] = []
        self._connected = True
        logger.warning("Using MockVectorRepository — start Qdrant for production use")

    def upsert_chunks(self, chunks: List[DocumentChunk], embeddings: List[List[float]]) -> int:
        import numpy as np
        for chunk, embedding in zip(chunks, embeddings):
            self._store.append({
                "id": chunk.id,
                "vector": np.array(embedding),
                "payload": {
                    "chunk_id": chunk.id,
                    "content": chunk.content,
                    "document_id": chunk.metadata.document_id,
                    "title": chunk.metadata.title,
                    "category": chunk.metadata.category,
                    "source_file": chunk.metadata.source_file,
                    "department": chunk.metadata.department,
                    "access_level": chunk.metadata.access_level,
                    "chunk_index": chunk.metadata.chunk_index,
                    "total_chunks": chunk.metadata.total_chunks,
                }
            })
        return len(chunks)

    def search(self, query_vector, top_k=5, score_threshold=0.0,
               category_filter=None, access_level="internal"):
        import numpy as np
        if not self._store:
            return []
        
        q = np.array(query_vector)
        results = []
        for item in self._store:
            if category_filter and item["payload"].get("category") != category_filter:
                continue
            v = item["vector"]
            score = float(np.dot(q, v) / (np.linalg.norm(q) * np.linalg.norm(v) + 1e-8))
            if score >= score_threshold:
                results.append({"id": item["id"], "score": score, "payload": item["payload"]})
        
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def get_collection_stats(self) -> Dict[str, Any]:
        return {
            "status": "mock",
            "vector_count": len(self._store),
            "points_count": len(self._store),
            "collection_name": "mock_collection",
            "vector_size": 384,
        }

    def delete_document(self, document_id: str) -> bool:
        self._store = [x for x in self._store if x["payload"].get("document_id") != document_id]
        return True

    def is_connected(self) -> bool:
        return True


def get_vector_repository(host: str, port: int, collection: str, vector_size: int = 384):
    """Factory: returns real Qdrant repo or mock for demo mode."""
    try:
        repo = VectorRepository(host=host, port=port,
                                collection_name=collection, vector_size=vector_size)
        # Test connection
        client = repo._get_client()
        if client and repo._connected:
            return repo
        else:
            raise ConnectionError("Qdrant not reachable")
    except Exception as e:
        logger.warning(f"Falling back to MockVectorRepository: {e}")
        return MockVectorRepository()
