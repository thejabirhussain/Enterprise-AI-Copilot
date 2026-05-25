"""Embeddings router — generate and visualize embeddings."""
import logging
from fastapi import APIRouter
from app.models.schemas import EmbeddingRequest, EmbeddingResponse, EmbeddingPoint

router = APIRouter(prefix="/embeddings", tags=["Embeddings"])
logger = logging.getLogger(__name__)


@router.post("", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """
    Generate embeddings for multiple texts and return 2D projections.
    Used by the EmbeddingVisualizer component on the frontend.
    
    The 2D coordinates enable visualizing semantic similarity:
    - Close points = semantically similar texts
    - Distant points = unrelated texts
    """
    from app.main import get_services
    services = get_services()
    embedding_service = services["embedding_service"]
    
    embeddings = embedding_service.embed_batch(request.texts)
    projections = embedding_service.project_to_2d(embeddings, method="pca")
    
    model_info = embedding_service.get_model_info()
    
    points = []
    for i, (text, embedding, (x, y)) in enumerate(zip(request.texts, embeddings, projections)):
        points.append(EmbeddingPoint(
            text=text,
            embedding_preview=embedding[:20],  # First 20 dims
            x=x,
            y=y,
            cluster=i % 5,  # Simple cluster assignment
            label=text[:30] + "..." if len(text) > 30 else text,
        ))
    
    return EmbeddingResponse(
        points=points,
        model=model_info.get("model_name", "unknown"),
        dimensions=model_info.get("embedding_dimensions", 384),
        projection_method="PCA",
    )


@router.get("/model-info")
async def get_model_info():
    """Get information about the current embedding model."""
    from app.main import get_services
    services = get_services()
    return services["embedding_service"].get_model_info()
