import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, ShieldX, ShieldCheck, ChevronRight, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import { GlassCard, Badge, ConfidenceBar } from '@/components/ui'
import { useChatStore } from '@/stores/chatStore'
import { useUIStore } from '@/stores/uiStore'
import { ROLE_CONFIGS, type UserRole, type AccessLevel } from '@/types'

// ─── Permission Matrix ────────────────────────────────────────────────────────
const DOC_CATEGORIES = [
  { id: 'onboarding', label: 'Onboarding', color: '#a3e635' },
  { id: 'api_docs', label: 'API Docs', color: '#fb923c' },
  { id: 'engineering', label: 'Engineering', color: '#22d3ee' },
  { id: 'runbook', label: 'Runbooks', color: '#34d399' },
  { id: 'deployment', label: 'Deployment', color: '#4ade80' },
  { id: 'incident', label: 'Incidents', color: '#facc15' },
  { id: 'architecture', label: 'Architecture', color: '#a78bfa' },
  { id: 'hr_policy', label: 'HR Policy', color: '#6366f1' },
  { id: 'security', label: 'Security', color: '#f43f5e' },
]

// ─── Demo access scenarios ─────────────────────────────────────────────────────
const DEMO_QUERIES = [
  { query: 'What is the onboarding checklist for new engineers?', category: 'onboarding', expectedAccess: 'public' as AccessLevel },
  { query: 'Show me the Kubernetes deployment guide', category: 'deployment', expectedAccess: 'internal' as AccessLevel },
  { query: 'What are the HR leave policies?', category: 'hr_policy', expectedAccess: 'internal' as AccessLevel },
  { query: 'Show the security compliance policy details', category: 'security', expectedAccess: 'confidential' as AccessLevel },
  { query: 'Show the executive salary structure and compensation', category: 'architecture', expectedAccess: 'restricted' as AccessLevel },
  { query: 'What is in the executive AI strategy roadmap?', category: 'architecture', expectedAccess: 'restricted' as AccessLevel },
]

function PermissionGate({ allowed }: { allowed: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 4,
        background: allowed ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)',
        border: `1px solid ${allowed ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}`,
        fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
        color: allowed ? '#34d399' : '#f43f5e',
      }}
    >
      {allowed ? <CheckCircle size={9} /> : <XCircle size={9} />}
      {allowed ? 'ALLOWED' : 'BLOCKED'}
    </motion.div>
  )
}

