---
title: "API Standards and Design Guidelines"
category: "engineering"
department: "Platform Engineering"
access_level: "internal"
roles: "developer,team_lead,executive,cto"
---

# Enterprise API Standards and Design Guidelines

**Version:** 3.2 | **Owner:** Platform Architecture | **Effective:** January 2025

## 1. REST API Design Principles

### URL Design

```
# ✅ CORRECT
GET    /api/v2/users/{id}
POST   /api/v2/users
PUT    /api/v2/users/{id}
DELETE /api/v2/users/{id}
GET    /api/v2/users/{id}/projects

# ❌ INCORRECT
GET  /api/getUser?id=123
POST /api/createUser
GET  /api/user_projects?userId=123
```

**Rules:**
- Use nouns, not verbs
- Plural resource names (`/users` not `/user`)
- Hierarchical relationships in URL (`/users/{id}/orders`)
- Versioning via URL prefix (`/api/v2/`)
- Lowercase with hyphens (`/user-profiles` not `/userProfiles`)

### HTTP Status Codes

| Code | Use Case |
|------|----------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (valid token, insufficient permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable Entity (semantic validation) |
| 429 | Rate Limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Response Format

All APIs MUST return JSON with this envelope:

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_01h9xyz123",
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "2.0"
  },
  "errors": null
}
```

Error responses:
```json
{
  "data": null,
  "meta": { ... },
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "email",
      "message": "Must be a valid email address"
    }
  ]
}
```

## 2. Authentication and Authorization

### Authentication: JWT Bearer Tokens

All API requests must include:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token claims must include:
```json
{
  "sub": "user_01h9xyz",
  "email": "user@company.com",
  "role": "developer",
  "department": "engineering",
  "permissions": ["read:docs", "write:projects"],
  "exp": 1737000000
}
```

**Token Lifetime:**
- Access token: 1 hour
- Refresh token: 30 days
- Service-to-service: 24 hours

### Authorization: RBAC + ABAC

Use role-based access control supplemented with attribute-based:

```python
# Permission check pattern
@require_permission("read:confidential_docs")
@require_role(["team_lead", "executive", "cto"])
async def get_confidential_document(doc_id: str, user: User):
    ...
```

## 3. Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Public | 60 requests | 1 minute |
| Authenticated | 1,000 requests | 1 minute |
| AI Endpoints | 20 requests | 1 minute |
| Internal Services | 10,000 requests | 1 minute |

Headers returned:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1737000060
```

## 4. Pagination

Use cursor-based pagination for all list endpoints:

```json
GET /api/v2/documents?cursor=eyJpZCI6MTIzfQ&limit=25

{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTQ4fQ",
    "prev_cursor": "eyJpZCI6OTh9",
    "total_count": 1847,
    "has_more": true
  }
}
```

**NEVER use offset pagination for large datasets** (unstable under concurrent mutations).

## 5. API Versioning Policy

- Major versions: Breaking changes → `/api/v3/`
- Minor versions: Additive only, no separate URL
- Deprecation notice: 6 months before removal
- Deprecated header: `Deprecation: Sun, 01 Jun 2025 00:00:00 GMT`

## 6. Internal Service Communication

Use gRPC for internal service-to-service communication:
- 10x less overhead than REST for high-frequency calls
- Strongly typed with Protobuf
- Bidirectional streaming support

REST only for: external consumers, webhooks, browser clients.
