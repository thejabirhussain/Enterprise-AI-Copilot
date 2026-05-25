import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Circle, Loader, XCircle, ChevronDown, ChevronUp, ShieldCheck, ShieldX } from 'lucide-react'
import type { RAGWorkflow, WorkflowStep } from '@/types'

// 13-step Enterprise RAG Pipeline definition
const PIPELINE_STEPS = [
  { id: '1', name: 'Employee Query', layer: 'interface', color: '#6366f1', icon: '💬' },
  { id: '2', name: 'Identity Resolution', layer: 'auth', color: '#a78bfa', icon: '🪪' },
  { id: '3', name: 'Permission Validation', layer: 'security', color: '#f43f5e', icon: '🔐' },
  { id: '4', name: 'Embedding Generation', layer: 'ai', color: '#22d3ee', icon: '🧬' },
  { id: '5', name: 'Semantic Vector Search', layer: 'retrieval', color: '#0ea5e9', icon: '🔍' },
  { id: '6', name: 'Metadata Filtering', layer: 'security', color: '#f97316', icon: '🏷️' },
  { id: '7', name: 'Qdrant Retrieval', layer: 'vector_db', color: '#34d399', icon: '🗄️' },
  { id: '8', name: 'Access Control Check', layer: 'security', color: '#ef4444', icon: '🔒' },
  { id: '9', name: 'Context Injection', layer: 'orchestration', color: '#eab308', icon: '📥' },
  { id: '10', name: 'Prompt Orchestration', layer: 'orchestration', color: '#fb923c', icon: '🎛️' },
  { id: '11', name: 'LLM Generation', layer: 'llm', color: '#8b5cf6', icon: '🤖' },
  { id: '12', name: 'Response Moderation', layer: 'safety', color: '#ec4899', icon: '🛡️' },
  { id: '13', name: 'Grounded Response', layer: 'interface', color: '#4ade80', icon: '✅' },
]

const LAYER_LABELS: Record<string, string> = {
  interface: 'Interface', auth: 'Auth', security: 'Security', ai: 'AI Engine',
  retrieval: 'Retrieval', vector_db: 'Vector DB', orchestration: 'Orchestration',
  llm: 'LLM Engine', safety: 'Safety',
}

const LAYER_COLORS: Record<string, string> = {
  interface: '#6366f1', auth: '#a78bfa', security: '#f43f5e', ai: '#22d3ee',
  retrieval: '#0ea5e9', vector_db: '#34d399', orchestration: '#fb923c',
  llm: '#8b5cf6', safety: '#ec4899',
}

interface StepItemProps {
  step: WorkflowStep | null
  def: typeof PIPELINE_STEPS[0]
  index: number
  compact: boolean
}

