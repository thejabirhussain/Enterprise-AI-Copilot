import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, FileText, Upload, Search, Shield, Layers } from 'lucide-react'
import { documentsApi, sourcesApi } from '@/api'
import { GlassCard, Badge } from '@/components/ui'

const CATEGORY_COLORS: Record<string, string> = {
  hr_policy: '#6366f1', engineering: '#22d3ee', security: '#f43f5e',
  onboarding: '#a3e635', api_docs: '#fb923c', runbook: '#34d399',
  incident: '#facc15', architecture: '#a78bfa', support: '#67e8f9', deployment: '#4ade80',
}

export default function KnowledgePage() {
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)

  const { data: docsData } = useQuery({ queryKey: ['documents'], queryFn: documentsApi.list })
  const { data: sourcesData } = useQuery({ queryKey: ['sources'], queryFn: sourcesApi.getAll })

  const documents = (docsData as { documents?: Array<{ document_id: string; title: string; category: string; department: string; chunks: number; ingested_at: string }> })?.documents || []
  const categories = (sourcesData as { categories?: Array<{ id: string; name: string; color: string }> })?.categories || []

  const filtered = documents.filter((doc) => {
    const matchSearch = !search || doc.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = !selectedCategory || doc.category === selectedCategory
    return matchSearch && matchCat
  })

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
              Enterprise Knowledge Base
            </h1>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Upload size={14} />
              Upload Document
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {documents.length} documents indexed · {documents.reduce((a, d) => a + (d.chunks || 0), 0)} vector chunks stored in Qdrant
          </p>
        </motion.div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-enterprise"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${selectedCategory === cat.id ? cat.color + '50' : 'var(--border-subtle)'}`,
                  background: selectedCategory === cat.id ? `${cat.color}15` : 'var(--bg-card)',
                  color: selectedCategory === cat.id ? cat.color : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Document grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 14 }}>
                {documents.length === 0 ? 'No documents loaded yet — start the backend to load the knowledge base' : 'No documents match your search'}
              </div>
            </div>
          ) : (
            filtered.map((doc, i) => {
              const color = CATEGORY_COLORS[doc.category] || '#6366f1'
              return (
                <motion.div
                  key={doc.document_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <GlassCard hover style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40,
                        background: `${color}15`,
                        border: `1px solid ${color}30`,
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <FileText size={18} color={color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.title}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                            color, background: `${color}15`, border: `1px solid ${color}25`,
                            padding: '1px 5px', borderRadius: 3,
                          }}>
                            {doc.category?.replace('_', ' ')}
                          </span>
                          <span style={{
                            fontSize: 9, color: '#94a3b8', background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border-subtle)', padding: '1px 5px', borderRadius: 3,
                          }}>
                            <Shield size={8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                            internal
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Layers size={11} color="var(--text-muted)" />
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                              {doc.chunks} chunks
                            </span>
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {doc.department}
                          </span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
