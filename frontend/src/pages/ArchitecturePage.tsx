import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { GitBranch, ArrowDown, Zap, Database, Search, Code, Cpu, CheckCircle, MessageSquare } from 'lucide-react'
import { workflowApi } from '@/api'
import { GlassCard, Badge } from '@/components/ui'

const ICON_MAP: Record<string, React.ReactNode> = {
  message: <MessageSquare size={20} />, zap: <Zap size={20} />, search: <Search size={20} />,
  database: <Database size={20} />, code: <Code size={20} />, cpu: <Cpu size={20} />,
  'check-circle': <CheckCircle size={20} />,
}

const LAYERS: Record<string, string> = {
  api: 'API Layer', embedding: 'Embedding Layer', vector_db: 'Vector DB',
  retrieval: 'Retrieval Layer', orchestration: 'Orchestration', llm: 'LLM Engine', response: 'Response Layer',
}

export default function ArchitecturePage() {
  const { data: workflow } = useQuery({ queryKey: ['workflow'], queryFn: workflowApi.getDefinition })

  const steps = workflow?.steps || []
  const config = workflow?.config || {}

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            RAG Architecture
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Interactive diagram of the 7-step Retrieval-Augmented Generation pipeline powering the Enterprise AI Copilot
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Pipeline diagram */}
          <GlassCard style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <GitBranch size={16} color="#6366f1" />
              <span style={{ fontSize: 14, fontWeight: 700 }}>7-Step RAG Pipeline</span>
              <Badge variant="blue">Production</Badge>
            </div>

            {steps.map((step, i) => (
              <motion.div
                key={step.step_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                {/* Step box */}
                <div style={{
                  width: '100%',
                  background: `${step.color}10`,
                  border: `1px solid ${step.color}30`,
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${step.color}18`
                    e.currentTarget.style.borderColor = `${step.color}50`
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${step.color}10`
                    e.currentTarget.style.borderColor = `${step.color}30`
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  {/* Step number + icon */}
                  <div style={{
                    width: 48, height: 48,
                    borderRadius: 12,
                    background: `${step.color}20`,
                    border: `1px solid ${step.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: step.color,
                    flexShrink: 0,
                  }}>
                    {ICON_MAP[step.icon] || <Zap size={20} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: step.color, fontWeight: 700 }}>
                        STEP {step.step_id}
                      </span>
                      <span style={{
                        fontSize: 9, color: 'var(--text-muted)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-subtle)',
                        padding: '1px 5px', borderRadius: 3,
                      }}>
                        {LAYERS[step.layer] || step.layer}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {step.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {step.description}
                    </div>
                  </div>
                </div>

                {/* Connector arrow */}
                {i < steps.length - 1 && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '6px 0',
                    color: 'var(--text-muted)',
                  }}>
                    <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
                    <ArrowDown size={14} />
                    <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
                  </div>
                )}
              </motion.div>
            ))}
          </GlassCard>

          {/* Config + explanation panel */}
          <div>
            <GlassCard style={{ padding: '16px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Pipeline Configuration</div>
              {Object.entries(config).map(([key, val]) => (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize', fontFamily: 'var(--font-mono)' }}>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 11, color: '#22d3ee', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {String(val)}
                  </span>
                </div>
              ))}
            </GlassCard>

            <GlassCard style={{ padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Tech Stack</div>
              {[
                { label: 'Frontend', value: 'Vite + React + TypeScript', color: '#22d3ee' },
                { label: 'Styling', value: 'Tailwind CSS + Framer Motion', color: '#a78bfa' },
                { label: 'State', value: 'Zustand + React Query', color: '#fb923c' },
                { label: 'Backend', value: 'FastAPI + Python 3.11', color: '#6366f1' },
                { label: 'LLM', value: 'Ollama (Llama3, Mistral)', color: '#f43f5e' },
                { label: 'Embeddings', value: 'BAAI/bge-small-en-v1.5', color: '#34d399' },
                { label: 'Vector DB', value: 'Qdrant', color: '#facc15' },
                { label: 'Container', value: 'Docker Compose', color: '#67e8f9' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: 11, color, fontFamily: 'var(--font-mono)', fontWeight: 600, textAlign: 'right', maxWidth: 160 }}>
                    {value}
                  </span>
                </div>
              ))}
            </GlassCard>
          </div>
        </div>

        {/* Key concepts */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: 16 }}>
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Enterprise AI Concepts</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {[
                { title: 'RAG (Retrieval-Augmented Generation)', desc: 'Combines retrieval from a vector database with LLM generation. Prevents hallucination by grounding responses in verified documents.', color: '#6366f1' },
                { title: 'Semantic Embeddings', desc: 'Dense vector representations capturing meaning. Similar text produces similar vectors (high cosine similarity).', color: '#22d3ee' },
                { title: 'Vector Similarity Search', desc: 'Finds semantically related documents using approximate nearest neighbor search in high-dimensional space.', color: '#34d399' },
                { title: 'Hallucination Prevention', desc: 'By only answering from retrieved context, the LLM cannot fabricate information not in the knowledge base.', color: '#f43f5e' },
              ].map(({ title, desc, color }) => (
                <div key={title} style={{
                  padding: '14px', background: `${color}08`,
                  border: `1px solid ${color}20`, borderRadius: 10,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
