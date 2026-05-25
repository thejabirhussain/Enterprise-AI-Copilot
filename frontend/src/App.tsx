import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from '@/components/sidebar/Sidebar'
import ChatInterface from '@/components/chat/ChatInterface'
import DashboardPage from '@/pages/DashboardPage'
import KnowledgePage from '@/pages/KnowledgePage'
import EmbeddingsPage from '@/pages/EmbeddingsPage'
import ArchitecturePage from '@/pages/ArchitecturePage'
import IntegrationPage from '@/pages/IntegrationPage'
import GovernancePage from '@/pages/GovernancePage'
import IngestionPage from '@/pages/IngestionPage'
import SecurityPage from '@/pages/SecurityPage'
import KnowledgeHealthPage from '@/pages/KnowledgeHealthPage'
import LearnPage from '@/pages/LearnPage'
import { useUIStore } from '@/stores/uiStore'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

function AppContent() {
  const { currentPage } = useUIStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'chat': return <ChatInterface />
      case 'dashboard': return <DashboardPage />
      case 'knowledge': return <KnowledgePage />
      case 'embeddings': return <EmbeddingsPage />
      case 'architecture': return <ArchitecturePage />
      case 'integration': return <IntegrationPage />
      case 'governance': return <GovernancePage />
      case 'ingestion': return <IngestionPage />
      case 'security': return <SecurityPage />
      case 'health': return <KnowledgeHealthPage />
      case 'learn': return <LearnPage />
      default: return <ChatInterface />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <Sidebar />
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div key={currentPage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} style={{ height: '100%' }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
