import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { Database, Zap, Plus, X, Play } from 'lucide-react'
import { embeddingsApi } from '@/api'
import { GlassCard, LoadingSpinner } from '@/components/ui'
import type { EmbeddingPoint } from '@/types'

// ─── Default texts for demo ────────────────────────────────────────────────────
const DEFAULT_TEXTS = [
  'Employee onboarding process',
  'Security incident response',
  'Database deployment runbook',
  'API authentication guide',
  'HR leave policy',
  'Kubernetes deployment steps',
  'Password security requirements',
  'Performance review process',
  'Production deployment checklist',
  'AWS cloud security standards',
]

const COLORS = ['#6366f1', '#22d3ee', '#34d399', '#f43f5e', '#fb923c', '#a78bfa', '#facc15', '#67e8f9', '#4ade80', '#f472b6']

// ─── 2D Scatter Canvas ────────────────────────────────────────────────────────
function EmbeddingCanvas({ points }: { points: EmbeddingPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 400 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({ w: containerRef.current.clientWidth, h: 400 })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || points.length === 0) return
    const ctx = canvas.getContext('2d')!

    const W = canvasSize.w
    const H = canvasSize.h
    const PAD = 60

    // Clear
    ctx.clearRect(0, 0, W, H)

    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = PAD + (i / 10) * (W - PAD * 2)
      const y = PAD + (i / 10) * (H - PAD * 2)
      ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, H - PAD); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    const midX = W / 2; const midY = H / 2
    ctx.beginPath(); ctx.moveTo(PAD, midY); ctx.lineTo(W - PAD, midY); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(midX, PAD); ctx.lineTo(midX, H - PAD); ctx.stroke()

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '11px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('PC1 (Principal Component 1)', midX, H - 10)
    ctx.save(); ctx.translate(16, midY); ctx.rotate(-Math.PI / 2)
    ctx.fillText('PC2', 0, 0); ctx.restore()

    // Map [-1,1] to canvas coords
    const toX = (x: number) => PAD + ((x + 1) / 2) * (W - PAD * 2)
    const toY = (y: number) => PAD + ((1 - (y + 1) / 2)) * (H - PAD * 2)

    // Draw similarity lines between close points
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x
        const dy = points[i].y - points[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 0.4) {
          ctx.beginPath()
          ctx.moveTo(toX(points[i].x), toY(points[i].y))
          ctx.lineTo(toX(points[j].x), toY(points[j].y))
          ctx.strokeStyle = `rgba(99,102,241,${0.15 - dist * 0.3})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    // Draw points
    points.forEach((p, i) => {
      const x = toX(p.x); const y = toY(p.y)
      const color = COLORS[i % COLORS.length]
      const isHov = hovered === i

      // Glow
      if (isHov) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 30)
        grad.addColorStop(0, color + '40')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill()
      }

      // Point
      ctx.beginPath(); ctx.arc(x, y, isHov ? 10 : 7, 0, Math.PI * 2)
      ctx.fillStyle = color + (isHov ? 'ff' : 'cc')
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5
      ctx.stroke()

      // Label
      ctx.fillStyle = isHov ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)'
      ctx.font = `${isHov ? '600 ' : ''}11px Inter, sans-serif`
      ctx.textAlign = 'center'
      const label = p.label.length > 20 ? p.label.slice(0, 18) + '…' : p.label
      ctx.fillText(label, x, y - 14)
    })
  }, [points, hovered, canvasSize])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || points.length === 0) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top
    const W = canvasSize.w; const H = canvasSize.h; const PAD = 60
    const toX = (x: number) => PAD + ((x + 1) / 2) * (W - PAD * 2)
    const toY = (y: number) => PAD + ((1 - (y + 1) / 2)) * (H - PAD * 2)

    let closest = -1; let minDist = Infinity
    points.forEach((p, i) => {
      const dx = mx - toX(p.x); const dy = my - toY(p.y)
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < 30 && d < minDist) { minDist = d; closest = i }
    })
    setHovered(closest)
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={400}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        style={{ cursor: 'crosshair', borderRadius: 8, display: 'block', width: '100%' }}
      />
      {hovered !== null && points[hovered] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'var(--bg-card)',
            border: `1px solid ${COLORS[hovered % COLORS.length]}40`,
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {points[hovered].text}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            PC1: {points[hovered].x.toFixed(3)} · PC2: {points[hovered].y.toFixed(3)} · Cluster: {points[hovered].cluster}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Embedding preview: [{points[hovered].embedding_preview?.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Main Embeddings Page ─────────────────────────────────────────────────────
export default function EmbeddingsPage() {
  const [texts, setTexts] = useState<string[]>(DEFAULT_TEXTS)
  const [newText, setNewText] = useState('')
  const [points, setPoints] = useState<EmbeddingPoint[]>([])

  const embedMutation = useMutation({
    mutationFn: (t: string[]) => embeddingsApi.generate(t),
    onSuccess: (data) => setPoints(data.points),
  })

  useEffect(() => { embedMutation.mutate(texts) }, []) // eslint-disable-line

  const addText = () => {
    if (newText.trim() && texts.length < 20) {
      const updated = [...texts, newText.trim()]
      setTexts(updated)
      setNewText('')
      embedMutation.mutate(updated)
    }
  }

  const removeText = (i: number) => {
    const updated = texts.filter((_, idx) => idx !== i)
    setTexts(updated)
    if (updated.length > 1) embedMutation.mutate(updated)
    else setPoints([])
  }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Embedding Visualizer
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 600 }}>
            Visualize how text embeddings capture semantic meaning. Similar concepts cluster together in vector space.
            Points close together are semantically similar — the AI uses this to find relevant documents.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Canvas */}
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={16} color="#6366f1" />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Semantic Space (PCA 2D Projection)</span>
              </div>
              <button
                onClick={() => embedMutation.mutate(texts)}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}
              >
                {embedMutation.isPending ? <LoadingSpinner size={12} /> : <Play size={12} />}
                Re-embed
              </button>
            </div>
            {embedMutation.isPending ? (
              <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <LoadingSpinner size={32} />
                  <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>Generating embeddings...</div>
                </div>
              </div>
            ) : (
              <EmbeddingCanvas points={points} />
            )}

            {/* Legend */}
            <div style={{ marginTop: 16, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                💡 <strong>How to read this:</strong> Points that are close together have similar meanings. The AI uses cosine similarity in 384 dimensions to find the most relevant documents for any query.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {texts.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.slice(0, 20)}…</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Controls */}
          <div>
            <GlassCard style={{ padding: '16px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} color="#22d3ee" />
                Add Text to Visualize
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="input-enterprise"
                  placeholder="Enter any text..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addText()}
                  style={{ fontSize: 12 }}
                />
                <button onClick={addText} className="btn-primary" style={{ padding: '8px 12px', flexShrink: 0 }}>
                  <Plus size={14} />
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {texts.length}/20 texts · Press Enter to add
              </div>
            </GlassCard>

            <GlassCard style={{ padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Current Texts</div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {texts.map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 0',
                    borderBottom: i < texts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{t}</span>
                    <button onClick={() => removeText(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Explanation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <GlassCard style={{ padding: '20px', marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>How Embeddings Power RAG</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {[
                { step: '01', title: 'Text → Vector', desc: 'BAAI/bge-small-en-v1.5 converts text to a 384-dimensional float vector capturing semantic meaning', color: '#6366f1' },
                { step: '02', title: 'Similarity Search', desc: 'Cosine similarity measures angle between vectors. Higher score = more semantically similar content', color: '#22d3ee' },
                { step: '03', title: 'Grounded Answers', desc: 'Most similar document chunks are retrieved and injected into the LLM prompt for grounded responses', color: '#34d399' },
              ].map(({ step, title, desc, color }) => (
                <div key={step} style={{ padding: '14px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color, marginBottom: 6 }}>STEP {step}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
