// Enterprise AI Copilot — Phase 2 Extended TypeScript Type Definitions

// ─── Document & Knowledge Base ───────────────────────────────────────────────

export type DocumentCategory =
  | 'hr_policy' | 'engineering' | 'security' | 'onboarding'
  | 'api_docs' | 'runbook' | 'incident' | 'architecture' | 'support' | 'deployment'

export type AccessLevel = 'public' | 'internal' | 'confidential' | 'restricted'
export type ConfidenceLabel = 'high' | 'medium' | 'low'

// ─── Role-Based Access Control ────────────────────────────────────────────────

export type UserRole = 'intern' | 'developer' | 'hr_manager' | 'team_lead' | 'executive' | 'cto'

export interface RoleConfig {
  id: UserRole
  label: string
  department: string
  clearanceLevel: number  // 1-6, higher = more access
  allowedAccessLevels: AccessLevel[]
  allowedCategories: DocumentCategory[]
  color: string
  icon: string
  description: string
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  intern: {
    id: 'intern', label: 'Intern', department: 'Engineering',
    clearanceLevel: 1, color: '#94a3b8', icon: '🎓',
    allowedAccessLevels: ['public'],
    allowedCategories: ['onboarding', 'api_docs'],
    description: 'Limited to public onboarding and API docs only',
  },
  developer: {
    id: 'developer', label: 'Developer', department: 'Engineering',
    clearanceLevel: 2, color: '#22d3ee', icon: '💻',
    allowedAccessLevels: ['public', 'internal'],
    allowedCategories: ['engineering', 'api_docs', 'runbook', 'deployment', 'incident', 'architecture', 'onboarding'],
    description: 'Access to all engineering and technical documentation',
  },
  hr_manager: {
    id: 'hr_manager', label: 'HR Manager', department: 'Human Resources',
    clearanceLevel: 3, color: '#a78bfa', icon: '👥',
    allowedAccessLevels: ['public', 'internal', 'confidential'],
    allowedCategories: ['hr_policy', 'onboarding', 'support'],
    description: 'Access to all HR documentation including confidential policies',
  },
  team_lead: {
    id: 'team_lead', label: 'Team Lead', department: 'Engineering',
    clearanceLevel: 3, color: '#34d399', icon: '🎯',
    allowedAccessLevels: ['public', 'internal', 'confidential'],
    allowedCategories: ['engineering', 'api_docs', 'runbook', 'deployment', 'incident', 'architecture', 'onboarding', 'hr_policy', 'security'],
    description: 'Full engineering and confidential access',
  },
  executive: {
    id: 'executive', label: 'Executive', department: 'Leadership',
    clearanceLevel: 5, color: '#fb923c', icon: '📊',
    allowedAccessLevels: ['public', 'internal', 'confidential', 'restricted'],
    allowedCategories: ['engineering', 'api_docs', 'runbook', 'deployment', 'incident', 'architecture', 'onboarding', 'hr_policy', 'security', 'support'],
    description: 'Broad access including restricted strategic documents',
  },
  cto: {
    id: 'cto', label: 'CTO', department: 'Executive',
    clearanceLevel: 6, color: '#6366f1', icon: '⚡',
    allowedAccessLevels: ['public', 'internal', 'confidential', 'restricted'],
    allowedCategories: ['engineering', 'api_docs', 'runbook', 'deployment', 'incident', 'architecture', 'onboarding', 'hr_policy', 'security', 'support'],
    description: 'Full unrestricted access to all enterprise knowledge',
  },
}

// ─── Document & Knowledge Base ────────────────────────────────────────────────

export interface DocumentMetadata {
  document_id: string
  title: string
  category: DocumentCategory
  source_file: string
  department: string
  access_level: AccessLevel
  chunk_index: number
  total_chunks: number
  created_at: string
}

export interface DocumentChunk {
  id: string
  content: string
  metadata: DocumentMetadata
  score?: number
}

export interface KnowledgeDocument {
  document_id: string
  title: string
  category: string
  department: string
  chunks: number
  ingested_at: string
  access_level?: AccessLevel
  last_updated?: string
  health_score?: number  // 0-100 doc quality score
}

// ─── RAG Pipeline ─────────────────────────────────────────────────────────────

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'blocked'

export interface WorkflowStep {
  step_id: string
  name: string
  description: string
  status: WorkflowStatus
  duration_ms?: number
  metadata?: Record<string, unknown>
  layer?: string
  color?: string
}

export interface RAGWorkflow {
  query_id: string
  steps: WorkflowStep[]
  total_duration_ms: number
  retrieval_count: number
  model_used: string
  permission_check?: {
    user_role: UserRole
    allowed_levels: AccessLevel[]
    documents_filtered: number
    documents_blocked: number
  }
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  sources?: SourceCitation[]
  workflow?: RAGWorkflow
  confidence_score?: number
  model_used?: string
  response_time_ms?: number
  use_rag?: boolean
  isStreaming?: boolean
  user_role?: UserRole
  permission_blocked?: boolean
  blocked_reason?: string
  moderation?: ModerationResult
}

export interface ModerationResult {
  passed: boolean
  risk_level: 'safe' | 'caution' | 'blocked'
  flags: string[]
  source_grounded: boolean
}

