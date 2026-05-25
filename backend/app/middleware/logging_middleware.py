"""
Enterprise AI Copilot - Request/Response Audit Logging Middleware
Logs all API interactions for enterprise compliance and debugging.
"""

import logging
import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("audit")


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs every request/response pair for audit compliance.
    Enterprise AI systems require traceability of all queries and responses.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        # Log incoming request
        logger.info(
            f"[{request_id}] → {request.method} {request.url.path} "
            f"| Client: {request.client.host if request.client else 'unknown'}"
        )

        # Process request
        response = await call_next(request)

        # Log response
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            f"[{request_id}] ← {response.status_code} "
            f"| {duration_ms}ms | {request.url.path}"
        )

        # Add request tracking headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        response.headers["X-Powered-By"] = "Enterprise AI Copilot"

        return response
