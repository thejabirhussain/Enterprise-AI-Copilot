// Zustand Chat Store — Phase 2 with role-based access
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message, Conversation, ChatResponse, UserRole, AuditEntry, RiskLevel } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// ─── Simulate audit entry from chat response ───────────────────────────────────
function buildAuditEntry(query: string, role: UserRole, response: ChatResponse): AuditEntry {
  const riskLevel: RiskLevel = 
    response.permission_blocked ? 'high' :
    response.confidence_score < 0.3 ? 'medium' :
    query.toLowerCase().includes('salary') || query.toLowerCase().includes('compensation') ? 'high' :
    query.toLowerCase().includes('confidential') || query.toLowerCase().includes('secret') ? 'medium' :
    'safe'

  const roleLabels: Record<UserRole, string> = {
    intern: 'Intern', developer: 'Developer', hr_manager: 'HR Manager',
    team_lead: 'Team Lead', executive: 'Executive', cto: 'CTO',
  }

  return {
    id: response.query_id,
    timestamp: response.timestamp,
    user_role: role,
    user_label: roleLabels[role],
    query,
    query_preview: query.slice(0, 80) + (query.length > 80 ? '...' : ''),
    documents_retrieved: response.sources?.length || 0,
    documents_blocked: response.permission_blocked ? 3 : 0,
    permission_level: role === 'intern' ? 'public' : role === 'developer' ? 'internal' : 'confidential',
    risk_level: riskLevel,
    response_time_ms: response.response_time_ms,
    model_used: response.model_used,
    use_rag: response.use_rag,
    permission_violation: response.permission_blocked || false,
  }
}

interface ChatStore {
  conversations: Conversation[]
  activeConversationId: string | null
  isLoading: boolean
  selectedModel: string
  useRag: boolean
  currentRole: UserRole
  auditLog: AuditEntry[]

  // Actions
  createConversation: () => string
  setActiveConversation: (id: string) => void
  addMessage: (conversationId: string, message: Message) => void
  updateLastMessage: (conversationId: string, updates: Partial<Message>) => void
  setLoading: (loading: boolean) => void
  setModel: (model: string) => void
  toggleRag: () => void
  setRole: (role: UserRole) => void
  deleteConversation: (id: string) => void
  clearAll: () => void
  getActiveConversation: () => Conversation | null
  addChatResponse: (conversationId: string, userQuery: string, response: ChatResponse) => void
  clearAuditLog: () => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isLoading: false,
      selectedModel: 'llama3.2',
      useRag: true,
      currentRole: 'developer',
      auditLog: [],

      createConversation: () => {
        const id = uuidv4()
        const conversation: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          created_at: new Date().toISOString(),
          model_used: get().selectedModel,
        }
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }))
        return id
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv
            const updated = { ...conv, messages: [...conv.messages, message] }
            if (message.role === 'user' && conv.messages.length === 0) {
              updated.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
            }
            updated.last_message = message.content.slice(0, 80)
            return updated
          }),
        }))
      },

      updateLastMessage: (conversationId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv
            const messages = [...conv.messages]
            if (messages.length === 0) return conv
            messages[messages.length - 1] = { ...messages[messages.length - 1], ...updates }
            return { ...conv, messages }
          }),
        }))
      },

      addChatResponse: (conversationId, userQuery, response) => {
        const { addMessage, auditLog, currentRole } = get()

        // Add user message
        addMessage(conversationId, {
          id: uuidv4(),
          role: 'user',
          content: userQuery,
          timestamp: new Date().toISOString(),
          user_role: currentRole,
        })

        // Add assistant response
        addMessage(conversationId, {
          id: response.query_id,
          role: 'assistant',
          content: response.response,
          timestamp: response.timestamp,
          sources: response.sources,
          workflow: response.workflow,
          confidence_score: response.confidence_score,
          model_used: response.model_used,
          response_time_ms: response.response_time_ms,
          use_rag: response.use_rag,
          user_role: currentRole,
          permission_blocked: response.permission_blocked,
          blocked_reason: response.blocked_reason,
          moderation: response.moderation,
        })

        // Append to audit log (cap at 100 entries)
        const entry = buildAuditEntry(userQuery, currentRole, response)
        const newLog = [entry, ...auditLog].slice(0, 100)
        set({ auditLog: newLog })
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setModel: (model) => set({ selectedModel: model }),
      toggleRag: () => set((state) => ({ useRag: !state.useRag })),
      setRole: (role) => set({ currentRole: role }),
      deleteConversation: (id) => set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
      })),
      clearAll: () => set({ conversations: [], activeConversationId: null }),
      clearAuditLog: () => set({ auditLog: [] }),
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get()
        return conversations.find((c) => c.id === activeConversationId) || null
      },
    }),
    {
      name: 'enterprise-chat-store-v2',
      partialize: (state) => ({
        conversations: state.conversations.slice(0, 20),
        selectedModel: state.selectedModel,
        useRag: state.useRag,
        currentRole: state.currentRole,
        auditLog: state.auditLog.slice(0, 50),
      }),
    }
  )
)
