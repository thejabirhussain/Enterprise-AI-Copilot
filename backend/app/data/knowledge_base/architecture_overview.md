---
title: "Engineering Architecture Overview"
category: "architecture"
department: "Engineering"
access_level: "internal"
---

# Enterprise Platform Architecture Overview

**Version:** 2.0 | **Status:** Current Production Architecture

## System Architecture

Our platform follows a **microservices architecture** deployed on AWS, using Kubernetes for orchestration and a GitOps deployment model.

## High-Level Architecture

```
Internet → CloudFront CDN → ALB → API Gateway → Microservices → Data Layer
```

### Traffic Flow
1. Users hit **CloudFront** (global CDN, edge caching)
2. Dynamic requests route to **Application Load Balancer** (multi-AZ)
3. **API Gateway** handles auth, rate limiting, routing
4. Requests distributed to **microservices** in EKS
5. Services persist to **Aurora PostgreSQL** (primary/replica)
6. Async workloads via **SQS + Lambda** or **Celery + Redis**
7. Search powered by **OpenSearch**

## Core Services

### Platform API (Go)
- RESTful API — primary business logic
- gRPC for internal service communication
- 99.99% availability SLA

### User Service (Python/FastAPI)
- Authentication and authorization
- OAuth 2.0 + OIDC with Okta
- JWT token management

### Data Pipeline (Apache Kafka + Spark)
- Real-time event streaming
- Batch ETL to data warehouse (Snowflake)
- ML feature store (Feast)

### Notification Service (Node.js)
- Email (SendGrid), SMS (Twilio), Push
- Template management
- Delivery tracking

### AI/ML Platform (Python)
- Model serving via KServe
- Feature store integration
- A/B testing framework
- MLflow experiment tracking

## Data Architecture

### Operational Database
- **Aurora PostgreSQL 15** — primary transactional DB
- Multi-AZ deployment for high availability
- Read replicas for reporting queries
- Automated backups (35-day retention)
- Point-in-time recovery enabled

### Data Warehouse
- **Snowflake** — analytics and reporting
- Daily ETL from operational DB
- Real-time streaming via Kafka → Snowflake Kafka connector

### Caching Layer
- **ElastiCache Redis** — application caching, session storage
- **CloudFront** — static assets, API response caching
- Cache invalidation via event-driven patterns

### Search
- **OpenSearch** — full-text search and analytics
- Synchronized from PostgreSQL via Debezium CDC

## Infrastructure

### AWS Account Structure
```
├── prod-account (production workloads)
├── staging-account (pre-production testing)
├── dev-account (development environments)
├── security-account (centralized logging, SIEM)
└── shared-services (DNS, CI/CD, artifact registry)
```

### Kubernetes (EKS)
- EKS v1.29 across 3 availability zones
- Node groups: compute-optimized (c5.2xlarge) and memory-optimized (r5.2xlarge)
- Cluster autoscaler + KEDA for workload-based scaling
- Istio service mesh for traffic management and mTLS
- Prometheus + Grafana for metrics
- Loki for log aggregation

### CI/CD Pipeline
```
GitHub PR → GitHub Actions (test/lint/build) → 
Staging Deploy → Integration Tests → 
Production Deploy (blue/green) → Smoke Tests
```

### Monitoring Stack
- **Datadog**: APM, infrastructure, custom metrics
- **PagerDuty**: On-call alerting
- **Sentry**: Error tracking
- **StatusPage**: Customer-facing status

## Security Architecture

- **Zero Trust** network model — all service-to-service communication authenticated
- **AWS PrivateLink** for AWS service access without internet exposure
- **Secrets Manager** for secret rotation
- **WAF** on ALB for OWASP Top 10 protection
- **GuardDuty** for threat detection
- **Inspector** for vulnerability scanning

## Architecture Decision Records (ADRs)

Key decisions documented in Confluence:
- ADR-001: PostgreSQL over MongoDB (consistency requirements)
- ADR-007: Kafka over SQS for streaming (replay capability)
- ADR-012: Kubernetes over ECS (ecosystem, flexibility)
- ADR-018: Go for API tier (performance, concurrency)
- ADR-023: Istio service mesh (observability, security)

## Disaster Recovery

- **RTO (Recovery Time Objective):** 1 hour
- **RPO (Recovery Point Objective):** 15 minutes
- DR runbook: Confluence → Engineering → Disaster Recovery
- Quarterly DR drills conducted by Platform Engineering
