import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, LayoutDashboard, Database, Cpu, BookOpen, GitBranch,
  ChevronLeft, ChevronRight, Plus, Trash2, Clock, Settings, Shield,
  Link, BarChart2, RefreshCw, Lock, Heart, GraduationCap
} from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useUIStore } from '@/stores/uiStore'
import { ROLE_CONFIGS, type Page } from '@/types'

interface NavGroup {
  label: string
  items: Array<{ id: Page; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }>
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Core AI',
    items: [
      { id: 'chat', label: 'AI Copilot', icon: <MessageSquare size={15} /> },
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
      { id: 'embeddings', label: 'Embeddings', icon: <Database size={15} /> },
    ],
  },
  {
    label: 'Enterprise',
    items: [
      { id: 'integration', label: 'Integrations', icon: <Link size={15} />, badge: '8', badgeColor: '#22d3ee' },
      { id: 'ingestion', label: 'Ingestion Pipeline', icon: <RefreshCw size={15} />, badge: 'LIVE', badgeColor: '#34d399' },
      { id: 'knowledge', label: 'Knowledge Base', icon: <BookOpen size={15} /> },
      { id: 'health', label: 'Knowledge Health', icon: <Heart size={15} /> },
    ],
  },
  {
    label: 'Security & Governance',
    items: [
      { id: 'security', label: 'Security Sim', icon: <Lock size={15} />, badge: 'RBAC', badgeColor: '#f43f5e' },
      { id: 'governance', label: 'Governance', icon: <BarChart2 size={15} /> },
    ],
  },
  {
    label: 'Architecture',
    items: [
      { id: 'architecture', label: 'RAG Pipeline', icon: <GitBranch size={15} /> },
      { id: 'learn', label: 'Learn Mode', icon: <GraduationCap size={15} />, badge: 'EDU', badgeColor: '#a78bfa' },
    ],
  },
]

export default function Sidebar() {
  const { currentPage, setPage, sidebarOpen, toggleSidebar } = useUIStore()
  const { conversations, activeConversationId, createConversation, setActiveConversation, deleteConversation, currentRole } = useChatStore()

  const role = ROLE_CONFIGS[currentRole]

  const handleNewChat = () => {
    const id = createConversation()
    setActiveConversation(id)
    setPage('chat')
  }

  return (
    <motion.div
      animate={{ width: sidebarOpen ? 240 : 56 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div style={{
        padding: sidebarOpen ? '16px 12px 12px' : '16px 8px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifyContent: sidebarOpen ? 'space-between' : 'center',
      }}>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28,
                background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                borderRadius: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Cpu size={15} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Enterprise AI</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Copilot v2.0</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!sidebarOpen && (
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={15} color="white" />
          </div>
        )}
        <button onClick={toggleSidebar} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: 4, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div style={{ padding: '10px 8px 6px' }}>
        <button onClick={handleNewChat} className="btn-primary" style={{ width: '100%', padding: sidebarOpen ? '8px 12px' : '8px', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center', gap: 6, fontSize: 12 }}>
          <Plus size={14} />
          {sidebarOpen && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation — grouped */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: sidebarOpen ? 12 : 8 }}>
            {sidebarOpen && (
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 6px 4px', fontFamily: 'var(--font-mono)' }}>
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <div
                key={item.id}
                id={`nav-${item.id}`}
                className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', padding: sidebarOpen ? '7px 10px' : '8px', marginBottom: 1 }}
              >
                <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                {sidebarOpen && (
                  <>
                    <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-mono)', color: item.badgeColor, background: `${item.badgeColor}18`, border: `1px solid ${item.badgeColor}30`, padding: '1px 4px', borderRadius: 3 }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
            {!sidebarOpen && <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 8px' }} />}
          </div>
        ))}

        {/* Recent Conversations */}
        {sidebarOpen && conversations.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 6px 6px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={9} />
              Recent
            </div>
            {conversations.slice(0, 8).map((conv) => (
              <div key={conv.id}
                onClick={() => { setActiveConversation(conv.id); setPage('chat') }}
                style={{
                  padding: '6px 8px',
                  borderRadius: 5,
                  cursor: 'pointer',
                  background: activeConversationId === conv.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: `1px solid ${activeConversationId === conv.id ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 1,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={(e) => { if (activeConversationId !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={(e) => { if (activeConversationId !== conv.id) e.currentTarget.style.background = 'transparent' }}
              >
                <MessageSquare size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: activeConversationId === conv.id ? 'var(--accent-blue)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {conv.title}
                </span>
                <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 1, opacity: 0.4 }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#f43f5e' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  <Trash2 size={9} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — current role */}
      <div style={{
        padding: sidebarOpen ? '10px 12px' : '10px 8px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifyContent: sidebarOpen ? 'space-between' : 'center',
      }}>
        {sidebarOpen ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `${role.color}20`,
              border: `1px solid ${role.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
            }}>
              {role.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: role.color }}>{role.label}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Shield size={8} />
                <span>L{role.clearanceLevel} Clearance</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${role.color}20`, border: `1px solid ${role.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
            {role.icon}
          </div>
        )}
        {sidebarOpen && <Settings size={14} color="var(--text-muted)" style={{ cursor: 'pointer', flexShrink: 0 }} />}
      </div>
    </motion.div>
  )
}
