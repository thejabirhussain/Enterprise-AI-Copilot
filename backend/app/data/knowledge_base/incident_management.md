---
title: "Incident Management Guide"
category: "incident"
department: "Engineering"
access_level: "internal"
---

# Incident Management Guide

## Incident Classification

### Severity Levels

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|---------|
| **P0 Critical** | Complete service outage, data loss, security breach | Immediate (< 5 min) | API down, database failure, breach |
| **P1 High** | Major feature unavailable, >25% users affected | < 15 minutes | Payment failures, auth outage |
| **P2 Medium** | Degraded performance, <25% users affected | < 1 hour | Slow queries, partial errors |
| **P3 Low** | Minor issue, workaround available | < 24 hours | UI glitches, non-critical errors |

## Incident Response Process

### 1. Detection & Alert

Incidents are detected via:
- **PagerDuty** alerts from Datadog monitoring
- **User reports** via support@company.com or #customer-issues
- **Automated health checks** from our synthetic monitoring
- **Team member** identification

**First responder (on-call engineer):**
1. Acknowledge the PagerDuty alert within 5 minutes
2. Quickly assess severity
3. Create incident channel in Slack: `#inc-YYYYMMDD-brief-description`

### 2. Declare Incident

For P0/P1 incidents, immediately post in #incidents:
```
🚨 INCIDENT DECLARED: [P0/P1]
• Status: Investigating
• Impact: [describe what's broken and how many users affected]
• IC (Incident Commander): @your-name
• Bridge: [Zoom link]
• Timeline: Incident started ~[time]
```

Create StatusPage incident at status.company.com.

### 3. Incident Command Structure

| Role | Responsibility |
|------|---------------|
| **Incident Commander (IC)** | Coordinates response, makes decisions, drives resolution |
| **Technical Lead** | Investigates root cause, implements fix |
| **Communications Lead** | Updates stakeholders, manages status page |
| **Scribe** | Documents timeline in incident doc |

### 4. Investigation Checklist

```bash
# 1. Check service health
kubectl get pods -n production
kubectl get nodes

# 2. Check recent deployments
kubectl rollout history deployment/service-name -n production

# 3. Check error rates (Datadog)
# Query: error_rate > 1% for any production service

# 4. Check database health
# RDS Monitoring: CPU, connections, replica lag

# 5. Check infrastructure alerts
# AWS Console → CloudWatch → Alarms

# 6. Check logs
kubectl logs -n production -l app=service-name --since=30m | grep -E "ERROR|FATAL"
```

### 5. Communication Templates

**Customer-facing status update (every 30 min):**
```
[Time] We are aware of issues affecting [service]. Our team is actively 
investigating. Current impact: [describe]. Next update in 30 minutes.
```

**Resolution notification:**
```
[Time] The incident affecting [service] has been resolved. Root cause was 
[brief description]. We are conducting a full post-mortem. All services 
operating normally. We apologize for the disruption.
```

### 6. Resolution & Recovery

- Implement fix or rollback
- Verify all services healthy
- Monitor for 30 minutes post-fix
- Close StatusPage incident
- Post resolution in #incidents

### 7. Post-Incident Review (PIR)

Required for all P0/P1 incidents within **72 hours** of resolution:

PIR template location: Confluence → Engineering → Incident Reviews

**PIR sections:**
1. **Summary**: What happened in 2-3 sentences
2. **Timeline**: Minute-by-minute events
3. **Root Cause Analysis**: The 5 Whys technique
4. **Impact**: Users affected, revenue impact, SLA breach
5. **What went well**: Detection, response, communication
6. **What didn't go well**: Gaps in monitoring, slow response
7. **Action items**: Specific, owner-assigned, time-bound fixes

**Blameless culture**: PIRs focus on systems and processes, never individuals.

## On-Call Rotation

- Weekly rotation: Mon 9am → Mon 9am
- Schedule in PagerDuty: pagerduty.company.com
- On-call stipend: $200/week when actively on-call
- Escalation: Team lead → Engineering Manager → VP Engineering

## SLA Commitments

| Service Tier | Availability Target | Incident SLA |
|-------------|-------------------|-------------|
| Platinum | 99.99% | Respond P0 < 5min |
| Gold | 99.9% | Respond P0 < 15min |
| Standard | 99.5% | Respond P1 < 1hr |
