"""Chat router — main AI copilot endpoint with RAG pipeline."""
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import json


from app.models.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["Chat"])
logger = logging.getLogger(__name__)


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint — processes user query through full RAG pipeline.
    
    When use_rag=True:
      - Query is embedded → Qdrant searched → Context retrieved → LLM grounded
    
    When use_rag=False:
      - Query sent directly to LLM (no grounding, may hallucinate)
      
    This "RAG vs No-RAG" comparison is intentionally supported for demos.
    """
    from app.main import get_services
    services = get_services()
    rag_service = services["rag_service"]
    
    logger.info(f"Chat request | rag={request.use_rag} | model={request.model} | query_len={len(request.query)}")
    
    response = await rag_service.process_query(request)
    return response


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint — yields tokens as they are generated.
    Frontend displays text character-by-character for a live feel.
    """
    from app.main import get_services
    services = get_services()
    llm_service = services["llm_service"]
    embedding_service = services["embedding_service"]
    vector_repo = services["vector_repo"]
    
    async def token_generator():
        # First emit metadata
        context_chunks = []
        if request.use_rag:
            query_embedding = embedding_service.embed_text(request.query)
            raw_results = vector_repo.search(
                query_vector=query_embedding,
                top_k=request.top_k,
                access_level=request.access_level,
            )
            context_chunks = [
                {"title": r["payload"].get("title"), "content": r["payload"].get("content"), "score": r["score"]}
                for r in raw_results
            ]
        
        async for token in llm_service.stream_generate(
            query=request.query,
            context_chunks=context_chunks,
            model=request.model,
            use_rag=request.use_rag,
        ):
            yield f"data: {json.dumps({'token': token})}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )
