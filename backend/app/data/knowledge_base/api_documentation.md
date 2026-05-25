---
title: "Platform API Documentation"
category: "api_docs"
department: "Engineering"
access_level: "internal"
---

# Platform API Documentation

**Base URL:** `https://api.company.com/v2`
**Authentication:** Bearer token (JWT) via Authorization header
**Rate Limiting:** 1000 requests/hour per API key

## Authentication

All API requests require a valid JWT token:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

Obtain tokens via: `POST /auth/token`

```json
{
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "grant_type": "client_credentials"
}
```

Tokens expire after 3600 seconds. Implement refresh logic in your client.

## Core Endpoints

### Users API

**GET /users/{user_id}**
Retrieve user profile by ID.

Response:
```json
{
  "id": "usr_abc123",
  "email": "john.doe@company.com",
  "name": "John Doe",
  "role": "admin",
  "department": "Engineering",
  "created_at": "2024-01-15T10:30:00Z",
  "last_active": "2024-12-01T14:22:00Z"
}
```

**POST /users**
Create new user account.

```json
{
  "email": "new.user@company.com",
  "name": "New User",
  "role": "member",
  "department": "Engineering",
  "send_invite": true
}
```

**PATCH /users/{user_id}**
Update user profile (partial update supported).

**DELETE /users/{user_id}**
Deactivate user account (soft delete, data preserved for 90 days).

### Projects API

**GET /projects**
List all projects with pagination.

Query parameters:
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `status` (string: active|archived|deleted)
- `department` (string)

**POST /projects**
Create new project.

```json
{
  "name": "AI Platform Migration",
  "description": "Migrate to new AI infrastructure",
  "owner_id": "usr_abc123",
  "department": "Engineering",
  "tags": ["ai", "infrastructure", "q1-2025"]
}
```

### Data Ingestion API

**POST /ingest/batch**
Bulk data ingestion with async processing.

```json
{
  "source": "s3://data-bucket/2024/q4/events.parquet",
  "format": "parquet",
  "schema_version": "2.1",
  "partition_key": "created_date",
  "deduplicate": true,
  "callback_url": "https://your-service/webhook"
}
```

Response includes a `job_id` for polling status:
```json
{
  "job_id": "job_xyz789",
  "status": "queued",
  "estimated_completion_minutes": 15
}
```

**GET /ingest/jobs/{job_id}**
Check ingestion job status.

### Analytics API

**POST /analytics/query**
Run analytics query with SQL-like syntax.

```json
{
  "query": "SELECT department, COUNT(*) as users FROM users GROUP BY department",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "format": "json",
  "cache_ttl_seconds": 300
}
```

## Webhooks

Register webhooks to receive real-time event notifications:

**POST /webhooks**
```json
{
  "url": "https://your-service.com/webhook",
  "events": ["user.created", "project.completed", "alert.triggered"],
  "secret": "your-webhook-secret",
  "active": true
}
```

Webhook payloads are signed with HMAC-SHA256. Verify signature:
```
X-Signature: sha256=<hex_digest>
```

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request — invalid parameters |
| 401 | Unauthorized — invalid/expired token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found |
| 422 | Validation Error — check request schema |
| 429 | Rate Limited — retry after header |
| 500 | Internal Server Error — contact support |
| 503 | Service Unavailable — check status page |

## Rate Limiting

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1703980800
```

When rate limited (429), wait for the `Retry-After` header value.

## SDK Libraries

Official SDKs available:
- Python: `pip install company-sdk`
- Node.js: `npm install @company/sdk`
- Go: `go get github.com/company/sdk-go`
- Java: Maven `com.company:sdk:2.3.1`

## Status Page

Real-time API status: https://status.company.com
Subscribe to incident notifications via email or PagerDuty.
