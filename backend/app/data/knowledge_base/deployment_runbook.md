---
title: "Production Deployment Runbook"
category: "deployment"
department: "Platform Engineering"
access_level: "internal"
---

# Production Deployment Runbook

**Owner:** Platform Engineering | **Last Updated:** 2024-12-01

## Overview

This runbook covers the complete process for deploying services to production. All production deployments must follow this procedure to ensure stability and rollback capability.

## Prerequisites

Before initiating any production deployment:
- [ ] PR merged to `main` branch with 2+ approvals
- [ ] All CI/CD pipeline checks passing (green)
- [ ] Change request created in ServiceNow (CHG number required)
- [ ] Deployment window confirmed (avoid Fri 3pm - Mon 9am)
- [ ] On-call engineer notified in #deployments Slack channel
- [ ] Rollback plan documented

## Deployment Process

### Step 1: Pre-Deployment Verification

```bash
# Verify current production state
kubectl get deployments -n production
kubectl get pods -n production --sort-by=.status.startTime

# Check Datadog dashboards for baseline metrics
# Note current error rate, p99 latency, request volume

# Confirm deployment artifact
docker pull company.registry.io/service-name:v2.4.1
docker inspect company.registry.io/service-name:v2.4.1 | jq '.[0].Created'
```

### Step 2: Notify Team

Post in #deployments:
```
🚀 DEPLOYING: service-name v2.4.1 to production
• CHG: CHG0012345
• Expected duration: ~15 minutes
• Rollback: kubectl rollout undo deployment/service-name -n production
• On-call: @engineer-name
```

### Step 3: Database Migrations (if required)

**Always run migrations before deploying new code:**

```bash
# Connect to production DB via bastion
ssh -i ~/.ssh/bastion.pem admin@bastion.company.com

# Run migrations in dry-run mode first
kubectl exec -n production deployment/service-name -- \
  python manage.py migrate --plan

# Execute migrations
kubectl exec -n production deployment/service-name -- \
  python manage.py migrate

# Verify migration success
kubectl exec -n production deployment/service-name -- \
  python manage.py showmigrations | tail -20
```

### Step 4: Deploy Application

```bash
# Update deployment image
kubectl set image deployment/service-name \
  service-name=company.registry.io/service-name:v2.4.1 \
  -n production

# Monitor rollout progress (watch until complete)
kubectl rollout status deployment/service-name -n production --timeout=10m

# Verify pod health after rollout
kubectl get pods -n production -l app=service-name
kubectl describe pod <pod-name> -n production | tail -30
```

### Step 5: Post-Deployment Verification

**Wait 5 minutes after rollout completion, then:**

```bash
# Check error rate (should match pre-deployment baseline)
# Datadog query: sum:service.errors{env:production} / sum:service.requests{env:production}

# Verify health endpoint
curl -s https://api.company.com/health | jq .

# Check logs for errors
kubectl logs -n production -l app=service-name --since=5m | grep -E "ERROR|CRITICAL"

# Run smoke tests
cd /infrastructure/smoke-tests && pytest tests/smoke/ -v --env=production
```

### Step 6: Close Change Request

1. Update ServiceNow CHG status to "Implemented"
2. Post completion message in #deployments:
```
✅ DEPLOYED: service-name v2.4.1 — SUCCESS
• Duration: 12 minutes
• Error rate: stable (0.01%)
• p99 latency: 45ms (baseline: 43ms) ✓
```

## Rollback Procedure

### Immediate Rollback (< 5 minutes)

```bash
# Kubernetes immediate rollback
kubectl rollout undo deployment/service-name -n production

# Monitor rollback
kubectl rollout status deployment/service-name -n production

# Verify previous version restored
kubectl describe deployment service-name -n production | grep Image
```

### Database Rollback

Only if migration was applied AND new code introduced breaking schema changes:
```bash
# List applied migrations
kubectl exec -n production deployment/service-name -- \
  python manage.py showmigrations

# Rollback specific migration
kubectl exec -n production deployment/service-name -- \
  python manage.py migrate app_name 0025_previous_migration
```

## Deployment Windows

| Environment | Allowed Times |
|------------|--------------|
| Production | Mon-Thu: 9am-4pm PST |
| Staging | Anytime |
| Development | Anytime |

**Exceptions:** Emergency hotfixes with P0 incident only, require VP Engineering approval.

## Canary Deployments

For high-risk changes, use canary deployment:
```bash
# Deploy to 10% of traffic
kubectl apply -f k8s/canary-deployment.yaml

# Monitor for 30 minutes
# If metrics stable, promote to 100%
kubectl apply -f k8s/production-deployment.yaml
kubectl delete -f k8s/canary-deployment.yaml
```
