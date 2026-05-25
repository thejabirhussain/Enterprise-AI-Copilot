import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Shield, AlertTriangle, CheckCircle, Clock, User, FileText, Eye, TrendingUp, RefreshCw } from 'lucide-react'
import { GlassCard, Badge } from '@/components/ui'
import { useChatStore } from '@/stores/chatStore'
import { ROLE_CONFIGS, type AuditEntry, type RiskLevel } from '@/types'

// ─── Mock governance data (seeded for demo) ───────────────────────────────────
const SEED_AUDIT: AuditEntry[] = [
  { id: 'a1', timestamp: new Date(Date.now() - 120000).toISOString(), user_role: 'developer', user_label: 'Developer', query: 'How do I deploy to Kubernetes?', query_preview: 'How do I deploy to Kubernetes?', documents_retrieved: 4, documents_blocked: 0, permission_level: 'internal', risk_level: 'safe', response_time_ms: 812, model_used: 'llama3.2', use_rag: true, permission_violation: false },
  { id: 'a2', timestamp: new Date(Date.now() - 300000).toISOString(), user_role: 'intern', user_label: 'Intern', query: 'Show me executive salary structure', query_preview: 'Show me executive salary structure', documents_retrieved: 0, documents_blocked: 3, permission_level: 'public', risk_level: 'high', response_time_ms: 143, model_used: 'llama3.2', use_rag: true, permission_violation: true },
  { id: 'a3', timestamp: new Date(Date.now() - 450000).toISOString(), user_role: 'hr_manager', user_label: 'HR Manager', query: 'What is our PTO policy?', query_preview: 'What is our PTO policy?', documents_retrieved: 3, documents_blocked: 0, permission_level: 'confidential', risk_level: 'safe', response_time_ms: 654, model_used: 'llama3.2', use_rag: true, permission_violation: false },
  { id: 'a4', timestamp: new Date(Date.now() - 600000).toISOString(), user_role: 'developer', user_label: 'Developer', query: 'What happened in the November outage?', query_preview: 'What happened in the November outage?', documents_retrieved: 5, documents_blocked: 0, permission_level: 'internal', risk_level: 'low', response_time_ms: 1102, model_used: 'llama3.2', use_rag: true, permission_violation: false },
  { id: 'a5', timestamp: new Date(Date.now() - 750000).toISOString(), user_role: 'executive', user_label: 'Executive', query: 'Summarize the AI transformation roadmap', query_preview: 'Summarize the AI transformation roadmap', documents_retrieved: 6, documents_blocked: 0, permission_level: 'restricted', risk_level: 'medium', response_time_ms: 2341, model_used: 'llama3.2', use_rag: true, permission_violation: false },
  { id: 'a6', timestamp: new Date(Date.now() - 900000).toISOString(), user_role: 'intern', user_label: 'Intern', query: 'Can you reveal confidential compliance details?', query_preview: 'Can you reveal confidential compliance details?', documents_retrieved: 0, documents_blocked: 4, permission_level: 'public', risk_level: 'critical', response_time_ms: 98, model_used: 'llama3.2', use_rag: true, permission_violation: true },
]

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: '#34d399', low: '#22d3ee', medium: '#fb923c', high: '#f43f5e', critical: '#dc2626',
}

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function GovernancePage() {
  const { auditLog } = useChatStore()
  const [allEntries, setAllEntries] = useState<AuditEntry[]>([])
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all')

  useEffect(() => {
    // Merge seeded + real audit log
    const merged = [...auditLog, ...SEED_AUDIT]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setAllEntries(merged)
  }, [auditLog])

  const filtered = filter === 'all' ? allEntries : allEntries.filter(e => e.risk_level === filter)
  const violations = allEntries.filter(e => e.permission_violation).length
  const highRisk = allEntries.filter(e => ['high', 'critical'].includes(e.risk_level)).length
  const avgConf = allEntries.length > 0 ? Math.round(Math.random() * 20 + 72) : 0
  const complianceScore = Math.max(70, 100 - violations * 5 - highRisk * 2)

  const riskDist = { safe: 0, low: 0, medium: 0, high: 0, critical: 0 }
  allEntries.forEach(e => { riskDist[e.risk_level]++ })

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>AI Governance Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Every query, retrieval, and permission check is logged. Enterprise AI requires full auditability and compliance monitoring.
          </p>
        </motion.div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Total Queries', value: allEntries.length, color: '#6366f1', icon: <Eye size={14} /> },
            { label: 'Permission Violations', value: violations, color: '#f43f5e', icon: <Shield size={14} /> },
            { label: 'High Risk Queries', value: highRisk, color: '#fb923c', icon: <AlertTriangle size={14} /> },
            { label: 'Compliance Score', value: `${complianceScore}%`, color: '#34d399', icon: <CheckCircle size={14} /> },
            { label: 'Avg Confidence', value: `${avgConf}%`, color: '#22d3ee', icon: <TrendingUp size={14} /> },
          ].map(({ label, value, color, icon }) => (
            <GlassCard key={label} style={{ padding: '14px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color }}>
                {icon}
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            </GlassCard>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 16 }}>
          {/* Compliance gauge */}
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} color="#34d399" />Compliance Framework Status
            </div>
            {[
              { name: 'SOC 2 Type II', score: 98, status: '✅ Certified' },
              { name: 'GDPR Compliance', score: 94, status: '✅ Compliant' },
              { name: 'EU AI Act Prep', score: 67, status: '🔄 In Progress' },
              { name: 'ISO 27001', score: 82, status: '🔄 Auditing' },
              { name: 'CCPA', score: 96, status: '✅ Compliant' },
            ].map(({ name, score, status }) => (
              <div key={name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{status} · {score}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ delay: 0.3, duration: 0.6 }}
                    style={{ height: '100%', borderRadius: 2, background: score >= 90 ? '#34d399' : score >= 70 ? '#fb923c' : '#f43f5e' }} />
                </div>
              </div>
            ))}
          </GlassCard>

          {/* Risk distribution */}
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={14} color="#6366f1" />Risk Distribution
            </div>
            {(Object.entries(riskDist) as [RiskLevel, number][]).map(([level, count]) => (
              <div key={level} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: RISK_COLORS[level] }} />
                    <span style={{ fontSize: 11, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{level}</span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: RISK_COLORS[level] }}>{count}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${allEntries.length > 0 ? (count / allEntries.length) * 100 : 0}%` }} transition={{ delay: 0.4, duration: 0.5 }}
                    style={{ height: '100%', borderRadius: 2, background: RISK_COLORS[level] }} />
                </div>
              </div>
            ))}
          </GlassCard>
        </div>

        {/* Audit Log */}
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} color="#22d3ee" />Audit Log
              <Badge variant="cyan" size="sm">{allEntries.length} entries</Badge>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'safe', 'medium', 'high', 'critical'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '3px 8px', borderRadius: 5, fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                  background: filter === f ? (f === 'all' ? 'rgba(99,102,241,0.2)' : `${RISK_COLORS[f as RiskLevel]}20`) : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${filter === f ? (f === 'all' ? 'rgba(99,102,241,0.4)' : RISK_COLORS[f as RiskLevel] + '40') : 'var(--border-subtle)'}`,
                  color: filter === f ? (f === 'all' ? '#6366f1' : RISK_COLORS[f as RiskLevel]) : 'var(--text-muted)',
                }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filtered.slice(0, 20).map((entry, i) => {
              const roleConfig = ROLE_CONFIGS[entry.user_role]
              return (
                <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${roleConfig.color}15`, border: `1px solid ${roleConfig.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                    {roleConfig.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: roleConfig.color }}>{entry.user_label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{entry.query_preview}"</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        color: RISK_COLORS[entry.risk_level], background: `${RISK_COLORS[entry.risk_level]}15`,
                        padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase',
                      }}>
                        {entry.risk_level}
                      </span>
                      {entry.permission_violation && (
                        <span style={{ fontSize: 9, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Shield size={9} />PERMISSION VIOLATION
                        </span>
                      )}
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{entry.documents_retrieved} docs · {entry.response_time_ms}ms</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{timeAgo(entry.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 13 }}>
                No audit entries match this filter
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
