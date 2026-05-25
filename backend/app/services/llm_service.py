"""
Enterprise AI Copilot - LLM Service (Ollama)
Handles all interactions with local open-source LLMs via Ollama.

Ollama enables running production LLMs locally:
- Llama 3.2 — Meta's state-of-the-art instruction model
- Mistral — Fast, high-quality European open model
- DeepSeek-R1 — Strong reasoning model
- Phi-3 — Microsoft's small but capable model

Architecture:
  User Query + RAG Context → Prompt Template → Ollama → Streamed Response
"""

import logging
import json
import time
from typing import Optional, AsyncGenerator, List
import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)

# ─── System Prompt for Enterprise RAG ─────────────────────────────────────────
ENTERPRISE_SYSTEM_PROMPT = """You are an Enterprise AI Copilot, an intelligent assistant for {company_name}.
You are grounded in verified enterprise knowledge. Your responses must:

1. ONLY use information from the provided context documents
2. Cite specific sources when referencing information
3. Acknowledge when you don't have sufficient context to answer
4. Maintain professional, enterprise-grade communication
5. Be concise yet comprehensive
6. Flag any uncertainty clearly

If the context does not contain enough information to answer the question, say:
"I don't have sufficient information in the enterprise knowledge base to answer this accurately."

Do NOT fabricate information. Do NOT use external knowledge beyond what's provided.
"""

RAG_PROMPT_TEMPLATE = """
## Enterprise Knowledge Context

The following documents have been retrieved from the enterprise knowledge base based on semantic similarity to your query:

{context}

---

## User Query
{query}

## Instructions
Answer the query using ONLY the context provided above. Reference specific documents when citing information.
If the context is insufficient, clearly state that and suggest where the user might find the information.
"""

NO_RAG_PROMPT_TEMPLATE = """
## User Query
{query}

## Instructions
Answer this query based on your general knowledge. Note that this response is NOT grounded in 
enterprise-specific documents. For accurate enterprise information, enable RAG mode.
"""


class LLMService:
    """
    Manages communication with Ollama for local LLM inference.
    
    Supports both streaming (real-time token generation) and
    non-streaming (complete response) modes.
    
    Model switching allows comparing different LLMs without restart.
    """

    def __init__(self, base_url: str, default_model: str, timeout: int = 120):
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model
        self.timeout = timeout
        self._available = None  # Cache availability check

    async def check_availability(self) -> bool:
        """Check if Ollama is running and accessible."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                self._available = response.status_code == 200
                return self._available
        except Exception:
            self._available = False
            return False

    async def list_models(self) -> List[str]:
        """Get list of models available in this Ollama instance."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    return [m["name"] for m in data.get("models", [])]
        except Exception as e:
            logger.error(f"Failed to list Ollama models: {e}")
        return []

    def build_rag_prompt(self, query: str, context_chunks: List[dict], use_rag: bool = True) -> tuple[str, str]:
        """
        Construct the RAG prompt by injecting retrieved context.
        
        This is the core of RAG — the LLM sees BOTH the query AND
        the relevant retrieved documents, enabling grounded responses.
        """
        if not use_rag:
            system_prompt = "You are a helpful AI assistant. Answer the user query using your general knowledge."
            user_prompt = NO_RAG_PROMPT_TEMPLATE.format(query=query)
            return system_prompt, user_prompt

        if not context_chunks:
            system_prompt = ENTERPRISE_SYSTEM_PROMPT.format(company_name="Your Enterprise")
            user_prompt = NO_RAG_PROMPT_TEMPLATE.format(query=query)
            return system_prompt, user_prompt

        # Format retrieved chunks into readable context
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            context_parts.append(
                f"[Document {i}] **{chunk.get('title', 'Unknown')}** "
                f"(Category: {chunk.get('category', 'N/A')}, "
                f"Relevance: {chunk.get('score', 0):.1%})\n\n"
                f"{chunk.get('content', '')}"
            )
        
        context = "\n\n---\n\n".join(context_parts)
        system_prompt = ENTERPRISE_SYSTEM_PROMPT.format(company_name="Your Enterprise")
        user_prompt = RAG_PROMPT_TEMPLATE.format(context=context, query=query)
        
        return system_prompt, user_prompt

    async def generate(
        self,
        query: str,
        context_chunks: Optional[List[dict]] = None,
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        use_rag: bool = True,
    ) -> tuple[str, int]:
        """
        Generate a complete (non-streaming) response.
        Returns (response_text, tokens_used).
        """
        model = model or self.default_model
        context_chunks = context_chunks or []
        
        system_prompt, user_prompt = self.build_rag_prompt(query, context_chunks, use_rag)
        
        payload = {
            "model": model,
            "prompt": user_prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "top_p": 0.9,
                "repeat_penalty": 1.1,
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                start = time.time()
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                )
                elapsed = int((time.time() - start) * 1000)
                
                if response.status_code == 200:
                    data = response.json()
                    text = data.get("response", "")
                    tokens = data.get("eval_count", 0)
                    logger.info(f"LLM generated {tokens} tokens in {elapsed}ms | Model: {model}")
                    return text, tokens
                else:
                    logger.error(f"Ollama returned {response.status_code}: {response.text}")
                    return self._fallback_response(query, context_chunks), 0
                    
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return self._fallback_response(query, context_chunks), 0

    async def stream_generate(
        self,
        query: str,
        context_chunks: Optional[List[dict]] = None,
        model: Optional[str] = None,
        temperature: float = 0.1,
        use_rag: bool = True,
    ) -> AsyncGenerator[str, None]:
        """
        Stream tokens as they are generated by Ollama.
        Each yield is a string token for real-time display.
        """
        model = model or self.default_model
        context_chunks = context_chunks or []
        
        system_prompt, user_prompt = self.build_rag_prompt(query, context_chunks, use_rag)
        
        payload = {
            "model": model,
            "prompt": user_prompt,
            "system": system_prompt,
            "stream": True,
            "options": {"temperature": temperature, "num_predict": 2048}
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream("POST", f"{self.base_url}/api/generate", json=payload) as response:
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                token = data.get("response", "")
                                if token:
                                    yield token
                                if data.get("done"):
                                    break
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"Streaming failed: {e}")
            yield self._fallback_response(query, context_chunks)

    def _fallback_response(self, query: str, context_chunks: List[dict]) -> str:
        """
        Demo-mode response when Ollama is not available.
        Returns realistic-looking grounded response based on retrieved chunks.
        """
        if context_chunks:
            top_chunk = context_chunks[0]
            title = top_chunk.get("title", "Enterprise Documentation")
            content = top_chunk.get("content", "")[:400]
            return (
                f"Based on the enterprise knowledge base, specifically **{title}**:\n\n"
                f"{content}\n\n"
                f"*Note: This response is in demo mode. Connect Ollama for full AI inference. "
                f"Retrieved {len(context_chunks)} relevant document(s) from the knowledge base.*"
            )
        return (
            "I'm currently running in demo mode without an active LLM connection. "
            "To enable full AI responses, ensure Ollama is running with a compatible model "
            "(llama3.2, mistral, etc.).\n\n"
            "The RAG pipeline is fully functional — document retrieval, embedding generation, "
            "and vector search are operational."
        )

    async def get_service_info(self) -> dict:
        available = await self.check_availability()
        models = await self.list_models() if available else []
        return {
            "base_url": self.base_url,
            "default_model": self.default_model,
            "available": available,
            "installed_models": models,
            "supported_models": settings.AVAILABLE_MODELS,
        }