export interface ChatRequest {
  query: string
  conversation_id?: string
  model?: string
  use_rag?: boolean
  stream?: boolean
  access_level?: string
  top_k?: number
  user_role?: UserRole
}

export interface SourceCitation {
  chunk_id: string
  document_title: string
  document_category: string
  content_preview: string
  full_content: string
  similarity_score: number
  confidence_label: ConfidenceLabel
  source_file: string
  department: string
  access_level: string
  chunk_index: number
}

export interface ChatResponse {
  query_id: string
  conversation_id: string
  query: string
  response: string
  model_used: string
  use_rag: boolean
  sources: SourceCitation[]
  workflow?: RAGWorkflow
  confidence_score: number
  response_time_ms: number
  tokens_used?: number
  timestamp: string
  hallucination_guarded: boolean
  permission_blocked?: boolean
  blocked_reason?: string
  moderation?: ModerationResult
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  created_at: string
  last_message?: string
  model_used: string
}

// ─── Governance & Audit ───────────────────────────────────────────────────────

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical'

export interface AuditEntry {
  id: string
  timestamp: string
  user_role: UserRole
  user_label: string
  query: string
  query_preview: string
  documents_retrieved: number
  documents_blocked: number
  permission_level: AccessLevel
  risk_level: RiskLevel
  response_time_ms: number
  model_used: string
  use_rag: boolean
  permission_violation: boolean
}

export interface GovernanceMetrics {
  total_queries: number
  queries_today: number
  permission_violations: number
  high_risk_queries: number
  compliance_score: number
  avg_confidence: number
  top_queried_categories: Array<{ category: string; count: number }>
  risk_distribution: Record<RiskLevel, number>
}

// ─── Ingestion Pipeline ───────────────────────────────────────────────────────

export type IngestionSource = 'confluence' | 'jira' | 'github' | 'hr_system' | 'manual' | 'sharepoint' | 'notion'
export type IngestionStatus = 'idle' | 'running' | 'completed' | 'failed'

export interface IngestionEvent {
  id: string
  timestamp: string
  source: IngestionSource
  document_title: string
  document_id: string
  event_type: 'created' | 'updated' | 'deleted'
  chunks_processed: number
  embeddings_generated: number
  duration_ms: number
  status: IngestionStatus
  incremental: boolean  // true = only changed chunks re-embedded
}

export interface IngestionPipelineStatus {
  status: IngestionStatus
  last_sync: string
  documents_indexed: number
  pending_updates: number
  sources: Array<{
    name: IngestionSource
    label: string
    status: IngestionStatus
    last_synced: string
    document_count: number
    sync_interval: string
  }>
  recent_events: IngestionEvent[]
}

// ─── Knowledge Health ─────────────────────────────────────────────────────────

export interface KnowledgeHealthMetric {
  area: string
  score: number  // 0-100
  document_count: number
  avg_age_days: number
  has_gaps: boolean
  gap_description?: string
  last_updated: string
}

export interface KnowledgeHealthReport {
  overall_score: number
  total_documents: number
  outdated_count: number
  missing_areas: string[]
  coverage_metrics: KnowledgeHealthMetric[]
  low_confidence_queries: Array<{ query: string; confidence: number }>
}

// ─── Enterprise Integrations ──────────────────────────────────────────────────

export type IntegrationStatus = 'connected' | 'disconnected' | 'degraded'

export interface Integration {
  id: string
  name: string
  type: 'communication' | 'devtools' | 'hr' | 'docs' | 'portal'
  status: IntegrationStatus
  last_event: string
  requests_today: number
  icon: string
  description: string
  color: string
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

export interface EmbeddingPoint {
  text: string
  embedding_preview: number[]
  x: number
  y: number
  cluster: number
  label: string
}

export interface EmbeddingResponse {
  points: EmbeddingPoint[]
  model: string
  dimensions: number
  projection_method: string
}

// ─── Health & System ──────────────────────────────────────────────────────────

export type ServiceStatusType = 'online' | 'offline' | 'degraded'

export interface ServiceStatus {
  name: string
  status: ServiceStatusType
  latency_ms?: number
  details?: Record<string, unknown>
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  environment: string
  services: ServiceStatus[]
  document_count: number
  collection_name: string
  timestamp: string
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export interface RetrievalRequest {
  query: string
  top_k?: number
  category_filter?: string
  access_level?: string
  similarity_threshold?: number
  user_role?: UserRole
}

export interface RetrievalResponse {
  query: string
  query_embedding_preview: number[]
  retrieved_chunks: DocumentChunk[]
  retrieval_time_ms: number
  collection_stats: Record<string, unknown>
}

// ─── Workflow Definition ──────────────────────────────────────────────────────

export interface WorkflowStepDefinition {
  step_id: string
  name: string
  description: string
  layer: string
  color: string
  icon: string
}

export interface WorkflowDefinition {
  name: string
  version: string
  description: string
  steps: WorkflowStepDefinition[]
  config: Record<string, unknown>
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export type Page = 
  | 'chat' | 'dashboard' | 'knowledge' | 'embeddings' | 'architecture'
  | 'integration' | 'governance' | 'ingestion' | 'security' | 'health' | 'learn'
