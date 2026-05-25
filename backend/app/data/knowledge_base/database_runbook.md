---
title: "Engineering Runbook - Database Operations"
category: "runbook"
department: "Platform Engineering"
access_level: "internal"
---

# Engineering Runbook: Database Operations

## PostgreSQL Health Checks

### Check Database Connectivity
```bash
# Via kubectl
kubectl exec -n production deployment/platform-api -- \
  python -c "import psycopg2; conn = psycopg2.connect('$DATABASE_URL'); print('OK')"

# Direct connection (requires bastion)
PGPASSWORD=$DB_PASSWORD psql -h prod-db.cluster.us-east-1.rds.amazonaws.com \
  -U platform_user -d platform_db -c "SELECT version();"
```

### Check Replication Lag
```sql
-- On primary
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
       (sent_lsn - replay_lsn) AS replication_lag
FROM pg_stat_replication;

-- Alert threshold: lag > 30MB requires investigation
```

### Check Lock Contention
```sql
-- Find long-running queries (> 5 minutes)
SELECT pid, now() - query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
  AND query_start < now() - interval '5 minutes'
ORDER BY duration DESC;

-- Kill a blocking query (use with caution)
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <pid>;
```

### Check Table Bloat
```sql
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
       n_dead_tup, n_live_tup,
       ROUND(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;
```

## Redis Operations

### Cache Health Check
```bash
# Connect to Redis
redis-cli -h prod-redis.xxxxx.cache.amazonaws.com -p 6379

# Check memory usage
INFO memory

# Check connected clients
CLIENT LIST

# Flush specific pattern (CAREFUL in production)
redis-cli -h $REDIS_HOST --scan --pattern "session:*" | xargs redis-cli DEL
```

### Cache Stampede Prevention
If cache is warming after flush:
```bash
# Enable cache warming script
kubectl apply -f k8s/jobs/cache-warm-job.yaml

# Monitor warming progress
kubectl logs -n production job/cache-warm-job -f
```

## Backup and Restore

### Verify Backup
```bash
# List recent RDS snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier prod-platform-db \
  --query 'DBSnapshots[?Status==`available`].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table \
  --profile production

# Latest snapshot should be < 24 hours old
```

### Point-in-Time Restore (PITR)
1. Create new RDS instance from PITR in AWS Console
2. Specify exact timestamp for restore point
3. Update DNS to point to restored instance
4. Verify data integrity
5. Run smoke tests

**IMPORTANT**: PITR creates a new instance — requires DNS update.

## Scaling Operations

### Vertical Scaling (RDS instance type change)
1. Create maintenance window during off-peak hours
2. Modify instance class in AWS Console or via Terraform
3. Multi-AZ failover occurs during scaling (brief interruption)
4. Monitor application errors during failover

### Connection Pool Management
```bash
# Current connection count
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Connection pool stats (via PgBouncer)
PGPASSWORD=$PGBOUNCER_PASS psql -p 6432 -h localhost pgbouncer -c "SHOW POOLS;"
```

## Performance Tuning

### Slow Query Analysis
```sql
-- Enable query logging (for debugging only, affects performance)
ALTER SYSTEM SET log_min_duration_statement = '1000'; -- Log queries > 1 second
SELECT pg_reload_conf();

-- Check pg_stat_statements for top 10 slowest queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Index Recommendations
```sql
-- Find missing indexes (sequential scans on large tables)
SELECT schemaname, tablename, seq_scan, seq_tup_read,
       idx_scan, seq_tup_read / seq_scan AS avg_tuples_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100
  AND seq_tup_read > 100000
ORDER BY seq_tup_read DESC;
```

## Emergency Procedures

### Database CPU Spike > 90%
1. Check long-running queries → terminate blockers
2. Check for runaway batch jobs → kubectl get jobs -n production
3. Enable query result caching if possible
4. Scale read replicas to offload traffic
5. Page platform team via PagerDuty

### Disk Space > 85%
1. Alert: Automated alert fires at 80%
2. Identify large tables: `SELECT pg_size_pretty(pg_total_relation_size('tablename'));`
3. Archive old data to S3 via archival script: `scripts/archive_old_records.py`
4. VACUUM ANALYZE after archival
5. Request disk size increase via AWS Console (30-min to take effect)
