import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ChevronDown, ChevronUp, ExternalLink, Shield } from 'lucide-react'
import { ConfidenceBar } from '@/components/ui'
import type { SourceCitation } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  hr_policy: '#6366f1',
  engineering: '#22d3ee',
  security: '#f43f5e',
  onboarding: '#a3e635',
  api_docs: '#fb923c',
  runbook: '#34d399',
  incident: '#facc15',
  architecture: '#a78bfa',
  support: '#67e8f9',
  deployment: '#4ade80',
}

const CATEGORY_LABELS: Record<string, string> = {
  hr_policy: 'HR Policy',
  engineering: 'Engineering',
  security: 'Security',
  onboarding: 'Onboarding',
  api_docs: 'API Docs',
  runbook: 'Runbook',
  incident: 'Incident',
  architecture: 'Architecture',
  support: 'Support',
  deployment: 'Deployment',
}

interface SourceCardProps {
  source: SourceCitation
  index: number
}

function SourceCard({ source, index }: SourceCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const color = CATEGORY_COLORS[source.document_category] || '#6366f1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid rgba(255,255,255,0.06)`,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 8,
      }}
    >
      {/* Source Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '10px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        {/* Rank indicator */}
        <div style={{
          width: 20, height: 20,
          borderRadius: '50%',
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          color,
          flexShrink: 0,
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {source.document_title}
            </span>
            {/* Category badge */}
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color,
              background: `${color}15`,
              border: `1px solid ${color}30`,
              padding: '1px 5px',
              borderRadius: 3,
            }}>
              {CATEGORY_LABELS[source.document_category] || source.document_category}
            </span>
            {/* Access level */}
            <span style={{
              fontSize: 9,
              color: '#94a3b8',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              <Shield size={8} />
              {source.access_level}
            </span>
          </div>

          {/* Content preview */}
          <div style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {source.content_preview}
          </div>

          {/* Confidence bar */}
          <div style={{ marginTop: 8 }}>
            <ConfidenceBar score={source.similarity_score} label="Similarity" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {source.department}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Chunk {source.chunk_index + 1}
            </span>
          </div>
        </div>

        <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Expanded full content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 12px 12px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 10,
            }}>
              <div style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 6,
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
              }}>
                {source.full_content}
              </div>
              <div style={{
                marginTop: 6,
                fontSize: 10,
                color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <FileText size={10} />
                <span>{source.source_file}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface SourceCitationPanelProps {
  sources: SourceCitation[]
  isLoading?: boolean
}

export default function SourceCitationPanel({ sources, isLoading }: SourceCitationPanelProps) {
  if (isLoading) {
    return (
      <div>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '12px',
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '60%', marginBottom: 6 }} />
                <div style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 3, width: '90%', marginBottom: 4 }} />
                <div style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 3, width: '75%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (sources.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 16px', color: 'var(--text-muted)' }}>
        <FileText size={24} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
        <div style={{ fontSize: 12 }}>No sources retrieved</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>Enable RAG mode to see source citations</div>
      </div>
    )
  }

  return (
    <div>
      {sources.map((source, index) => (
        <SourceCard key={source.chunk_id} source={source} index={index} />
      ))}
    </div>
  )
}
