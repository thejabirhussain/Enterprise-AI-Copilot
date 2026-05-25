"""Documents router — knowledge base management."""
import logging
from fastapi import APIRouter, HTTPException
from typing import List

from app.models.schemas import DocumentUploadRequest, DocumentUploadResponse

router = APIRouter(prefix="/documents", tags=["Documents"])
logger = logging.getLogger(__name__)


@router.post("", response_model=DocumentUploadResponse)
async def upload_document(request: DocumentUploadRequest):
    """Ingest a new document into the enterprise knowledge base."""
    from app.main import get_services
    services = get_services()
    doc_service = services["document_service"]
    result = await doc_service.ingest_document(request)
    logger.info(f"Document uploaded: {result.title} ({result.chunks_created} chunks)")
    return result


@router.get("")
async def list_documents():
    """List all ingested documents in the knowledge base."""
    from app.main import get_services
    services = get_services()
    doc_service = services["document_service"]
    return {"documents": doc_service.list_documents()}


@router.get("/stats")
async def document_stats():
    """Get knowledge base statistics."""
    from app.main import get_services
    services = get_services()
    doc_service = services["document_service"]
    return doc_service.get_stats()
