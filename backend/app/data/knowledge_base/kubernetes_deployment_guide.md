---
title: "Kubernetes Production Deployment Guide"
category: "deployment"
department: "Platform Engineering"
access_level: "internal"
roles: "developer,team_lead,executive,cto"
---

# Kubernetes Production Deployment Guide

**Version:** 4.1 | **Platform:** AWS EKS | **Owner:** Platform Engineering

## Cluster Architecture

### Production Cluster (us-east-1)

```
EKS Cluster: prod-platform-eks
├── Node Groups
│   ├── system-nodes    (m5.large × 3)  — kube-system workloads
│   ├── api-nodes       (m5.xlarge × 6) — API services
│   ├── ai-nodes        (g4dn.xlarge × 2) — LLM inference (GPU)
│   └── data-nodes      (r5.2xlarge × 3) — Qdrant, PostgreSQL
└── Namespaces
    ├── production       — Production services
    ├── staging          — Staging environment
    ├── monitoring       — Prometheus, Grafana
    └── ai-platform      — Ollama, Qdrant, AI services
```

## Deployment Workflow

### Standard Service Deployment

```bash
# 1. Merge to main (triggers CI)
git merge feature/my-feature → main

# 2. CI Pipeline (GitHub Actions)
# - Build Docker image
# - Run unit tests
# - Run integration tests
# - Security scan (Snyk + Trivy)
# - Push to ECR: 123456.dkr.ecr.us-east-1.amazonaws.com/platform-api:v2.4.2

# 3. GitOps Deployment (ArgoCD)
# ArgoCD detects new image tag in Helm values
# Deploys to staging automatically
# Requires manual approval for production

# 4. Canary Rollout (Argo Rollouts)
# Staging: 100% traffic to new version
# Production: 5% → 25% → 50% → 100% over 30 minutes
```

### Deployment Configuration

```yaml
# k8s/production/platform-api/rollout.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: platform-api
  namespace: production
spec:
  replicas: 6
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: {duration: 5m}
        - analysis:
            templates:
              - templateName: error-rate-check
        - setWeight: 25
        - pause: {duration: 5m}
        - setWeight: 50
        - pause: {duration: 5m}
        - setWeight: 100
      canaryMetadata:
        labels:
          track: canary
      stableMetadata:
        labels:
          track: stable
```

## Resource Management

### CPU/Memory Limits by Service

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|------------|-----------|----------------|-------------|
| platform-api | 250m | 1000m | 512Mi | 2Gi |
| ollama-service | 4000m | 8000m | 8Gi | 16Gi |
| qdrant | 1000m | 4000m | 4Gi | 8Gi |
| embedding-service | 2000m | 4000m | 4Gi | 8Gi |
| frontend | 100m | 250m | 128Mi | 256Mi |

### Auto-scaling (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: platform-api-hpa
spec:
  scaleTargetRef:
    name: platform-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          averageUtilization: 80
```

## Health Checks

Every service must implement:

```python
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "dependencies": {
            "database": await db.ping(),
            "qdrant": await qdrant.health(),
            "ollama": await ollama.health(),
        }
    }

@app.get("/ready")
async def ready():
    # Service is ready to receive traffic
    if not models_loaded:
        raise HTTPException(503, "Models not yet loaded")
    return {"ready": True}
```

Kubernetes probes:
- **liveness**: `/health` — Is the service alive?
- **readiness**: `/ready` — Ready for traffic?
- **startup**: Runs once at startup (longer timeout for model loading)

## Rollback Procedure

```bash
# Immediate rollback (< 2 minutes)
kubectl argo rollouts abort platform-api -n production

# Rollback to previous stable version
kubectl argo rollouts undo platform-api -n production

# Verify rollback
kubectl argo rollouts status platform-api -n production
kubectl get pods -n production -l app=platform-api
```

## Monitoring & Alerts

**Critical Alerts (PagerDuty):**
- Pod restart > 3 times in 5 minutes
- Error rate > 1% for 2 minutes
- P99 latency > 2 seconds for 5 minutes
- Qdrant memory > 85%
- GPU utilization < 10% (Ollama not serving)

**Dashboard:** https://grafana.internal/d/platform-overview
