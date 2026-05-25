import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Zap, ZapOff, Bot, User, Clock, ExternalLink, AlertCircle,
  ShieldX, ShieldCheck, ChevronDown, Lock, CheckCircle, Cpu
} from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useChatStore } from '@/stores/chatStore'
import { chatApi } from '@/api'
import RAGWorkflowVisualizer from '@/components/rag/RAGWorkflowVisualizer'
import SourceCitationPanel from '@/components/sources/SourceCitationPanel'
import RoleSelector from '@/components/security/RoleSelector'
import { LoadingSpinner, Badge, ConfidenceBar } from '@/components/ui'
import { ROLE_CONFIGS } from '@/types'
import type { Message } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const AVAILABLE_MODELS = ['llama3.2', 'llama3.1', 'mistral', 'deepseek-r1', 'phi3', 'qwen2.5']

const SUGGESTED_QUERIES = [
  'What is our engineer onboarding process?',
  'Explain the incident response procedure for a P0 outage',
  'What is our PTO policy and how do I request leave?',
  'How do I deploy a service to production in Kubernetes?',
  'What are our password and MFA requirements?',
  'Show me the executive compensation structure',  // ← Will be blocked for non-executives
]

function ThinkingAnimation() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
      <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Bot size={16} color="white" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="thinking-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', animationDelay: `${i * 0.2}s` }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Validating permissions · Searching knowledge base...
        </span>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const [showSources, setShowSources] = React.useState(false)
  const [showWorkflow, setShowWorkflow] = React.useState(false)
  const isUser = message.role === 'user'
  const isBlocked = message.permission_blocked

  const roleConfig = message.user_role ? ROLE_CONFIGS[message.user_role] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row', marginBottom: 18 }}
    >
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser ? (roleConfig ? `${roleConfig.color}25` : 'linear-gradient(135deg,#6366f1,#a78bfa)') : 'linear-gradient(135deg,#0f0f1a,#1a1a2e)',
        border: isUser ? (roleConfig ? `1px solid ${roleConfig.color}40` : 'none') : '1px solid rgba(99,102,241,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isUser && roleConfig ? 14 : undefined,
      }}>
        {isUser && roleConfig ? roleConfig.icon : isUser ? <User size={14} color="white" /> : <Bot size={14} color="#6366f1" />}
      </div>

      <div style={{ maxWidth: '78%', minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, justifyContent: isUser ? 'flex-end' : 'flex-start', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: isUser ? (roleConfig?.color || '#a78bfa') : '#6366f1' }}>
            {isUser ? (roleConfig?.label || 'You') : 'Enterprise AI'}
          </span>
          {!isUser && message.model_used && (
            <Badge variant="default" size="sm">{message.model_used}</Badge>
          )}
          {!isUser && message.use_rag !== undefined && (
            <Badge variant={message.use_rag ? 'cyan' : 'orange'} size="sm">
              {message.use_rag ? '⚡ RAG' : 'Direct'}
            </Badge>
          )}
          {!isUser && message.moderation && (
            <Badge variant={message.moderation.source_grounded ? 'green' : 'orange'} size="sm">
              {message.moderation.source_grounded ? '✓ Grounded' : '⚠ Ungrounded'}
            </Badge>
          )}
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={isUser ? 'message-user' : 'message-ai'}
          style={{
            padding: '12px 14px',
            ...(isBlocked ? { borderColor: 'rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)' } : {}),
          }}
        >
          {/* Permission blocked banner */}
          {isBlocked && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10,
              padding: '8px 10px',
              background: 'rgba(244,63,94,0.1)',
              border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: 6,
            }}>
              <ShieldX size={14} color="#f43f5e" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f43f5e' }}>Access Denied — Insufficient Permissions</div>
                <div style={{ fontSize: 10, color: 'rgba(244,63,94,0.8)', marginTop: 2 }}>
                  {message.blocked_reason || 'You do not have clearance to access the requested documents.'}
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
            {message.isStreaming && <span className="streaming-cursor" />}
          </div>

          {/* AI footer */}
          {!isUser && !message.isStreaming && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {message.confidence_score !== undefined && message.confidence_score > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Confidence</span>
                  <div style={{ width: 50 }}><ConfidenceBar score={message.confidence_score} /></div>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: message.confidence_score >= 0.7 ? '#34d399' : message.confidence_score >= 0.4 ? '#fb923c' : '#f43f5e' }}>
                    {(message.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {message.response_time_ms && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={9} color="var(--text-muted)" />
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{message.response_time_ms}ms</span>
                </div>
              )}
              {message.sources && message.sources.length > 0 && (
                <button onClick={() => setShowSources(!showSources)} style={{
                  background: showSources ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${showSources ? 'rgba(34,211,238,0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono)',
                  color: showSources ? '#22d3ee' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.15s',
                }}>
                  <ExternalLink size={8} />{message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
                </button>
              )}
              {message.workflow && (
                <button onClick={() => setShowWorkflow(!showWorkflow)} style={{
                  background: showWorkflow ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${showWorkflow ? 'rgba(99,102,241,0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font-mono)',
                  color: showWorkflow ? '#6366f1' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.15s',
                }}>
                  <Zap size={8} />13-step trace
                </button>
              )}
              {/* Moderation badge */}
              {message.moderation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {message.moderation.passed ? (
                    <CheckCircle size={9} color="#34d399" />
                  ) : (
                    <ShieldX size={9} color="#f43f5e" />
                  )}
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    Moderation: {message.moderation.risk_level}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sources */}
        <AnimatePresence>
          {showSources && message.sources && message.sources.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 6, overflow: 'hidden' }}>
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px', background: 'var(--bg-card)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Retrieved Sources ({message.sources.length})
                </div>
                <SourceCitationPanel sources={message.sources} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workflow */}
        <AnimatePresence>
          {showWorkflow && message.workflow && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 6, overflow: 'hidden' }}>
              <RAGWorkflowVisualizer workflow={message.workflow} compact={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Main ChatInterface ───────────────────────────────────────────────────────
export default function ChatInterface() {
  const [query, setQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    conversations, activeConversationId, createConversation, setActiveConversation,
    addChatResponse, isLoading, setLoading, selectedModel, setModel, useRag, toggleRag,
    addMessage, updateLastMessage, currentRole,
  } = useChatStore()

  const activeConversation = conversations.find((c) => c.id === activeConversationId)
  const roleConfig = ROLE_CONFIGS[currentRole]

  const sendMutation = useMutation({
    mutationFn: chatApi.send,
    onSuccess: (response) => {
      if (activeConversationId) {
        updateLastMessage(activeConversationId, {
          content: response.response,
          sources: response.sources,
          workflow: response.workflow,
          confidence_score: response.confidence_score,
          model_used: response.model_used,
          response_time_ms: response.response_time_ms,
          use_rag: response.use_rag,
          isStreaming: false,
          permission_blocked: response.permission_blocked,
          blocked_reason: response.blocked_reason,
          moderation: response.moderation,
        })
        // Also update audit log via addChatResponse
        if (activeConversationId) {
          const userQuery = conversations.find(c => c.id === activeConversationId)?.messages.slice(-2)[0]?.content || ''
          useChatStore.getState().addChatResponse('__audit__', userQuery, response)
        }
      }
      setLoading(false)
    },
    onError: () => {
      if (activeConversationId) {
        updateLastMessage(activeConversationId, {
          content: '⚠️ Backend not connected. Start the backend server:\n\n```\ncd backend\nuvicorn app.main:app --reload --port 8000\n```\n\nThe frontend UI still works for demonstration purposes.',
          isStreaming: false,
        })
      }
      setLoading(false)
    },
  })

  const handleSend = async () => {
    if (!query.trim() || isLoading) return
    let convId = activeConversationId
    if (!convId) {
      convId = createConversation()
      setActiveConversation(convId)
    }
    const userQuery = query.trim()
    setQuery('')
    setLoading(true)

    addMessage(convId, { id: uuidv4(), role: 'user', content: userQuery, timestamp: new Date().toISOString(), user_role: currentRole })
    addMessage(convId, { id: uuidv4(), role: 'assistant', content: '', timestamp: new Date().toISOString(), isStreaming: true })

    sendMutation.mutate({ query: userQuery, conversation_id: convId, model: selectedModel, use_rag: useRag, user_role: currentRole })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])

  const messages = activeConversation?.messages || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', flexShrink: 0, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }}>
            <Cpu size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Enterprise AI Copilot</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {roleConfig.icon} {roleConfig.label} · L{roleConfig.clearanceLevel} Clearance · {messages.length} messages
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Role Selector */}
          <RoleSelector />

          {/* Model selector */}
          <div style={{ position: 'relative' }}>
            <select value={selectedModel} onChange={(e) => setModel(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', padding: '5px 24px 5px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer', outline: 'none', appearance: 'none' }}>
              {AVAILABLE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={11} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>

          {/* RAG toggle */}
          <button onClick={toggleRag} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
            borderRadius: 6, border: `1px solid ${useRag ? 'rgba(34,211,238,0.3)' : 'var(--border-subtle)'}`,
            background: useRag ? 'rgba(34,211,238,0.08)' : 'var(--bg-card)',
            color: useRag ? '#22d3ee' : 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
          }}>
            {useRag ? <Zap size={12} /> : <ZapOff size={12} />}
            <span>{useRag ? 'RAG' : 'Direct'}</span>
          </button>
        </div>
      </div>

      {/* Permission context bar */}
      <div style={{
        padding: '5px 20px',
        background: `${roleConfig.color}08`,
        borderBottom: `1px solid ${roleConfig.color}20`,
        display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0,
      }}>
        <Lock size={10} color={roleConfig.color} />
        <span style={{ fontSize: 10, color: roleConfig.color }}>
          <strong>{roleConfig.label} clearance:</strong> {roleConfig.allowedAccessLevels.join(' → ')} documents
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {roleConfig.description}
        </span>
      </div>

      {/* Warning if no RAG */}
      <AnimatePresence>
        {!useRag && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ background: 'rgba(251,146,60,0.07)', borderBottom: '1px solid rgba(251,146,60,0.2)', padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={12} color="#fb923c" />
            <span style={{ fontSize: 11, color: '#fb923c' }}>RAG disabled — responses not grounded in enterprise docs. Hallucination risk HIGH.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: 660, margin: '0 auto', paddingTop: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.2))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 40px rgba(99,102,241,0.12)' }}>
                <Cpu size={36} color="#6366f1" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                Enterprise AI <span className="gradient-text">Copilot</span>
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
                You are signed in as <strong style={{ color: roleConfig.color }}>{roleConfig.icon} {roleConfig.label}</strong>. Retrieval is filtered to your clearance level.
              </p>
              {/* Security explainer */}
              <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, maxWidth: 480, margin: '16px auto 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <ShieldCheck size={13} color="#6366f1" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>Permission-Aware Retrieval Active</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'left' }}>
                  The AI cannot access documents above your clearance level. Restricted docs are filtered <strong>before</strong> the LLM receives any context — the LLM itself never decides permissions.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SUGGESTED_QUERIES.map((sq, i) => {
                const isRestricted = sq.toLowerCase().includes('compensation') || sq.toLowerCase().includes('executive')
                const willBeBlocked = isRestricted && !['executive', 'cto'].includes(currentRole)
                return (
                  <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setQuery(sq); textareaRef.current?.focus() }}
                    style={{
                      background: willBeBlocked ? 'rgba(244,63,94,0.05)' : 'var(--bg-card)',
                      border: `1px solid ${willBeBlocked ? 'rgba(244,63,94,0.2)' : 'var(--border-subtle)'}`,
                      borderRadius: 10, padding: '11px 13px', cursor: 'pointer', textAlign: 'left',
                      color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.4, transition: 'all 0.15s',
                      position: 'relative',
                    }}>
                    {willBeBlocked && (
                      <div style={{ position: 'absolute', top: 6, right: 6 }}>
                        <Lock size={9} color="#f43f5e" />
                      </div>
                    )}
                    {sq}
                    {willBeBlocked && (
                      <div style={{ fontSize: 9, color: '#f43f5e', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        Will be blocked for {roleConfig.label}
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
            {isLoading && messages[messages.length - 1]?.isStreaming && messages[messages.length - 1]?.content === '' && <ThinkingAnimation />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: `1px solid ${isLoading ? 'rgba(99,102,241,0.4)' : 'var(--border-subtle)'}`,
            borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-end', gap: 10, transition: 'border-color 0.2s',
          }}>
            <textarea ref={textareaRef} value={query} onChange={handleInputChange} onKeyDown={handleKeyDown}
              placeholder={`Ask as ${roleConfig.label}... (${roleConfig.allowedAccessLevels.join(', ')} access)`}
              rows={1} disabled={isLoading}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)', resize: 'none', lineHeight: 1.5, maxHeight: 160, overflowY: 'auto' }}
            />
            <button id="send-message-btn" onClick={handleSend} disabled={!query.trim() || isLoading} style={{
              width: 36, height: 36, borderRadius: 9,
              background: query.trim() && !isLoading ? 'linear-gradient(135deg, #6366f1, #22d3ee)' : 'rgba(255,255,255,0.05)',
              border: 'none', cursor: query.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: query.trim() && !isLoading ? 'white' : 'var(--text-muted)', transition: 'all 0.15s', flexShrink: 0,
              boxShadow: query.trim() && !isLoading ? '0 0 14px rgba(99,102,241,0.4)' : 'none',
            }}>
              {isLoading ? <LoadingSpinner size={14} color="#6366f1" /> : <Send size={14} />}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 2px' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              ↵ Send · {roleConfig.icon} {roleConfig.label} · <span style={{ color: useRag ? '#22d3ee' : '#fb923c' }}>{useRag ? '⚡ RAG grounded' : '⚠ Direct LLM'}</span>
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{query.length}/4096</span>
          </div>
        </div>
      </div>
    </div>
  )
}
