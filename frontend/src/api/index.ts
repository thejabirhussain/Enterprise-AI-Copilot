// All API call functions
import apiClient from './client'
import type {
  ChatRequest, ChatResponse, HealthResponse,
  EmbeddingResponse, RetrievalRequest, RetrievalResponse,
  WorkflowDefinition, KnowledgeDocument
} from '@/types'

// ─── Chat API ─────────────────────────────────────────────────────────────────
export const chatApi = {
  send: async (request: ChatRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/chat', request)
    return data
  },
}

// ─── Health API ───────────────────────────────────────────────────────────────
export const healthApi = {
  check: async (): Promise<HealthResponse> => {
    const { data } = await apiClient.get<HealthResponse>('/health')
    return data
  },
}

// ─── Embeddings API ───────────────────────────────────────────────────────────
export const embeddingsApi = {
  generate: async (texts: string[]): Promise<EmbeddingResponse> => {
    const { data } = await apiClient.post<EmbeddingResponse>('/embeddings', { texts })
    return data
  },
  getModelInfo: async () => {
    const { data } = await apiClient.get('/embeddings/model-info')
    return data
  },
}

// ─── Retrieval API ────────────────────────────────────────────────────────────
export const retrievalApi = {
  search: async (request: RetrievalRequest): Promise<RetrievalResponse> => {
    const { data } = await apiClient.post<RetrievalResponse>('/retrieval', request)
    return data
  },
}

// ─── Documents API ────────────────────────────────────────────────────────────
export const documentsApi = {
  list: async (): Promise<{ documents: KnowledgeDocument[] }> => {
    const { data } = await apiClient.get('/documents')
    return data
  },
  stats: async () => {
    const { data } = await apiClient.get('/documents/stats')
    return data
  },
  upload: async (doc: { title: string; content: string; category: string; department: string }) => {
    const { data } = await apiClient.post('/documents', doc)
    return data
  },
}

// ─── Workflow API ─────────────────────────────────────────────────────────────
export const workflowApi = {
  getDefinition: async (): Promise<WorkflowDefinition> => {
    const { data } = await apiClient.get<WorkflowDefinition>('/workflow')
    return data
  },
}

// ─── Sources API ──────────────────────────────────────────────────────────────
export const sourcesApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/sources')
    return data
  },
  getCategories: async () => {
    const { data } = await apiClient.get('/sources/categories')
    return data
  },
}
