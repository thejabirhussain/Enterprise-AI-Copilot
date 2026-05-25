import React from 'react'

// ─── GlassCard ───────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  hover?: boolean
  glow?: boolean
}

export function GlassCard({ children, className = '', style, onClick, hover = false, glow = false }: GlassCardProps) {
  return (
    <div
      className={`glass-card ${hover ? 'cursor-pointer' : ''} ${className}`}
      style={{
        ...(glow ? { boxShadow: '0 0 30px rgba(99,102,241,0.15), 0 4px 24px rgba(0,0,0,0.4)' } : {}),
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'cyan' | 'green' | 'orange' | 'red' | 'purple' | 'default'
  size?: 'sm' | 'md'
}

const badgeColors = {
  blue: 'color: #6366f1; background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.25)',
  cyan: 'color: #22d3ee; background: rgba(34,211,238,0.1); border-color: rgba(34,211,238,0.2)',
  green: 'color: #34d399; background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.2)',
  orange: 'color: #fb923c; background: rgba(251,146,60,0.1); border-color: rgba(251,146,60,0.2)',
  red: 'color: #f43f5e; background: rgba(244,63,94,0.1); border-color: rgba(244,63,94,0.2)',
  purple: 'color: #a78bfa; background: rgba(167,139,250,0.1); border-color: rgba(167,139,250,0.2)',
  default: 'color: #94a3b8; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08)',
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-mono font-medium border rounded`}
      style={{
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? '11px' : '12px',
        ...(badgeColors[variant].split(';').reduce((acc, style) => {
          const [key, val] = style.split(':')
          if (key && val) acc[key.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = val.trim()
          return acc
        }, {} as Record<string, string>))
      }}
    >
      {children}
    </span>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
interface SpinnerProps {
  size?: number
  color?: string
}

export function LoadingSpinner({ size = 20, color = '#6366f1' }: SpinnerProps) {
  return (
    <div
      className="animate-spin"
      style={{
        width: size,
        height: size,
        border: `2px solid rgba(255,255,255,0.1)`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
      }}
    />
  )
}

// ─── Status Dot ───────────────────────────────────────────────────────────────
interface StatusDotProps {
  status: 'online' | 'offline' | 'degraded'
  label?: string
}

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`status-dot-${status}`}
        style={{ width: 8, height: 8, borderRadius: '50%' }}
      />
      {label && (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
      )}
    </div>
  )
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
interface ConfidenceBarProps {
  score: number
  label?: string
}

export function ConfidenceBar({ score, label }: ConfidenceBarProps) {
  const color = score >= 0.75 ? '#34d399' : score >= 0.5 ? '#fb923c' : '#f43f5e'
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
          <span style={{ fontSize: 11, color, fontFamily: 'var(--font-mono)' }}>
            {(score * 100).toFixed(0)}%
          </span>
        </div>
      )}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
        <div
          style={{
            height: '100%',
            width: `${score * 100}%`,
            background: color,
            borderRadius: 2,
            boxShadow: `0 0 8px ${color}60`,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  )
}