function StepItem({ step, def, index, compact }: StepItemProps) {
  const status = step?.status || 'pending'
  const color = def.color

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Step row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        {/* Step icon circle */}
        <div style={{
          width: compact ? 24 : 28,
          height: compact ? 24 : 28,
          borderRadius: '50%',
          background: status === 'completed' ? `${color}20` : status === 'blocked' ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${status === 'completed' ? color + '50' : status === 'blocked' ? '#f43f5e40' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.3s',
          fontSize: compact ? 10 : 12,
        }}>
          {status === 'completed' && <span>{def.icon}</span>}
          {status === 'running' && <Loader size={compact ? 10 : 12} color={color} className="animate-spin" />}
          {status === 'blocked' && <ShieldX size={compact ? 10 : 12} color="#f43f5e" />}
          {status === 'pending' && <span style={{ fontSize: compact ? 8 : 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{def.id}</span>}
          {status === 'failed' && <XCircle size={compact ? 10 : 12} color="#f43f5e" />}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: compact ? 11 : 12,
              fontWeight: 600,
              color: status === 'completed' ? 'var(--text-primary)' : status === 'blocked' ? '#f43f5e' : 'var(--text-muted)',
              transition: 'color 0.3s',
            }}>
              {def.name}
            </span>
            {!compact && (
              <span style={{
                fontSize: 8, fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                color: LAYER_COLORS[def.layer] || '#94a3b8',
                background: `${LAYER_COLORS[def.layer] || '#94a3b8'}15`,
                padding: '1px 4px', borderRadius: 3,
              }}>
                {LAYER_LABELS[def.layer]}
              </span>
            )}
            {step?.duration_ms !== undefined && status === 'completed' && (
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                {step.duration_ms}ms
              </span>
            )}
          </div>
          {!compact && step?.metadata && status === 'completed' && (
            <div style={{ display: 'flex', gap: 3, marginTop: 2, flexWrap: 'wrap' }}>
              {Object.entries(step.metadata).slice(0, 3).map(([k, v]) => (
                <span key={k} style={{
                  fontSize: 9, fontFamily: 'var(--font-mono)',
                  color, background: `${color}12`,
                  padding: '1px 5px', borderRadius: 3,
                }}>
                  {k}: {typeof v === 'number' ? (Number.isInteger(v) ? v : (v as number).toFixed(3)) : String(v).slice(0, 15)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connector */}
      {index < PIPELINE_STEPS.length - 1 && (
        <div style={{
          width: 1,
          height: compact ? 8 : 12,
          background: status === 'completed' ? `${color}40` : 'rgba(255,255,255,0.06)',
          margin: '2px 0 2px 12px',
          alignSelf: 'flex-start',
          transition: 'background 0.3s',
        }} />
      )}
    </motion.div>
  )
}

interface RAGWorkflowVisualizerProps {
  workflow?: RAGWorkflow
  isLoading?: boolean
  compact?: boolean
}

export default function RAGWorkflowVisualizer({ workflow, isLoading, compact = false }: RAGWorkflowVisualizerProps) {
  const [expanded, setExpanded] = React.useState(!compact)

  // Build step map from workflow (backend uses 7 steps, we map to 13)
  const stepMap = new Map<string, WorkflowStep>()
  workflow?.steps.forEach((s) => stepMap.set(s.step_id, s))

  // Map 7 backend steps → 13 visual steps (fan out security/orchestration steps)
  const getStepStatus = (vizId: string): WorkflowStep | null => {
    if (!workflow) return null
    const backendMap: Record<string, string> = {
      '1': '1', '2': '1', '3': '2', '4': '3', '5': '4',
      '6': '4', '7': '5', '8': '5', '9': '6', '10': '6',
      '11': '7', '12': '7', '13': '7',
    }
    const backendId = backendMap[vizId]
    return stepMap.get(backendId) || null
  }

  const completedCount = workflow?.steps.filter(s => s.status === 'completed').length || 0
  const totalBackend = workflow?.steps.length || 0

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        style={{
          padding: compact ? '10px 14px' : '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: compact ? 'pointer' : 'default',
          borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none',
        }}
        onClick={() => compact && setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 22, height: 22,
            background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11,
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              Enterprise RAG Pipeline
            </div>
            {workflow && (
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {workflow.total_duration_ms}ms · {workflow.retrieval_count} docs · {workflow.model_used} · 13 stages
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Progress bar */}
          {workflow && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {PIPELINE_STEPS.map((_, i) => (
                <div key={i} style={{
                  width: 3, height: 12,
                  borderRadius: 1.5,
                  background: i < (completedCount / totalBackend * 13) ? '#34d399' : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          )}
          {isLoading && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', animation: 'status-pulse 1s ease infinite' }} />
          )}
          {compact && (
            expanded ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />
          )}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: compact ? '8px 12px' : '12px 14px' }}>
              {/* Security layer callout */}
              {!compact && (
                <div style={{
                  marginBottom: 10, padding: '6px 10px',
                  background: 'rgba(244,63,94,0.06)',
                  border: '1px solid rgba(244,63,94,0.15)',
                  borderRadius: 6,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <ShieldCheck size={11} color="#f43f5e" />
                  <span style={{ fontSize: 10, color: '#f43f5e' }}>
                    <strong>Security-first:</strong> Steps 2–3, 6, 8 ensure the LLM never receives unauthorized content
                  </span>
                </div>
              )}

              {isLoading && !workflow ? (
                [...Array(13)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: compact ? 4 : 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: `${55 + (i % 4) * 10}%` }} />
                  </div>
                ))
              ) : (
                PIPELINE_STEPS.map((def, index) => (
                  <StepItem
                    key={def.id}
                    def={def}
                    step={getStepStatus(def.id)}
                    index={index}
                    compact={compact}
                  />
                ))
              )}

              {/* Permission info */}
              {workflow?.permission_check && !compact && (
                <div style={{
                  marginTop: 8, padding: '8px 10px',
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 6,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', marginBottom: 4 }}>Permission Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Role: <strong style={{ color: 'var(--text-secondary)' }}>{workflow.permission_check.user_role}</strong>
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Retrieved: <strong style={{ color: '#34d399' }}>{workflow.permission_check.documents_filtered}</strong>
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Blocked: <strong style={{ color: '#f43f5e' }}>{workflow.permission_check.documents_blocked}</strong>
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Levels: <strong style={{ color: 'var(--text-secondary)' }}>{workflow.permission_check.allowed_levels.join(', ')}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