function SecurityFlowDiagram({ role }: { role: UserRole }) {
  const config = ROLE_CONFIGS[role]
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % 8), 800)
    return () => clearInterval(interval)
  }, [])

  const FLOW_STEPS = [
    { label: 'User Query', desc: 'Employee sends question', color: '#6366f1', icon: '💬' },
    { label: 'Authentication', desc: 'JWT token validated', color: '#a78bfa', icon: '🪪' },
    { label: 'Role Lookup', desc: `Role: ${config.label}`, color: '#22d3ee', icon: config.icon },
    { label: 'Permission Check', desc: `Clearance: L${config.clearanceLevel}`, color: '#fb923c', icon: '🔐' },
    { label: 'Metadata Filter', desc: `Levels: ${config.allowedAccessLevels.join(', ')}`, color: '#f43f5e', icon: '🏷️' },
    { label: 'Qdrant Query', desc: 'Role-filtered search', color: '#34d399', icon: '🔍' },
    { label: 'LLM Receives Only', desc: 'Permitted context only', color: '#8b5cf6', icon: '🤖' },
    { label: 'Grounded Response', desc: 'No unauthorized leakage', color: '#4ade80', icon: '✅' },
  ]

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Shield size={12} />SECURITY FLOW — ANIMATING IN REAL TIME
      </div>
      {FLOW_STEPS.map((s, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <motion.div
            animate={i === step % FLOW_STEPS.length ? { scale: 1.02, x: 4 } : { scale: 1, x: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '6px 8px', borderRadius: 6,
              background: i === step % FLOW_STEPS.length ? `${s.color}15` : 'transparent',
              border: `1px solid ${i === step % FLOW_STEPS.length ? s.color + '40' : 'transparent'}`,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: i <= step % FLOW_STEPS.length ? `${s.color}20` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${i <= step % FLOW_STEPS.length ? s.color + '50' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11,
            }}>
              {i <= step % FLOW_STEPS.length ? s.icon : <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{i + 1}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: i <= step % FLOW_STEPS.length ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
          </motion.div>
          {i < FLOW_STEPS.length - 1 && (
            <div style={{ width: 1, height: 6, background: i < step % FLOW_STEPS.length ? s.color + '40' : 'rgba(255,255,255,0.06)', margin: '2px 0 2px 12px', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
      {/* Key callout */}
      <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#f43f5e', marginBottom: 3 }}>⚠ Critical Security Principle</div>
        <div style={{ fontSize: 10, color: 'rgba(244,63,94,0.8)' }}>The LLM is the LAST step. It only receives what passes the permission filter. The LLM itself NEVER decides access control.</div>
      </div>
    </div>
  )
}

export default function SecurityPage() {
  const { currentRole, setRole } = useChatStore()
  const { setPage } = useUIStore()
  const [demoResult, setDemoResult] = useState<{ query: string; allowed: boolean; reason: string } | null>(null)

  const config = ROLE_CONFIGS[currentRole]

  const runDemo = (queryDef: typeof DEMO_QUERIES[0]) => {
    const allowed = config.allowedAccessLevels.includes(queryDef.expectedAccess)
    setDemoResult({
      query: queryDef.query,
      allowed,
      reason: allowed
        ? `${config.label} (L${config.clearanceLevel}) has access to ${queryDef.expectedAccess} documents.`
        : `${config.label} (L${config.clearanceLevel}) does NOT have access to ${queryDef.expectedAccess} documents. This content is filtered before the LLM receives it.`,
    })
  }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Security Simulation</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 700 }}>
            Simulate permission-aware retrieval. Change your role and see which documents you can access.
            <strong style={{ color: '#f43f5e' }}> The LLM NEVER decides permissions</strong> — security happens at the retrieval layer.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Role selector */}
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} color="#6366f1" />Select Your Role
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(Object.values(ROLE_CONFIGS) as typeof ROLE_CONFIGS[UserRole][]).map((role) => (
                <motion.button key={role.id} whileTap={{ scale: 0.97 }}
                  onClick={() => { setRole(role.id); setDemoResult(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: currentRole === role.id ? `${role.color}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${currentRole === role.id ? role.color + '40' : 'var(--border-subtle)'}`,
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: 18 }}>{role.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: currentRole === role.id ? role.color : 'var(--text-primary)' }}>{role.label}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>L{role.clearanceLevel}</div>
                  </div>
                  {currentRole === role.id && <CheckCircle size={12} color={role.color} style={{ marginLeft: 'auto' }} />}
                </motion.button>
              ))}
            </div>

            {/* Current permissions */}
            <div style={{ marginTop: 14, padding: '10px 12px', background: `${config.color}08`, border: `1px solid ${config.color}20`, borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: config.color, marginBottom: 6 }}>
                {config.icon} {config.label} — Access Profile
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>{config.description}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {config.allowedAccessLevels.map(lvl => (
                  <span key={lvl} style={{
                    fontSize: 9, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 3,
                    background: lvl === 'restricted' ? 'rgba(244,63,94,0.15)' : lvl === 'confidential' ? 'rgba(251,146,60,0.15)' : lvl === 'internal' ? 'rgba(34,211,238,0.15)' : 'rgba(52,211,153,0.15)',
                    color: lvl === 'restricted' ? '#f43f5e' : lvl === 'confidential' ? '#fb923c' : lvl === 'internal' ? '#22d3ee' : '#34d399',
                  }}>✓ {lvl}</span>
                ))}
                {(['public', 'internal', 'confidential', 'restricted'] as AccessLevel[]).filter(l => !config.allowedAccessLevels.includes(l)).map(lvl => (
                  <span key={lvl} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 3, background: 'rgba(244,63,94,0.08)', color: 'rgba(244,63,94,0.6)' }}>
                    ✗ {lvl}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Security flow diagram */}
          <GlassCard>
            <SecurityFlowDiagram role={currentRole} />
          </GlassCard>
        </div>

        {/* Demo query tester */}
        <GlassCard style={{ padding: '20px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={14} color="#22d3ee" />Test Permission Enforcement
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
            {DEMO_QUERIES.map((q, i) => {
              const allowed = config.allowedAccessLevels.includes(q.expectedAccess)
              return (
                <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => runDemo(q)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: allowed ? 'rgba(52,211,153,0.05)' : 'rgba(244,63,94,0.05)',
                    border: `1px solid ${allowed ? 'rgba(52,211,153,0.2)' : 'rgba(244,63,94,0.2)'}`,
                    position: 'relative',
                  }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>{q.query}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PermissionGate allowed={allowed} />
                    <span style={{
                      fontSize: 9, fontFamily: 'var(--font-mono)',
                      color: q.expectedAccess === 'restricted' ? '#f43f5e' : q.expectedAccess === 'confidential' ? '#fb923c' : '#94a3b8',
                    }}>
                      {q.expectedAccess}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence>
            {demoResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: demoResult.allowed ? 'rgba(52,211,153,0.08)' : 'rgba(244,63,94,0.08)',
                  border: `1px solid ${demoResult.allowed ? 'rgba(52,211,153,0.25)' : 'rgba(244,63,94,0.25)'}`,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {demoResult.allowed ? <ShieldCheck size={16} color="#34d399" /> : <ShieldX size={16} color="#f43f5e" />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: demoResult.allowed ? '#34d399' : '#f43f5e' }}>
                    {demoResult.allowed ? 'ACCESS GRANTED' : 'ACCESS DENIED — Permission Filter Applied'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 4 }}>
                  Query: "{demoResult.query}"
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {demoResult.reason}
                </div>
                {!demoResult.allowed && (
                  <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(244,63,94,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock size={10} />
                    The Qdrant query was filtered — the LLM never received this content, so it cannot be leaked.
                  </div>
                )}
                {!demoResult.allowed && (
                  <button onClick={() => setPage('chat')} style={{ marginTop: 8, background: 'none', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 10, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ChevronRight size={10} />Try this in Chat as {config.label}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Permission Matrix */}
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={14} color="#f43f5e" />Permission Matrix
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-subtle)' }}>Category</th>
                  {(Object.values(ROLE_CONFIGS) as typeof ROLE_CONFIGS[UserRole][]).map(r => (
                    <th key={r.id} style={{ padding: '8px', textAlign: 'center', fontSize: 10, color: r.id === currentRole ? r.color : 'var(--text-muted)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-subtle)', background: r.id === currentRole ? `${r.color}08` : 'transparent' }}>
                      {r.icon} {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOC_CATEGORIES.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ padding: '7px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, color: cat.color }}>
                      {cat.label}
                    </td>
                    {(Object.values(ROLE_CONFIGS) as typeof ROLE_CONFIGS[UserRole][]).map(role => {
                      const has = role.allowedCategories.includes(cat.id as any)
                      return (
                        <td key={role.id} style={{ padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', background: role.id === currentRole ? `${role.color}05` : 'transparent' }}>
                          {has
                            ? <CheckCircle size={12} color="#34d399" style={{ opacity: 0.8 }} />
                            : <XCircle size={12} color="#f43f5e" style={{ opacity: 0.4 }} />
                          }
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
