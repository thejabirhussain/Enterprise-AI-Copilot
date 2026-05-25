"""
Enterprise AI Copilot - Embedding Service
Wraps SentenceTransformers for production-grade embedding generation.

Embeddings are dense vector representations of text that capture semantic meaning.
Similar texts produce similar vectors (high cosine similarity).
We use BAAI/bge-small-en-v1.5: a SOTA 384-dimensional retrieval-optimized model.

Architecture:
  Text → SentenceTransformer → 384-dim float vector → Qdrant storage
"""

import logging
import numpy as np
from typing import List, Optional
from functools import lru_cache
import time

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Manages text embedding generation using SentenceTransformers.
    
    In a RAG system, embeddings are the bridge between natural language
    and vector mathematics. The same model MUST be used for:
    - Document ingestion (creating stored vectors)  
    - Query processing (creating search vectors)
    
    This ensures semantic compatibility in the vector space.
    """

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5", device: str = "cpu"):
        self.model_name = model_name
        self.device = device
        self._model = None
        self._model_loaded = False
        logger.info(f"EmbeddingService initialized | Model: {model_name} | Device: {device}")

    def _load_model(self):
        """Lazy-load the embedding model on first use."""
        if not self._model_loaded:
            try:
                import torch
                torch.set_num_threads(1)
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading embedding model: {self.model_name}")
                self._model = SentenceTransformer(self.model_name, device=self.device)
                self._model_loaded = True
                logger.info("Embedding model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                self._model_loaded = False
                raise

    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text string.
        
        The BGE model uses a special query prefix for retrieval tasks:
        "Represent this sentence: " improves retrieval performance.
        """
        try:
            self._load_model()
            # BGE models perform better with this prefix for queries
            if not text.startswith("Represent"):
                prefixed = f"Represent this sentence: {text}"
            else:
                prefixed = text
            
            embedding = self._model.encode(prefixed, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            # Return zero vector as fallback (will have low similarity scores)
            return [0.0] * 384

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts efficiently.
        Batch processing is significantly faster than individual calls.
        """
        try:
            self._load_model()
            embeddings = self._model.encode(
                texts,
                batch_size=32,
                normalize_embeddings=True,
                show_progress_bar=False
            )
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            logger.error(f"Batch embedding failed: {e}")
            return [[0.0] * 384 for _ in texts]

    def embed_document(self, text: str) -> List[float]:
        """
        Generate embedding for a document chunk.
        Documents don't use the query prefix — they're stored as-is.
        """
        try:
            self._load_model()
            embedding = self._model.encode(text, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Document embedding failed: {e}")
            return [0.0] * 384

    def compute_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Compute cosine similarity between two embedding vectors.
        Range: -1 (opposite) to 1 (identical). In practice: 0.3+ = relevant.
        """
        a = np.array(vec1)
        b = np.array(vec2)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))

    def project_to_2d(self, embeddings: List[List[float]], method: str = "pca") -> List[tuple]:
        """
        Project high-dimensional embeddings to 2D for visualization.
        Used by the EmbeddingVisualizer component on the frontend.
        
        PCA is fast and deterministic; t-SNE shows better clustering.
        """
        if len(embeddings) < 2:
            return [(0.0, 0.0)] * len(embeddings)
        
        try:
            X = np.array(embeddings)
            
            if method == "pca":
                from sklearn.decomposition import PCA
                pca = PCA(n_components=2)
                projected = pca.fit_transform(X)
            else:
                # t-SNE for better cluster visualization (slower)
                from sklearn.manifold import TSNE
                n_samples = X.shape[0]
                perplexity = min(30, n_samples - 1)
                tsne = TSNE(n_components=2, perplexity=perplexity, random_state=42)
                projected = tsne.fit_transform(X)
            
            # Normalize to [-1, 1] range for consistent visualization
            for i in range(2):
                col = projected[:, i]
                col_range = col.max() - col.min()
                if col_range > 0:
                    projected[:, i] = 2 * (col - col.min()) / col_range - 1
            
            return [(float(p[0]), float(p[1])) for p in projected]
            
        except Exception as e:
            logger.error(f"2D projection failed: {e}")
            # Fallback: random positions
            return [(float(np.random.uniform(-1, 1)), float(np.random.uniform(-1, 1)))
                    for _ in embeddings]

    def get_model_info(self) -> dict:
        """Return model metadata for the health endpoint."""
        return {
            "model_name": self.model_name,
            "device": self.device,
            "loaded": self._model_loaded,
            "embedding_dimensions": 384,
            "max_sequence_length": 512,
        }


# ─── Mock Embedding Service (Demo Mode) ───────────────────────────────────────

class MockEmbeddingService:
    """
    Fallback embedding service that generates deterministic mock embeddings.
    Used when SentenceTransformers is not installed or GPU is unavailable.
    Allows the app to demo without the full ML stack.
    """

    def __init__(self, model_name: str = "mock-bge-small-en", device: str = "cpu"):
        self.model_name = model_name
        self.device = device
        logger.warning("Using MockEmbeddingService — install sentence-transformers for real embeddings")

    def _text_to_seed(self, text: str) -> int:
        return sum(ord(c) for c in text[:50])

    def embed_text(self, text: str) -> List[float]:
        np.random.seed(self._text_to_seed(text))
        vec = np.random.randn(384).astype(float)
        return (vec / np.linalg.norm(vec)).tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]

    def embed_document(self, text: str) -> List[float]:
        return self.embed_text(text)

    def compute_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        a, b = np.array(vec1), np.array(vec2)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))

    def project_to_2d(self, embeddings: List[List[float]], method: str = "pca") -> List[tuple]:
        if len(embeddings) < 2:
            return [(0.0, 0.0)] * len(embeddings)
        np.random.seed(42)
        return [(float(np.random.uniform(-1, 1)), float(np.random.uniform(-1, 1)))
                for _ in embeddings]

    def get_model_info(self) -> dict:
        return {"model_name": self.model_name, "device": self.device,
                "loaded": True, "embedding_dimensions": 384, "mock": True}


def get_embedding_service(model_name: str = "BAAI/bge-small-en-v1.5", device: str = "cpu"):
    """
    Factory function — returns real or mock embedding service.
    Tries to load the real model; falls back to mock for demo mode.
    """
    from app.config.settings import settings
    if settings.USE_MOCK_EMBEDDINGS:
        logger.warning("Mock embedding service forced by configuration settings")
        return MockEmbeddingService(model_name=f"mock-{model_name}", device=device)
        
    try:
        import sentence_transformers  # noqa: F401
        return EmbeddingService(model_name=model_name, device=device)
    except ImportError:
        logger.warning("sentence-transformers not available, using mock service")
        return MockEmbeddingService(model_name=f"mock-{model_name}", device=device)
