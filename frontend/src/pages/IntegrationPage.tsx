import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, ArrowDown, ArrowRight, Zap, Server, Shield, Database, Cpu, CheckCircle, Users, Code, FileText, GitBranch } from 'lucide-react'
import { GlassCard, Badge } from '@/components/ui'
import type { Integration } from '@/types'

// ─── Mock integrations data ───────────────────────────────────────────────────
const INTEGRATIONS: Integration[] = [
  { id: 'teams', name: 'Microsoft Teams', type: 'communication', status: 'connected', last_event: '2m ago', requests_today: 1842, icon: '💬', description: 'Employee queries via Teams bot', color: '#6264A7' },
  { id: 'slack', name: 'Slack', type: 'communication', status: 'connected', last_event: '45s ago', requests_today: 2341, icon: '⚡', description: 'Slack AI assistant integration', color: '#E01E5A' },
  { id: 'jira', name: 'Jira', type: 'devtools', status: 'connected', last_event: '5m ago', requests_today: 432, icon: '🎯', description: 'Ticket context and resolution', color: '#0052CC' },
  { id: 'confluence', name: 'Confluence', type: 'docs', status: 'connected', last_event: '12m ago', requests_today: 891, icon: '📚', description: 'Wiki and documentation sync', color: '#0052CC' },
  { id: 'github', name: 'GitHub', type: 'devtools', status: 'connected', last_event: '3m ago', requests_today: 312, icon: '🐙', description: 'Code docs and PR context', color: '#6e40c9' },
  { id: 'hr_system', name: 'Workday HCM', type: 'hr', status: 'degraded', last_event: '2h ago', requests_today: 89, icon: '👥', description: 'HR policies and org data', color: '#fb923c' },
  { id: 'portal', name: 'Internal Portal', type: 'portal', status: 'connected', last_event: '1m ago', requests_today: 3201, icon: '🏢', description: 'Company intranet search', color: '#22d3ee' },
  { id: 'sharepoint', name: 'SharePoint', type: 'docs', status: 'connected', last_event: '8m ago', requests_today: 567, icon: '📂', description: 'Document management sync', color: '#038387' },
]

const FLOW_NODES = [
  { label: 'Microsoft Teams', icon: '💬', color: '#6264A7', type: 'interface' },
  { label: 'Slack', icon: '⚡', color: '#E01E5A', type: 'interface' },
  { label: 'Jira / GitHub', icon: '🎯', color: '#0052CC', type: 'interface' },
  { label: 'Internal Portal', icon: '🏢', color: '#22d3ee', type: 'interface' },
]

