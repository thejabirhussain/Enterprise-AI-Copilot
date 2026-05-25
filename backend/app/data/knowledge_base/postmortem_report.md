---
title: "Post-Mortem: Platform Outage — November 2024"
category: "incident"
department: "Engineering"
access_level: "internal"
roles: "developer,team_lead,executive,cto"
---

# Post-Mortem Report: Platform Outage
**Incident ID:** INC-2024-1147
**Date:** November 14, 2024 | **Duration:** 3h 47m
**Severity:** P0 | **Status:** Resolved

## Executive Summary

A database connection pool exhaustion caused complete API unavailability for 3 hours and 47 minutes, affecting 100% of users. Revenue impact estimated at $287,000. Root cause: undiscovered ORM query in new feature release created N+1 query pattern under production load.

## Timeline

| Time (UTC) | Event |
|-----------|-------|
| 14:22 | Deployment of v2.4.1 completed successfully |
| 14:45 | PagerDuty alert: API error rate > 5% |
| 14:47 | On-call engineer acknowledges, begins investigation |
| 14:52 | Error rate reaches 47%, Incident Commander declared |
| 15:01 | Bridge call opened, 8 engineers on call |
| 15:15 | Root cause identified: connection pool at 100% |
| 15:18 | Decision: rollback to v2.4.0 |
| 15:23 | Rollback initiated |
| 15:31 | Rollback complete, error rate dropping |
| 15:45 | Error rate < 0.1%, monitoring period begins |
| 18:09 | Incident closed, service fully recovered |

## Root Cause Analysis

### The 5 Whys

**Why did the service go down?**
PostgreSQL connection pool exhausted (all 200 connections in use).

**Why was the connection pool exhausted?**
Thousands of concurrent queries were running simultaneously, each holding a connection for > 30 seconds.

**Why were queries slow?**
New `/api/v2/projects/list` endpoint introduced an N+1 query pattern:
- 1 query to fetch projects (OK)
- 1 query per project to fetch owner details (NOT OK)
- At 500 concurrent users × 200 projects each = 100,000 queries/second

**Why was N+1 not caught?**
Load testing only simulated 10 concurrent users. Query count scales linearly with data.

**Why was load testing insufficient?**
No performance regression gates in CI/CD pipeline for new endpoints.

## Contributing Factors

1. **No query analysis in code review** — reviewers checked logic, not SQL
2. **Staging database has 50 records** — N+1 is invisible at small data sizes
3. **No APM alerts for slow queries** — Datadog query duration alert not configured
4. **Rollback took 8 minutes** — Kubernetes readiness probe timeout too long

## Impact

| Metric | Value |
|--------|-------|
| Users affected | 100% (18,400 active users) |
| Duration | 3h 47m |
| API requests failed | ~1.2M |
| Revenue impact | $287,000 |
| SLA breach | Yes (99.9% SLA) |
| Customer escalations | 143 support tickets |

## Action Items

| Action | Owner | Due Date | Priority |
|--------|-------|----------|---------|
| Add query count assertion to PR checks | @backend-team | Dec 1 | P0 |
| Implement N+1 detection in staging | @platform-team | Dec 15 | P0 |
| Configure Datadog slow query alerts | @sre-team | Nov 20 | P1 |
| Load test with production data volumes | @qa-team | Dec 1 | P1 |
| Reduce rollback time to < 3 minutes | @platform-team | Dec 15 | P1 |
| Add connection pool monitoring dashboard | @sre-team | Nov 25 | P2 |

## Lessons Learned

### What Went Well
- PagerDuty alert fired within 23 minutes of deployment
- Incident Commander role filled immediately
- Rollback decision made within 28 minutes of incident declaration
- Clear communication to stakeholders every 30 minutes
- Post-mortem completed within 72 hours ✓

### What Didn't Go Well
- N+1 query pattern invisible in code review
- Load testing not representative of production scale
- Rollback took 2x longer than target
- Customer notification delayed 45 minutes

## Prevention

The primary prevention is automated N+1 query detection:
```python
# New CI check — fails if any endpoint makes > N queries per request
@pytest.mark.performance
def test_projects_list_query_count():
    with assert_max_queries(5):  # Max 5 queries for any list endpoint
        client.get("/api/v2/projects/list")
```

This is now a **required** CI check for all new endpoints.
