import React from 'react'
import { motion } from 'framer-motion'
import { Heart, AlertTriangle, CheckCircle, Clock, XCircle, TrendingDown, TrendingUp, BookOpen } from 'lucide-react'
import { GlassCard, Badge } from '@/components/ui'
import type { KnowledgeHealthMetric } from '@/types'

// ─── Realistic knowledge health data ─────────────────────────────────────────
const HEALTH_METRICS: KnowledgeHealthMetric[] = [
  { area: 'Employee Onboarding', score: 78, document_count: 3, avg_age_days: 45, has_gaps: false, last_updated: '2025-01-20' },
  { area: 'Security & Compliance', score: 85, document_count: 4, avg_age_days: 12, has_gaps: false, last_updated: '2025-05-10' },
  { area: 'Engineering Runbooks', score: 91, document_count: 8, avg_age_days: 18, has_gaps: false, last_updated: '2025-04-28' },
  { area: 'API Documentation', score: 62, document_count: 2, avg_age_days: 120, has_gaps: true, gap_description: 'Missing: authentication guide, rate limiting docs, error code reference', last_updated: '2025-01-15' },
  { area: 'HR Policies', score: 88, document_count: 3, avg_age_days: 30, has_gaps: false, last_updated: '2025-04-01' },
  { area: 'Architecture Decisions', score: 70, document_count: 5, avg_age_days: 60, has_gaps: true, gap_description: 'Missing: frontend architecture ADR, mobile strategy ADR', last_updated: '2025-03-01' },
  { area: 'Incident Playbooks', score: 55, document_count: 2, avg_age_days: 180, has_gaps: true, gap_description: 'Missing: database incident, network incident, security breach playbooks', last_updated: '2024-11-20' },
  { area: 'Product Roadmap', score: 20, document_count: 0, avg_age_days: 365, has_gaps: true, gap_description: 'NO DOCUMENTATION EXISTS — AI cannot answer any product roadmap questions', last_updated: 'Never' },
  { area: 'Customer Success / SLAs', score: 30, document_count: 1, avg_age_days: 210, has_gaps: true, gap_description: 'Missing: SLA thresholds, escalation matrix, customer success playbooks', last_updated: '2024-10-01' },
  { area: 'Data Engineering', score: 40, document_count: 1, avg_age_days: 150, has_gaps: true, gap_description: 'Missing: pipeline documentation, data dictionary, schema registry', last_updated: '2024-12-15' },
]

const LOW_CONF_QUERIES = [
  { query: 'What is our product roadmap for Q3?', confidence: 0.07 },
  { query: 'What are our SLA commitments to enterprise customers?', confidence: 0.18 },
  { query: 'How do I fix a data pipeline failure?', confidence: 0.24 },
  { query: 'What authentication method should I use for the mobile API?', confidence: 0.31 },
  { query: 'What is our incident playbook for network outages?', confidence: 0.28 },
]

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fb923c' : '#f43f5e'
  const pct = score / 100
  const circumference = 2 * Math.PI * (size / 2 - 8)
  const strokeDashoffset = circumference * (1 - pct)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 8} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={size / 2 - 8}
        fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1.2, delay: 0.3 }}
        strokeLinecap="round"
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill={color} fontSize={size * 0.22} fontWeight="bold" style={{ transform: `rotate(90deg) translate(0, -${size}px)`, transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {score}
      </text>
    </svg>
  )
}

