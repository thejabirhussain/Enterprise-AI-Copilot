import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ChevronDown } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { ROLE_CONFIGS, type UserRole } from '@/types'

export default function RoleSelector() {
  const { currentRole, setRole } = useChatStore()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const current = ROLE_CONFIGS[currentRole]

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        id="role-selector-btn"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: `${current.color}12`,
          border: `1px solid ${current.color}40`,
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <Shield size={13} color={current.color} />
        <span style={{ fontSize: 12, fontWeight: 700, color: current.color }}>
          {current.icon} {current.label}
        </span>
        <ChevronDown size={12} color={current.color} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              width: 280,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                Switch Role — Affects Retrieval Permissions
              </div>
            </div>
            {(Object.values(ROLE_CONFIGS) as typeof ROLE_CONFIGS[UserRole][]).map((role) => (
              <button
                key={role.id}
                onClick={() => { setRole(role.id); setOpen(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  background: currentRole === role.id ? `${role.color}10` : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${currentRole === role.id ? role.color : 'transparent'}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (currentRole !== role.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={(e) => { if (currentRole !== role.id) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 8,
                  background: `${role.color}15`,
                  border: `1px solid ${role.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                }}>
                  {role.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: currentRole === role.id ? role.color : 'var(--text-primary)' }}>
                      {role.label}
                    </span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      L{role.clearanceLevel}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {role.description}
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {role.allowedAccessLevels.map((level) => (
                      <span key={level} style={{
                        fontSize: 9,
                        fontFamily: 'var(--font-mono)',
                        color: level === 'restricted' ? '#f43f5e' : level === 'confidential' ? '#fb923c' : level === 'internal' ? '#22d3ee' : '#34d399',
                        background: level === 'restricted' ? 'rgba(244,63,94,0.1)' : level === 'confidential' ? 'rgba(251,146,60,0.1)' : level === 'internal' ? 'rgba(34,211,238,0.1)' : 'rgba(52,211,153,0.1)',
                        padding: '1px 4px',
                        borderRadius: 3,
                      }}>
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
