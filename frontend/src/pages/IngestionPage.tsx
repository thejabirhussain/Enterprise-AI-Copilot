import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle, Clock, Database, Zap, ArrowDown, Play, AlertCircle, FileText, GitBranch, Users } from 'lucide-react'
import { GlassCard, Badge, LoadingSpinner } from '@/components/ui'
import type { IngestionEvent, IngestionSource } from '@/types'

const SOURCE_CONFIG: Record<IngestionSource, { label: string; icon: string; color: string }> = {
  confluence: { label: 'Confluence', icon: '📚', color: '#0052CC' },
  jira: { label: 'Jira', icon: '🎯', color: '#0052CC' },
  github: { label: 'GitHub', icon: '🐙', color: '#6e40c9' },
  hr_system: { label: 'Workday', icon: '👥', color: '#fb923c' },
  manual: { label: 'Manual Upload', icon: '📤', color: '#22d3ee' },
  sharepoint: { label: 'SharePoint', icon: '📂', color: '#038387' },
  notion: { label: 'Notion', icon: '📝', color: '#ffffff' },
}

// ─── Seed ingestion events ─────────────────────────────────────────────────────
const SEED_EVENTS: IngestionEvent[] = [
  { id: 'e1', timestamp: new Date(Date.now() - 60000).toISOString(), source: 'confluence', document_title: 'API Gateway Configuration Guide', document_id: 'doc_conf_001', event_type: 'updated', chunks_processed: 12, embeddings_generated: 12, duration_ms: 2340, status: 'completed', incremental: true },
  { id: 'e2', timestamp: new Date(Date.now() - 180000).toISOString(), source: 'hr_system', document_title: 'Employee Benefits Policy 2025', document_id: 'doc_hr_002', event_type: 'updated', chunks_processed: 3, embeddings_generated: 3, duration_ms: 890, status: 'completed', incremental: true },
  { id: 'e3', timestamp: new Date(Date.now() - 420000).toISOString(), source: 'github', document_title: 'Platform Service README', document_id: 'doc_gh_003', event_type: 'created', chunks_processed: 8, embeddings_generated: 8, duration_ms: 1560, status: 'completed', incremental: false },
  { id: 'e4', timestamp: new Date(Date.now() - 900000).toISOString(), source: 'jira', document_title: 'Sprint Retrospective Notes Q4', document_id: 'doc_jira_004', event_type: 'created', chunks_processed: 5, embeddings_generated: 5, duration_ms: 1100, status: 'completed', incremental: false },
  { id: 'e5', timestamp: new Date(Date.now() - 3600000).toISOString(), source: 'sharepoint', document_title: 'Q4 Engineering All-Hands Deck', document_id: 'doc_sp_005', event_type: 'updated', chunks_processed: 24, embeddings_generated: 24, duration_ms: 4200, status: 'completed', incremental: true },
]

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function PipelineAnimator({ running }: { running: boolean }) {
  const STEPS = [
    { label: 'Source System', icon: '📚', desc: 'Document updated', color: '#6366f1' },
    { label: 'Webhook Trigger', icon: '⚡', desc: 'Event fired', color: '#22d3ee' },
    { label: 'Document Extraction', icon: '📄', desc: 'Parse & clean', color: '#fb923c' },
    { label: 'Diff Detection', icon: '🔍', desc: 'Find changed chunks only', color: '#a78bfa' },
    { label: 'Chunking', icon: '✂️', desc: '512-char segments', color: '#34d399' },
    { label: 'Embedding Generation', icon: '🧬', desc: 'BAAI/bge-small-en-v1.5', color: '#22d3ee' },
    { label: 'Qdrant Upsert', icon: '🗄️', desc: 'Update only changed vectors', color: '#4ade80' },
    { label: 'Index Refresh', icon: '✅', desc: 'Live immediately', color: '#34d399' },
  ]

  const [step, setStep] = useState(-1)
  useEffect(() => {
    if (!running) { setStep(-1); return }
    let i = 0
    const interval = setInterval(() => {
      setStep(i)
      i++
      if (i >= STEPS.length) clearInterval(interval)
    }, 400)
    return () => clearInterval(interval)
  }, [running])

  return (
    <div>
      {STEPS.map((s, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <motion.div
            animate={i === step ? { x: 4, scale: 1.02 } : i < step ? { x: 0 } : { x: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '8px 10px', borderRadius: 7,
              background: i < step ? `${s.color}10` : i === step ? `${s.color}20` : 'transparent',
              border: `1px solid ${i <= step ? s.color + '30' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: i <= step ? `${s.color}20` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${i <= step ? s.color + '50' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              transition: 'all 0.3s',
            }}>
              {i < step ? '✓' : i === step ? (running ? '⟳' : s.icon) : <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{i + 1}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
            {i < step && <CheckCircle size={12} color={s.color} />}
            {i === step && running && <LoadingSpinner size={12} color={s.color} />}
          </motion.div>
          {i < STEPS.length - 1 && (
            <div style={{ width: 1, height: 10, background: i < step ? `${s.color}40` : 'rgba(255,255,255,0.06)', margin: '2px 0 2px 14px', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function IngestionPage() {
  const [events, setEvents] = useState<IngestionEvent[]>(SEED_EVENTS)
  const [running, setRunning] = useState(false)
  const [triggeredSource, setTriggeredSource] = useState<IngestionSource | null>(null)

  const triggerIngestion = (source: IngestionSource) => {
    if (running) return
    setRunning(true)
    setTriggeredSource(source)

    setTimeout(() => {
      const newEvent: IngestionEvent = {
        id: `e${Date.now()}`,
        timestamp: new Date().toISOString(),
        source,
        document_title: `Updated ${SOURCE_CONFIG[source].label} Document`,
        document_id: `doc_${source}_${Date.now()}`,
        event_type: Math.random() > 0.5 ? 'updated' : 'created',
        chunks_processed: Math.floor(Math.random() * 15) + 3,
        embeddings_generated: Math.floor(Math.random() * 15) + 3,
        duration_ms: Math.floor(Math.random() * 2000) + 500,
        status: 'completed',
        incremental: true,
      }
      setEvents(prev => [newEvent, ...prev])
      setRunning(false)
      setTriggeredSource(null)
    }, 3600)
  }

  const totalChunks = events.reduce((a, e) => a + e.chunks_processed, 0)
  const totalDocs = events.length

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Knowledge Ingestion Pipeline</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 700 }}>
            Enterprise knowledge continuously updates. When a document changes in Confluence, Jira, or GitHub, only the
            <strong style={{ color: '#22d3ee' }}> changed chunks</strong> are re-embedded — not the entire knowledge base.
          </p>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
          {[
            { label: 'Documents Indexed', value: '156', color: '#6366f1' },
            { label: 'Events Processed', value: totalDocs, color: '#22d3ee' },
            { label: 'Chunks Updated', value: totalChunks, color: '#34d399' },
            { label: 'Ingestion Mode', value: 'Incremental', color: '#a78bfa' },
          ].map(({ label, value, color }) => (
            <GlassCard key={label} style={{ padding: '14px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
            </GlassCard>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Pipeline steps */}
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} color="#22d3ee" />Incremental Ingestion Pipeline
              </div>
              {running && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#22d3ee' }}>
                  <LoadingSpinner size={12} color="#22d3ee" />
                  Processing {SOURCE_CONFIG[triggeredSource!]?.label}...
                </div>
              )}
            </div>

            {/* Key concept callout */}
            <div style={{ padding: '10px 12px', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', marginBottom: 4 }}>⚡ Incremental vs Full Re-index</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Full re-index:</strong> Reprocess all 156 documents = ~45 min, expensive. <br />
                <strong style={{ color: '#22d3ee' }}>Incremental:</strong> Only embed the 3 changed chunks = ~2 seconds. This is how production systems work.
              </div>
            </div>

            <PipelineAnimator running={running} />

            {/* Trigger buttons */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Simulate Webhook Trigger:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['confluence', 'github', 'jira', 'hr_system'] as IngestionSource[]).map(source => (
                  <button key={source} onClick={() => triggerIngestion(source)} disabled={running}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                      background: running && triggeredSource === source ? `${SOURCE_CONFIG[source].color}20` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${SOURCE_CONFIG[source].color}30`,
                      borderRadius: 6, cursor: running ? 'not-allowed' : 'pointer',
                      fontSize: 12, color: 'var(--text-secondary)',
                    }}>
                    <span>{SOURCE_CONFIG[source].icon}</span>
                    {SOURCE_CONFIG[source].label}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Event log */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Recent Ingestion Events</div>
            <div style={{ maxHeight: 560, overflowY: 'auto' }}>
              <AnimatePresence>
                {events.map((ev, i) => {
                  const src = SOURCE_CONFIG[ev.source]
                  return (
                    <motion.div key={ev.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <GlassCard style={{ padding: '12px', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 16 }}>{src.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ev.document_title}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{src.label} · {timeAgo(ev.timestamp)}</div>
                          </div>
                          <Badge variant={ev.event_type === 'updated' ? 'orange' : 'green'} size="sm">
                            {ev.event_type}
                          </Badge>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#22d3ee' }}>
                            {ev.chunks_processed} chunks
                          </span>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                            {ev.embeddings_generated} embeddings
                          </span>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {ev.duration_ms}ms
                          </span>
                          {ev.incremental && (
                            <span style={{ fontSize: 9, color: '#a78bfa', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Zap size={8} />incremental
                            </span>
                          )}
                        </div>
                      </GlassCard>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
