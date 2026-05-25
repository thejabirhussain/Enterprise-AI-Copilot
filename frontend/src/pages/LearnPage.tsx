import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ChevronRight, ChevronLeft, CheckCircle, BookOpen, Zap, Shield, Database, RefreshCw, BarChart2, Cpu } from 'lucide-react'
import { GlassCard, Badge } from '@/components/ui'
import { useUIStore } from '@/stores/uiStore'

interface Lesson {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  duration: string
  summary: string
  slides: Array<{
    heading: string
    body?: string
    visual?: React.ReactNode
    code?: string
  }>
}

const LESSONS: Lesson[] = [
  {
    id: 'embeddings',
    title: 'What Are Embeddings?',
    icon: <Database size={18} />,
    color: '#22d3ee',
    duration: '4 min',
    summary: 'How text becomes numbers that machines understand',
    slides: [
      {
        heading: 'Text → Numbers',
        body: 'An embedding is a dense numerical vector that represents the meaning of text. Similar meanings = similar vectors. This is how computers understand semantics.',
        visual: (
          <div style={{ padding: '12px' }}>
            {[
              { text: '"How do I deploy to Kubernetes?"', vec: [0.23, -0.71, 0.44, 0.18, -0.92] },
              { text: '"Kubernetes deployment guide"', vec: [0.21, -0.68, 0.47, 0.19, -0.89] },
              { text: '"Our office pet policy"', vec: [-0.81, 0.22, -0.15, 0.77, 0.31] },
            ].map(({ text, vec }, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{text}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {vec.map((v, j) => (
                    <div key={j} style={{ flex: 1, height: 28, background: `rgba(34,211,238,${Math.abs(v) * 0.6})`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', fontFamily: 'monospace' }}>
                      {v.toFixed(2)}
                    </div>
                  ))}
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace' }}>...384</span>
                </div>
              </div>
            ))}
            <div style={{ padding: '8px 10px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 6, fontSize: 10, color: '#22d3ee', marginTop: 4 }}>
              ✓ Q1 and Q2 are semantically close → high cosine similarity (0.97)<br />
              ✗ Q3 is semantically far → low cosine similarity (0.12)
            </div>
          </div>
        ),
      },
      {
        heading: 'Dimensions: 384 Numbers Per Text',
        body: 'We use BAAI/bge-small-en-v1.5 — a 33M parameter model that converts any text into 384 floating-point numbers. These 384 numbers capture meaning, context, and relationships.',
        code: `from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")

text = "How do I deploy to production?"
embedding = model.encode(text)

print(embedding.shape)  # (384,)
print(embedding[:5])    # [ 0.23, -0.71, 0.44, 0.18, -0.92 ]`,
      },
      {
        heading: 'Why Not Just Use Keywords?',
        body: '"Kubernetes deployment" and "how to ship to prod" mean the same thing but share zero keywords. Embeddings capture semantic meaning — keywords only match literals. This is the superpower of vector search.',
      },
    ],
  },
  {
    id: 'vector_search',
    title: 'Vector Similarity Search',
    icon: <Zap size={18} />,
    color: '#6366f1',
    duration: '5 min',
    summary: 'Finding semantically similar documents at scale',
    slides: [
      {
        heading: 'Cosine Similarity',
        body: 'Two embeddings are compared using cosine similarity — how close the angles between the vectors are. 1.0 = identical meaning. 0.0 = unrelated. -1.0 = opposite meaning.',
        visual: (
          <div style={{ padding: '12px' }}>
            {[
              { a: 'Deploy to Kubernetes', b: 'Kubernetes deployment guide', sim: 0.97, color: '#34d399' },
              { a: 'Deploy to Kubernetes', b: 'Container orchestration tutorial', sim: 0.81, color: '#22d3ee' },
              { a: 'Deploy to Kubernetes', b: 'HR leave policy', sim: 0.08, color: '#f43f5e' },
            ].map(({ a, b, sim, color }) => (
              <div key={a + b} style={{ marginBottom: 8, padding: '8px 10px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>"{a}" ↔ "{b}"</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <div style={{ width: `${sim * 100}%`, height: '100%', background: color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace' }}>{sim.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        heading: 'Qdrant: ANN Search at Scale',
        body: 'Exact nearest-neighbor search over millions of vectors is O(n) — too slow. Qdrant uses HNSW (Hierarchical Navigable Small World) graphs for approximate nearest-neighbor search at < 5ms even with millions of vectors.',
        code: `# Qdrant vector search with metadata filtering
results = qdrant.search(
    collection_name="enterprise_knowledge",
    query_vector=query_embedding,          # 384-dim vector
    query_filter=Filter(must=[
        FieldCondition(
            key="access_level",
            match=MatchAny(any=["public", "internal"])
        )
    ]),
    limit=5,                               # Top-5 most similar
    with_payload=True,                     # Include metadata
)

# results = [{score: 0.94, payload: {title: "...", content: "..."}}, ...]`,
      },
    ],
  },
  {
    id: 'rag',
    title: 'Retrieval-Augmented Generation',
    icon: <BookOpen size={18} />,
    color: '#8b5cf6',
    duration: '6 min',
    summary: 'Why RAG beats fine-tuning for enterprise AI',
    slides: [
      {
        heading: 'The Problem With Vanilla LLMs',
        body: 'LLMs are trained on internet data. They have no knowledge of your company\'s internal systems, policies, runbooks, or architecture. Without RAG, the AI will hallucinate — confidently making up answers that sound real.',
      },
      {
        heading: 'RAG: Ground Responses in Real Data',
        body: 'RAG retrieves relevant documents before asking the LLM to answer. The LLM generates a response based only on the retrieved context — it cannot hallucinate information it was never given.',
        code: `# RAG pipeline (simplified)
query = "How do I request PTO?"

# Step 1: Embed the query
query_embedding = embed(query)  # [0.23, -0.71, ...]

# Step 2: Search knowledge base
docs = qdrant.search(query_embedding, limit=5)

# Step 3: Build grounded prompt
context = "\\n\\n".join([doc.content for doc in docs])
prompt = f"""You are an enterprise AI assistant.
Answer ONLY based on the context below.
If the answer is not in the context, say "I don't know."

Context: {context}

Question: {query}"""

# Step 4: Generate grounded response
response = llm.generate(prompt)`,
      },
      {
        heading: 'RAG vs Fine-Tuning',
        visual: (
          <div style={{ padding: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Fine-Tuning', pros: ['Faster at inference', 'Implicit knowledge'], cons: ['$50K-200K per run', 'Stale after training', 'No audit trail', 'Data in model weights', 'Can\'t erase'], color: '#fb923c' },
                { label: 'RAG (This System)', pros: ['Real-time knowledge', 'Citeable sources', 'Audit every retrieval', 'Data stays in DB', 'GDPR: right to erase', '$0 re-training'], cons: ['Retrieval latency +200ms', 'Quality depends on docs'], color: '#34d399' },
              ].map(({ label, pros, cons, color }) => (
                <div key={label} style={{ padding: '10px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>{label}</div>
                  {pros.map(p => <div key={p} style={{ fontSize: 10, color: '#34d399', display: 'flex', gap: 4, marginBottom: 2 }}><span>✓</span>{p}</div>)}
                  {cons.map(c => <div key={c} style={{ fontSize: 10, color: '#f43f5e', display: 'flex', gap: 4, marginBottom: 2 }}><span>✗</span>{c}</div>)}
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'permissions',
    title: 'Permission-Aware Retrieval',
    icon: <Shield size={18} />,
    color: '#f43f5e',
    duration: '5 min',
    summary: 'How enterprise AI enforces access control',
    slides: [
      {
        heading: 'The Critical Security Principle',
        body: 'In enterprise AI, the LLM is NOT a security boundary. The LLM cannot be trusted to keep secrets — it was trained to be helpful. Security MUST happen at the retrieval layer, before the LLM receives any context.',
        visual: (
          <div style={{ padding: '10px' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 6, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f43f5e' }}>❌ WRONG APPROACH</div>
              <div style={{ fontSize: 10, color: 'rgba(244,63,94,0.8)' }}>Retrieve all docs → Send to LLM → Ask LLM to hide restricted content</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>The LLM has seen the restricted content. It may leak it.</div>
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>✅ CORRECT APPROACH</div>
              <div style={{ fontSize: 10, color: 'rgba(52,211,153,0.8)' }}>Apply permission filter in Qdrant → LLM only receives permitted content</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>The LLM never sees restricted data. Zero information leakage possible.</div>
            </div>
          </div>
        ),
      },
      {
        heading: 'Metadata Filtering in Qdrant',
        body: 'Every document in Qdrant has metadata: access_level, department, roles. The search filter is applied BEFORE results are returned — restricted documents are never even loaded into memory for the query.',
        code: `# Role-based access control at search time
def secure_search(query: str, user_role: str):
    role_permissions = {
        "intern": ["public"],
        "developer": ["public", "internal"],
        "hr_manager": ["public", "internal", "confidential"],
        "executive": ["public", "internal", "confidential", "restricted"],
    }
    
    allowed = role_permissions.get(user_role, ["public"])
    
    # Filter applied BEFORE search — not after
    filter = Filter(must=[
        FieldCondition(
            key="access_level",
            match=MatchAny(any=allowed)
        )
    ])
    
    return qdrant.search(
        query_vector=embed(query),
        query_filter=filter,  # ← Security enforced here
        limit=5
    )`,
      },
    ],
  },
  {
    id: 'governance',
    title: 'AI Governance & Auditability',
    icon: <BarChart2 size={18} />,
    color: '#fb923c',
    duration: '4 min',
    summary: 'Why enterprise AI requires full transparency',
    slides: [
      {
        heading: 'Every Query Must Be Auditable',
        body: 'Enterprise AI operates in regulated environments. Every query, retrieval, and permission decision must be logged. Not as a nice-to-have — as a legal and compliance requirement (GDPR, SOC 2, EU AI Act).',
      },
      {
        heading: 'What Gets Logged',
        code: `# Audit log entry (created automatically for every query)
{
  "timestamp": "2025-05-25T14:32:11Z",
  "query_id": "qry_01h9xyz123",
  "user_id": "emp_8472",
  "user_role": "developer",
  "department": "Engineering",
  "query": "How do I deploy to production?",
  "documents_retrieved": [
    "doc_001 (deployment_runbook.md, internal)",
    "doc_012 (kubernetes_guide.md, internal)"
  ],
  "documents_blocked": [],           # Empty = no violations
  "permission_checks": ["internal ✓"],
  "model_used": "llama3.2",
  "confidence_score": 0.87,
  "response_time_ms": 1243,
  "hallucination_guard": true,       # Response grounded in sources
  "risk_level": "safe"
}`,
      },
    ],
  },
  {
    id: 'ingestion',
    title: 'Continuous Knowledge Ingestion',
    icon: <RefreshCw size={18} />,
    color: '#34d399',
    duration: '4 min',
    summary: 'How enterprise knowledge stays current',
    slides: [
      {
        heading: 'Knowledge Becomes Stale Instantly',
        body: 'Enterprise knowledge changes daily. An API reference updated in Confluence, a new HR policy in Workday, a post-mortem in Jira. Without continuous ingestion, your AI operates on outdated information.',
      },
      {
        heading: 'Incremental Ingestion (The Right Way)',
        body: 'Full re-indexing 10,000 documents = 45 minutes and $$$. Incremental ingestion detects which specific chunks changed and only re-embeds those. A single page update = 3 chunks re-embedded in < 2 seconds.',
        code: `# Webhook receiver — triggered by Confluence on every page save
@app.post("/webhooks/confluence")
async def confluence_webhook(event: ConfluenceEvent):
    if event.type == "page_updated":
        # Fetch only the changed page
        content = confluence_client.get_page(event.page_id)
        
        # Chunk the document
        chunks = text_splitter.split(content)
        
        # Find chunks that actually changed (hash comparison)
        changed_chunks = [c for c in chunks
                         if hash(c) != get_stored_hash(event.page_id, c.index)]
        
        # Re-embed only changed chunks (not the whole document)
        for chunk in changed_chunks:
            embedding = embed(chunk.text)
            qdrant.upsert(
                collection="enterprise_knowledge",
                points=[PointStruct(
                    id=chunk.id,
                    vector=embedding,
                    payload={"content": chunk.text, "page_id": event.page_id}
                )]
            )
        
        return {"chunks_updated": len(changed_chunks)}  # Often just 1-3`,
      },
    ],
  },
]

export default function LearnPage() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const { setLearnModule } = useUIStore()

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setSlideIndex(0)
    setLearnModule(LESSONS.findIndex(l => l.id === lesson.id))
  }

  const nextSlide = () => {
    if (!selectedLesson) return
    if (slideIndex < selectedLesson.slides.length - 1) {
      setSlideIndex(slideIndex + 1)
    } else {
      setCompleted(prev => new Set([...prev, selectedLesson.id]))
      setSelectedLesson(null)
    }
  }

  const prevSlide = () => { if (slideIndex > 0) setSlideIndex(slideIndex - 1) }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <GraduationCap size={24} color="#a78bfa" />
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Learn Mode</h1>
            <Badge variant="purple">Educational</Badge>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 680 }}>
            Interactive lessons explaining the core concepts behind enterprise AI architecture. Learn how every layer works — not just "AI answers questions."
          </p>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={12} color="#34d399" />
            {completed.size}/{LESSONS.length} lessons completed
          </div>
        </motion.div>

        {/* Lesson grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {LESSONS.map((lesson, i) => (
            <motion.div key={lesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <GlassCard hover onClick={() => openLesson(lesson)} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: `${lesson.color}18`,
                    border: `1px solid ${lesson.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: lesson.color, flexShrink: 0,
                  }}>
                    {lesson.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{lesson.title}</span>
                      {completed.has(lesson.id) && <CheckCircle size={11} color="#34d399" />}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 8 }}>{lesson.summary}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {lesson.slides.length} slides · {lesson.duration}
                      </span>
                      <span style={{ fontSize: 9, color: lesson.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                        {completed.has(lesson.id) ? '✓ Done' : 'Start'} <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 10, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
                  <div style={{ height: '100%', background: lesson.color, borderRadius: 1, width: completed.has(lesson.id) ? '100%' : '0%', transition: 'width 0.5s' }} />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Key concept cards */}
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Enterprise AI Is NOT "Just Connecting ChatGPT"</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Orchestration', desc: 'Routing queries, assembling context, engineering prompts', icon: '🎛️', color: '#6366f1' },
              { label: 'Security', desc: 'Role-based retrieval, no LLM decides access', icon: '🔐', color: '#f43f5e' },
              { label: 'Governance', desc: 'Every query logged, compliance monitored, risks flagged', icon: '📊', color: '#fb923c' },
              { label: 'Ingestion', desc: 'Continuous, incremental, multi-source knowledge sync', icon: '🔄', color: '#34d399' },
              { label: 'Vector Search', desc: 'Semantic similarity at millisecond scale', icon: '🔍', color: '#22d3ee' },
              { label: 'Embeddings', desc: 'Text → 384-dim meaning vectors', icon: '🧬', color: '#a78bfa' },
              { label: 'Integrations', desc: 'Teams, Slack, Jira all route through one AI backend', icon: '🔗', color: '#4ade80' },
              { label: 'Knowledge Quality', desc: 'AI quality is bounded by documentation quality', icon: '📚', color: '#facc15' },
            ].map(({ label, desc, icon, color }) => (
              <div key={label} style={{ padding: '10px', background: `${color}08`, border: `1px solid ${color}18`, borderRadius: 8 }}>
                <div style={{ fontSize: 18, marginBottom: 5 }}>{icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Lesson modal */}
      <AnimatePresence>
        {selectedLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLesson(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 700, maxHeight: '90vh',
                background: 'var(--bg-secondary)',
                border: `1px solid ${selectedLesson.color}30`,
                borderRadius: 16,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxShadow: `0 0 60px ${selectedLesson.color}20`,
              }}
            >
              {/* Modal header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${selectedLesson.color}18`, border: `1px solid ${selectedLesson.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedLesson.color }}>
                  {selectedLesson.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedLesson.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Slide {slideIndex + 1} of {selectedLesson.slides.length}
                  </div>
                </div>
                {/* Progress dots */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                  {selectedLesson.slides.map((_, i) => (
                    <div key={i} onClick={() => setSlideIndex(i)} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i === slideIndex ? selectedLesson.color : i < slideIndex ? selectedLesson.color + '60' : 'rgba(255,255,255,0.1)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }} />
                  ))}
                </div>
              </div>

              {/* Slide content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 16px' }}>
                <AnimatePresence mode="wait">
                  <motion.div key={slideIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                    {(() => {
                      const slide = selectedLesson.slides[slideIndex]
                      return (
                        <>
                          <h2 style={{ fontSize: 20, fontWeight: 800, color: selectedLesson.color, marginBottom: 12 }}>
                            {slide.heading}
                          </h2>
                          {slide.body && (
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: slide.visual || slide.code ? 16 : 0 }}>
                              {slide.body}
                            </p>
                          )}
                          {slide.visual && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
                              {slide.visual}
                            </div>
                          )}
                          {slide.code && (
                            <pre style={{
                              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10,
                              padding: '14px 16px', fontSize: 11, fontFamily: 'var(--font-mono)',
                              color: '#22d3ee', overflowX: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                            }}>
                              {slide.code}
                            </pre>
                          )}
                        </>
                      )
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={prevSlide} disabled={slideIndex === 0} style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 7,
                  cursor: slideIndex === 0 ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', fontSize: 12, opacity: slideIndex === 0 ? 0.4 : 1,
                }}>
                  <ChevronLeft size={13} />Previous
                </button>
                <button onClick={nextSlide} style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '7px 16px',
                  background: `linear-gradient(135deg, ${selectedLesson.color}, ${selectedLesson.color}90)`,
                  border: 'none', borderRadius: 7, cursor: 'pointer', color: 'white', fontSize: 12, fontWeight: 600,
                }}>
                  {slideIndex === selectedLesson.slides.length - 1 ? <><CheckCircle size={13} />Complete</> : <>Next<ChevronRight size={13} /></>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
