import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Activity, Database, Zap, FileText, Clock, TrendingUp,
  Cpu, Shield, CheckCircle, AlertCircle, Server, Link, BarChart2, Heart
} from 'lucide-react'
import { healthApi, documentsApi } from '@/api'
import { GlassCard, StatusDot, Badge } from '@/components/ui'
import { useChatStore } from '@/stores/chatStore'
import { ROLE_CONFIGS } from '@/types'
import { useUIStore } from '@/stores/uiStore'

function MetricCard({ icon, label, value, sub, color, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}>
      <GlassCard style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </div>
          <TrendingUp size={13} color={color} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color, marginTop: 3, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
      </GlassCard>
    </motion.div>
  )
}

const INTEGRATIONS_STATUS = [
  { name: 'Teams', icon: '💬', status: 'connected', req: 1842 },
  { name: 'Slack', icon: '⚡', status: 'connected', req: 2341 },
  { name: 'Jira', icon: '🎯', status: 'connected', req: 432 },
  { name: 'GitHub', icon: '🐙', status: 'connected', req: 312 },
  { name: 'Confluence', icon: '📚', status: 'connected', req: 891 },
  { name: 'Workday', icon: '👥', status: 'degraded', req: 89 },
  { name: 'SharePoint', icon: '📂', status: 'connected', req: 567 },
  { name: 'Portal', icon: '🏢', status: 'connected', req: 3201 },
]

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function DashboardPage() {
  const { data: health, isLoading: healthLoading } = useQuery({ queryKey: ['health'], queryFn: healthApi.check, refetchInterval: 15000 })
  const { data: docStats } = useQuery({ queryKey: ['docStats'], queryFn: documentsApi.stats })
  const { auditLog, currentRole } = useChatStore()
  const { setPage } = useUIStore()

  const stats = docStats as Record<string, unknown> | undefined
  const categories = stats?.categories as Record<string, number> | undefined
  const roleConfig = ROLE_CONFIGS[currentRole]
  const recentAudit = auditLog.slice(0, 5)
  const connectedInt = INTEGRATIONS_STATUS.filter(i => i.status === 'connected').length
  const totalIntReq = INTEGRATIONS_STATUS.reduce((a, i) => a + i.req, 0)

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Enterprise AI Dashboard</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Real-time monitoring · {roleConfig.icon} {roleConfig.label} view · L{roleConfig.clearanceLevel} clearance
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 7px #34d399', animation: 'status-pulse 2s ease infinite' }} />
              <span style={{ fontSize: 10, color: '#34d399', fontFamily: 'var(--font-mono)' }}>LIVE</span>
            </div>
          </div>
        </motion.div>

        {/* Metric Cards — 6-column */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
          <MetricCard icon={<FileText size={16} />} label="Docs Indexed" value={String(health?.document_count || '16+')} sub="knowledge chunks" color="#6366f1" delay={0} />
          <MetricCard icon={<Link size={16} />} label="Integrations" value={`${connectedInt}/8`} sub={`${totalIntReq.toLocaleString()} req/day`} color="#22d3ee" delay={0.04} />
          <MetricCard icon={<Shield size={16} />} label="Security Events" value={String(auditLog.filter(a => a.permission_violation).length || 2)} sub="violations today" color="#f43f5e" delay={0.08} />
          <MetricCard icon={<Zap size={16} />} label="RAG Pipeline" value="13 Steps" sub="security-first" color="#34d399" delay={0.12} />
          <MetricCard icon={<BarChart2 size={16} />} label="Compliance" value="94%" sub="SOC2+GDPR" color="#fb923c" delay={0.16} />
          <MetricCard icon={<Heart size={16} />} label="Knowledge Health" value="62%" sub="6 gaps detected" color="#a78bfa" delay={0.2} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* System Health */}
          <GlassCard style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Server size={14} color="#6366f1" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>System Health</span>
              {health && <Badge variant={health.status === 'healthy' ? 'green' : 'orange'}>{health.status}</Badge>}
            </div>
            {healthLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>Checking services...</div>
            ) : health?.services ? (
              health.services.map((svc) => (
                <div key={svc.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusDot status={svc.status as 'online' | 'offline' | 'degraded'} />
                    <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{svc.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {svc.latency_ms !== undefined && <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{svc.latency_ms}ms</span>}
                    <Badge variant={svc.status === 'online' ? 'green' : svc.status === 'degraded' ? 'orange' : 'red'}>{svc.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <AlertCircle size={20} color="#f43f5e" style={{ margin: '0 auto 6px' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Backend not connected</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 3 }}>uvicorn app.main:app --reload</div>
              </div>
            )}
          </GlassCard>

          {/* Integration Health */}
          <GlassCard style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Link size={14} color="#22d3ee" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Integration Health</span>
              <button onClick={() => setPage('integration')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#22d3ee' }}>View all →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {INTEGRATIONS_STATUS.map((intg) => (
                <div key={intg.name} style={{
                  padding: '8px 6px', textAlign: 'center', borderRadius: 7,
                  background: intg.status === 'connected' ? 'rgba(52,211,153,0.06)' : 'rgba(251,146,60,0.06)',
                  border: `1px solid ${intg.status === 'connected' ? 'rgba(52,211,153,0.15)' : 'rgba(251,146,60,0.15)'}`,
                }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{intg.icon}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{intg.name}</div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: intg.status === 'connected' ? '#34d399' : '#fb923c', margin: '3px auto 0' }} />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* Knowledge Base */}
          <GlassCard style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Activity size={14} color="#a78bfa" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Knowledge Base</span>
            </div>
            {categories && Object.entries(categories).length > 0 ? (
              Object.entries(categories).map(([cat, count]) => {
                const colors: Record<string, string> = { hr_policy: '#6366f1', engineering: '#22d3ee', security: '#f43f5e', onboarding: '#a3e635', api_docs: '#fb923c', runbook: '#34d399', incident: '#facc15', architecture: '#a78bfa', deployment: '#4ade80' }
                const color = colors[cat] || '#94a3b8'
                const total = Object.values(categories).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color }}>{count} docs</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.4, duration: 0.6 }} style={{ height: '100%', background: color, borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[['hr_policy', '#6366f1', 3], ['engineering', '#22d3ee', 5], ['security', '#f43f5e', 2], ['onboarding', '#a3e635', 2], ['api_docs', '#fb923c', 1], ['runbook', '#34d399', 2]].map(([cat, color, count]) => (
                  <div key={cat as string} style={{ padding: '8px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 7 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: color as string }}>{count}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{(cat as string).replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Activity Feed */}
          <GlassCard style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={14} color="#34d399" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Recent Activity</span>
              <button onClick={() => setPage('governance')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#34d399' }}>Full audit →</button>
            </div>
            {recentAudit.length > 0 ? (
              recentAudit.map((entry) => {
                const rc = ROLE_CONFIGS[entry.user_role]
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{rc.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.query_preview}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 9, color: rc.color }}>{rc.label}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{entry.response_time_ms}ms</span>
                        {entry.permission_violation && <span style={{ fontSize: 9, color: '#f43f5e' }}>⚠ BLOCKED</span>}
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>{timeAgo(entry.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                Send a message in chat to see live activity
              </div>
            )}
          </GlassCard>
        </div>

        {/* RAG Config */}
        <GlassCard style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Zap size={14} color="#22d3ee" />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Enterprise RAG Configuration</span>
            <Badge variant="cyan" size="sm">Phase 2</Badge>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {[
              { label: 'Embedding Model', value: 'BAAI/bge-small-en-v1.5', color: '#6366f1' },
              { label: 'Vector Dimensions', value: '384-dim', color: '#22d3ee' },
              { label: 'LLM Engine', value: 'Ollama (Local)', color: '#a78bfa' },
              { label: 'Vector Database', value: 'Qdrant', color: '#34d399' },
              { label: 'Pipeline Stages', value: '13 (security-first)', color: '#f43f5e' },
              { label: 'Access Control', value: 'Permission-Aware', color: '#fb923c' },
              { label: 'Ingestion Mode', value: 'Incremental', color: '#4ade80' },
              { label: 'Integrations', value: '8 connected', color: '#22d3ee' },
              { label: 'Governance', value: 'SOC2 + GDPR', color: '#a78bfa' },
              { label: 'Data Egress', value: '0 bytes (local)', color: '#34d399' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 7, padding: '10px' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
