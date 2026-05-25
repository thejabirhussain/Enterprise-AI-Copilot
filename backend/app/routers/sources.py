from fastapi import APIRouter

router = APIRouter(prefix="/sources", tags=["Sources"])

ENTERPRISE_KNOWLEDGE_CATEGORIES = [
    {"id": "hr_policy", "name": "HR Policies", "icon": "users", "color": "#6366f1"},
    {"id": "engineering", "name": "Engineering", "icon": "code", "color": "#22d3ee"},
    {"id": "security", "name": "Security", "icon": "shield", "color": "#f43f5e"},
    {"id": "onboarding", "name": "Onboarding", "icon": "star", "color": "#a3e635"},
    {"id": "api_docs", "name": "API Docs", "icon": "book", "color": "#fb923c"},
    {"id": "runbook", "name": "Runbooks", "icon": "terminal", "color": "#34d399"},
    {"id": "incident", "name": "Incident Mgmt", "icon": "alert", "color": "#facc15"},
    {"id": "architecture", "name": "Architecture", "icon": "layers", "color": "#a78bfa"},
    {"id": "support", "name": "Support", "icon": "headphones", "color": "#67e8f9"},
    {"id": "deployment", "name": "Deployment", "icon": "rocket", "color": "#4ade80"},
]


@router.get("/categories")
async def get_categories():
    """Get all knowledge base categories."""
    return {"categories": ENTERPRISE_KNOWLEDGE_CATEGORIES}


@router.get("")
async def get_sources():
    """Get all knowledge sources with stats."""
    from app.main import get_services
    services = get_services()
    doc_service = services["document_service"]
    stats = doc_service.get_stats()
    return {
        "sources": doc_service.list_documents(),
        "categories": ENTERPRISE_KNOWLEDGE_CATEGORIES,
        "stats": stats,
    }