export default function KnowledgeHealthPage() {
  const overallScore = Math.round(HEALTH_METRICS.reduce((a, m) => a + m.score, 0) / HEALTH_METRICS.length)
  const gapCount = HEALTH_METRICS.filter(m => m.has_gaps).length
  const outdatedCount = HEALTH_METRICS.filter(m => m.avg_age_days > 90).length

  const scoreColor = overallScore >= 75 ? '#34d399' : overallScore >= 50 ? '#fb923c' : '#f43f5e'

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Knowledge Health</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 700 }}>
            <strong style={{ color: '#f43f5e' }}>Enterprise AI quality = Documentation quality.</strong> Poor documentation creates knowledge gaps that cause AI to hallucinate, refuse, or give outdated answers.
          </p>
        </motion.div>

        {/* Overall score + stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, marginBottom: 18 }}>
          <GlassCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ScoreGauge score={overallScore} size={100} />
            <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor }}>Knowledge Health</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              {overallScore < 60 ? '⚠️ Poor — AI quality severely impacted' :
               overallScore < 75 ? '🟡 Fair — Multiple gaps detected' : '✅ Good — Minor gaps only'}
            </div>
          </GlassCard>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <GlassCard style={{ padding: '16px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f43f5e', marginBottom: 4 }}>{gapCount}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Knowledge Gaps</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>Areas where AI cannot answer questions reliably</div>
            </GlassCard>
            <GlassCard style={{ padding: '16px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fb923c', marginBottom: 4 }}>{outdatedCount}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Outdated Areas</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>Docs &gt;90 days old — AI may give stale answers</div>
            </GlassCard>
            <GlassCard style={{ padding: '16px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399', marginBottom: 4 }}>
                {HEALTH_METRICS.filter(m => !m.has_gaps && m.avg_age_days < 60).length}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Healthy Areas</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>Current, complete, reliable for AI answers</div>
            </GlassCard>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Health grid */}
          <div>
            <GlassCard style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={14} color="#22d3ee" />Coverage by Area
              </div>
              {HEALTH_METRICS.map((metric, i) => {
                const color = metric.score >= 75 ? '#34d399' : metric.score >= 50 ? '#fb923c' : '#f43f5e'
                return (
                  <motion.div key={metric.area} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{metric.area}</span>
                        {metric.has_gaps && (
                          <AlertTriangle size={11} color="#f43f5e" />
                        )}
                        {metric.avg_age_days > 90 && (
                          <Clock size={10} color="#fb923c" />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {metric.document_count} docs · {metric.avg_age_days}d old
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{metric.score}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.score}%` }}
                        transition={{ delay: i * 0.05 + 0.3, duration: 0.7 }}
                        style={{ height: '100%', borderRadius: 3, background: color, boxShadow: `0 0 8px ${color}40`, transition: 'background 0.3s' }}
                      />
                    </div>
                    {metric.has_gaps && metric.gap_description && (
                      <div style={{ fontSize: 10, color: '#f43f5e', marginTop: 3, opacity: 0.8, lineHeight: 1.4 }}>
                        ⚠ {metric.gap_description}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </GlassCard>
          </div>

          {/* Right panel */}
          <div>
            {/* Low confidence queries */}
            <GlassCard style={{ padding: '16px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <TrendingDown size={13} color="#f43f5e" />Low Confidence Retrievals
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                Queries where AI struggles due to missing documentation:
              </div>
              {LOW_CONF_QUERIES.map((q, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.4 }}>
                    "{q.query}"
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${q.confidence * 100}%` }} transition={{ delay: i * 0.1 + 0.5 }}
                        style={{ height: '100%', borderRadius: 2, background: '#f43f5e' }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#f43f5e', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {(q.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </GlassCard>

            {/* The key insight */}
            <GlassCard style={{ padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: '#22d3ee' }}>
                💡 Why This Matters
              </div>
              {[
                { title: 'Garbage in, garbage out', desc: 'AI quality is bounded by documentation quality. RAG cannot answer what isn\'t documented.' },
                { title: 'Forces documentation culture', desc: 'Enterprise AI deployment incentivizes teams to maintain comprehensive, current documentation.' },
                { title: 'Measurable KPI', desc: 'Knowledge health score becomes a business metric — not just a dev concern.' },
                { title: 'Hallucination prevention', desc: 'When confidence is low, the system should say "I don\'t know" — not hallucinate.' },
              ].map(({ title, desc }) => (
                <div key={title} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