function FlowDiagram() {
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [animating, setAnimating] = useState(false)
  const [flowStep, setFlowStep] = useState(-1)

  const runDemo = () => {
    setAnimating(true)
    setFlowStep(0)
    const steps = [0, 1, 2, 3, 4, 5]
    steps.forEach((step, i) => {
      setTimeout(() => {
        setFlowStep(step)
        if (i === steps.length - 1) setTimeout(() => { setAnimating(false); setFlowStep(-1) }, 1000)
      }, i * 600)
    })
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Enterprise Integration Architecture</div>
        <button onClick={runDemo} disabled={animating} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} />
          {animating ? 'Tracing flow...' : 'Trace Live Request'}
        </button>
      </div>

      {/* Interface layer */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
          Interface Layer — Multiple entry points, ONE backend
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {FLOW_NODES.map((node, i) => (
            <motion.div
              key={node.label}
              animate={flowStep === 0 ? { scale: [1, 1.05, 1], boxShadow: [`0 0 0 rgba(99,102,241,0)`, `0 0 20px ${node.color}60`, `0 0 0 rgba(99,102,241,0)`] } : {}}
              style={{
                background: `${node.color}12`,
                border: `1px solid ${node.color}30`,
                borderRadius: 10, padding: '12px',
                textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${node.color}60` }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${node.color}30` }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{node.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{node.label}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>User Request</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Arrow down */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
        <motion.div animate={flowStep === 1 ? { scale: [1, 1.3, 1] } : {}} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: flowStep >= 1 ? '#6366f1' : 'var(--text-muted)' }}>
          <div style={{ width: 1, height: 20, background: flowStep >= 1 ? '#6366f1' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
          <ArrowDown size={14} />
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>HTTP / WebSocket</div>
        </motion.div>
      </div>

      {/* API Gateway */}
      <motion.div animate={flowStep === 1 ? { borderColor: '#6366f1', boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.4)', '0 0 10px rgba(99,102,241,0.2)'] } : {}}
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '14px 20px', marginBottom: 6, transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Server size={20} color="#6366f1" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>API Gateway + Auth</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>JWT validation · Rate limiting · Request routing · Audit logging starts here</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge variant="blue">Kong / AWS API GW</Badge>
        </div>
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
        <motion.div animate={flowStep === 2 ? { scale: [1, 1.3, 1] } : {}} style={{ color: flowStep >= 2 ? '#a78bfa' : 'var(--text-muted)' }}>
          <ArrowDown size={14} />
        </motion.div>
      </div>

      {/* AI Orchestration */}
      <motion.div animate={flowStep === 2 ? { borderColor: '#a78bfa', boxShadow: '0 0 20px rgba(167,139,250,0.3)' } : {}}
        style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, padding: '14px 20px', marginBottom: 6, transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Zap size={20} color="#a78bfa" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>AI Orchestration Engine</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Query routing · Permission validation · Context assembly · Prompt engineering</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge variant="purple">FastAPI / LangChain</Badge>
        </div>
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
        <motion.div animate={flowStep === 3 ? { scale: [1, 1.3, 1] } : {}} style={{ color: flowStep >= 3 ? '#22d3ee' : 'var(--text-muted)' }}>
          <ArrowDown size={14} />
        </motion.div>
      </div>

      {/* RAG + Vector split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
        <motion.div animate={flowStep === 3 ? { borderColor: '#22d3ee', boxShadow: '0 0 16px rgba(34,211,238,0.25)' } : {}}
          style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, padding: '12px', transition: 'all 0.3s' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={13} />RAG + Permission Filter
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Embed query → Filter by role → Search Qdrant
          </div>
        </motion.div>
        <motion.div animate={flowStep === 4 ? { borderColor: '#34d399', boxShadow: '0 0 16px rgba(52,211,153,0.25)' } : {}}
          style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '12px', transition: 'all 0.3s' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Database size={13} />Qdrant Vector DB
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            384-dim embeddings · Cosine similarity · Metadata filter
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
        <motion.div animate={flowStep === 5 ? { scale: [1, 1.3, 1] } : {}} style={{ color: flowStep >= 5 ? '#8b5cf6' : 'var(--text-muted)' }}>
          <ArrowDown size={14} />
        </motion.div>
      </div>

      <motion.div animate={flowStep === 5 ? { borderColor: '#8b5cf6', boxShadow: '0 0 20px rgba(139,92,246,0.3)' } : {}}
        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, padding: '14px 20px', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Cpu size={20} color="#8b5cf6" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6' }}>Ollama LLM (On-Premise)</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Llama 3.2 / Mistral · Local inference · Data never leaves company</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge variant="purple">Zero Data Egress</Badge>
        </div>
      </motion.div>

      {/* Key insight */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={12} />Key Architecture Insight
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Teams, Slack, Jira, and all other interfaces are <strong style={{ color: 'var(--text-secondary)' }}>interchangeable entry points</strong>. The AI backend, security, and knowledge retrieval are completely independent. <strong style={{ color: 'var(--text-secondary)' }}>This is enterprise AI</strong> — not a standalone chatbot.
        </div>
      </div>
    </div>
  )
}

export default function IntegrationPage() {
  const [selected, setSelected] = useState<Integration | null>(null)

  const totalRequests = INTEGRATIONS.reduce((a, i) => a + i.requests_today, 0)
  const connected = INTEGRATIONS.filter(i => i.status === 'connected').length

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Enterprise Integration Layer</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 700 }}>
            The AI Copilot doesn't live in one place. It's embedded across every enterprise tool employees already use —
            Teams, Slack, Jira, Confluence — all routing through one secure, governed AI backend.
          </p>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Integrations', value: `${INTEGRATIONS.length}`, sub: `${connected} connected`, color: '#6366f1' },
            { label: 'Requests Today', value: totalRequests.toLocaleString(), sub: 'across all channels', color: '#22d3ee' },
            { label: 'Single Backend', value: '1', sub: 'unified AI engine', color: '#34d399' },
            { label: 'Data Egress', value: '0 bytes', sub: 'fully on-premise', color: '#f43f5e' },
          ].map(({ label, value, sub, color }) => (
            <GlassCard key={label} style={{ padding: '14px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{sub}</div>
            </GlassCard>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Flow Diagram */}
          <GlassCard>
            <FlowDiagram />
          </GlassCard>

          {/* Integration cards */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Active Integrations</div>
            {INTEGRATIONS.map((intg, i) => (
              <motion.div key={intg.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard hover onClick={() => setSelected(selected?.id === intg.id ? null : intg)} style={{ padding: '12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${intg.color}18`, border: `1px solid ${intg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {intg.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{intg.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{intg.requests_today.toLocaleString()} req/day</div>
                    </div>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: intg.status === 'connected' ? '#34d399' : intg.status === 'degraded' ? '#fb923c' : '#f43f5e', boxShadow: `0 0 6px ${intg.status === 'connected' ? '#34d399' : intg.status === 'degraded' ? '#fb923c' : '#f43f5e'}` }} />
                  </div>
                  <AnimatePresence>
                    {selected?.id === intg.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {intg.description}
                        <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                          Last event: {intg.last_event} · Type: {intg.type}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
