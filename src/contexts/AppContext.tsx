import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode
} from 'react'
import { storage, KEYS } from '@/services/storage'
import { generateAIResponse, getTypingDelay } from '@/lib/aiEngine'
import {
  mockAgents, mockConversations, mockLeads, mockKanbanColumns,
  mockNotifications, mockKnowledgeFiles, mockFlows,
  defaultSettings, defaultProfile,
} from '@/data/mock'
import type {
  Agent, Conversation, Lead, KanbanColumn, AppNotification,
  KnowledgeFile, Flow, AppSettings, UserProfile, Message, KanbanCard
} from '@/types'

export interface GlobalSearchResult {
  type: 'lead' | 'conversation' | 'agent' | 'flow'
  id: string
  title: string
  subtitle: string
  route: string
}

interface AppContextValue {
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  register: (name: string, email: string, password: string) => boolean
  logout: () => void

  theme: 'dark' | 'light'
  toggleTheme: () => void

  agents: Agent[]
  addAgent: (a: Omit<Agent, 'id' | 'conversations' | 'createdAt'>) => void
  updateAgent: (id: string, data: Partial<Agent>) => void
  deleteAgent: (id: string) => void
  duplicateAgent: (id: string) => void

  conversations: Conversation[]
  activeConversationId: string | null
  setActiveConversationId: (id: string | null) => void
  sendMessage: (convId: string, content: string) => void
  createConversation: (contact: { name: string; phone: string; company?: string }) => void
  updateConversationStatus: (id: string, status: Conversation['status']) => void
  archiveConversation: (id: string) => void
  markConversationRead: (id: string) => void

  leads: Lead[]
  addLead: (l: Omit<Lead, 'id' | 'createdAt' | 'score'>) => void
  updateLead: (id: string, data: Partial<Lead>) => void
  deleteLead: (id: string) => void

  kanbanColumns: KanbanColumn[]
  moveCard: (cardId: string, fromColId: string, toColId: string) => void
  addKanbanCard: (colId: string, card: Omit<KanbanCard, 'id' | 'daysInStage'>) => void
  updateKanbanCard: (cardId: string, colId: string, data: Partial<KanbanCard>) => void
  deleteKanbanCard: (cardId: string, colId: string) => void

  notifications: AppNotification[]
  addNotification: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  unreadCount: number

  knowledgeFiles: KnowledgeFile[]
  addKnowledgeFile: (f: { name: string; size: string; category: string }) => void
  deleteKnowledgeFile: (id: string) => void

  flows: Flow[]
  addFlow: (name: string) => void
  updateFlow: (id: string, data: Partial<Flow>) => void
  deleteFlow: (id: string) => void
  toggleFlowStatus: (id: string) => void

  settings: AppSettings
  updateSettings: (data: Partial<AppSettings>) => void

  profile: UserProfile
  updateProfile: (data: Partial<UserProfile>) => void

  globalSearch: (query: string) => GlobalSearchResult[]
}

const AppContext = createContext<AppContextValue | null>(null)

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!storage.get(KEYS.AUTH, null))
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storage.get(KEYS.THEME, 'dark' as 'dark' | 'light'))
  const [agents, setAgents] = useState<Agent[]>(() => storage.get(KEYS.AGENTS, mockAgents))
  const [conversations, setConversations] = useState<Conversation[]>(() => storage.get(KEYS.CONVERSATIONS, mockConversations))
  const [leads, setLeads] = useState<Lead[]>(() => storage.get(KEYS.LEADS, mockLeads))
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(() => storage.get(KEYS.CRM, mockKanbanColumns))
  const [notifications, setNotifications] = useState<AppNotification[]>(() => storage.get(KEYS.NOTIFICATIONS, mockNotifications))
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>(() => storage.get(KEYS.KNOWLEDGE, mockKnowledgeFiles))
  const [flows, setFlows] = useState<Flow[]>(() => storage.get(KEYS.FLOWS, mockFlows))
  const [settings, setSettings] = useState<AppSettings>(() => storage.get(KEYS.SETTINGS, defaultSettings))
  const [profile, setProfile] = useState<UserProfile>(() => storage.get(KEYS.PROFILE, defaultProfile))
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  useEffect(() => { storage.set(KEYS.AGENTS, agents) }, [agents])
  useEffect(() => { storage.set(KEYS.CONVERSATIONS, conversations) }, [conversations])
  useEffect(() => { storage.set(KEYS.LEADS, leads) }, [leads])
  useEffect(() => { storage.set(KEYS.CRM, kanbanColumns) }, [kanbanColumns])
  useEffect(() => { storage.set(KEYS.NOTIFICATIONS, notifications) }, [notifications])
  useEffect(() => { storage.set(KEYS.KNOWLEDGE, knowledgeFiles) }, [knowledgeFiles])
  useEffect(() => { storage.set(KEYS.FLOWS, flows) }, [flows])
  useEffect(() => { storage.set(KEYS.SETTINGS, settings) }, [settings])
  useEffect(() => { storage.set(KEYS.PROFILE, profile) }, [profile])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    storage.set(KEYS.THEME, theme)
  }, [theme])

  // ─── Auth ────────────────────────────────────────────────
  const login = useCallback((_email: string, _password: string): boolean => {
    storage.set(KEYS.AUTH, { email: _email, loggedAt: new Date().toISOString() })
    setIsAuthenticated(true)
    return true
  }, [])

  const register = useCallback((name: string, email: string, _password: string): boolean => {
    storage.set(KEYS.AUTH, { email, loggedAt: new Date().toISOString() })
    setProfile(prev => ({ ...prev, name: name.split(' ')[0] ?? name, lastName: name.split(' ').slice(1).join(' ') ?? '', email }))
    setIsAuthenticated(true)
    return true
  }, [])

  const logout = useCallback(() => {
    storage.remove(KEYS.AUTH)
    setIsAuthenticated(false)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  // ─── Notifications ───────────────────────────────────────
  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    setNotifications(prev => [
      { ...n, id: uid(), time: new Date().toISOString(), read: false },
      ...prev.slice(0, 49),
    ])
  }, [])

  // ─── Agents ──────────────────────────────────────────────
  const addAgent = useCallback((a: Omit<Agent, 'id' | 'conversations' | 'createdAt'>) => {
    const newAgent: Agent = { ...a, id: uid(), conversations: 0, createdAt: new Date().toISOString() }
    setAgents(prev => [newAgent, ...prev])
    addNotification({ title: 'Agente criado', message: `${a.name} foi criado com sucesso.`, type: 'success' })
  }, [addNotification])

  const updateAgent = useCallback((id: string, data: Partial<Agent>) => {
    setAgents(prev => prev.map(a => (a.id === id ? { ...a, ...data } : a)))
  }, [])

  const deleteAgent = useCallback((id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id))
    addNotification({ title: 'Agente removido', message: 'O agente foi excluído.', type: 'info' })
  }, [addNotification])

  const duplicateAgent = useCallback((id: string) => {
    setAgents(prev => {
      const src = prev.find(a => a.id === id)
      if (!src) return prev
      const copy: Agent = {
        ...src, id: uid(), name: `${src.name} (cópia)`,
        conversations: 0, createdAt: new Date().toISOString(), status: 'inactive',
      }
      return [copy, ...prev]
    })
    addNotification({ title: 'Agente duplicado', message: 'Cópia criada com sucesso.', type: 'success' })
  }, [addNotification])

  // ─── Conversations ───────────────────────────────────────
  const sendMessage = useCallback((convId: string, content: string) => {
    const userMsg: Message = {
      id: uid(), content, sender: 'user',
      timestamp: new Date().toISOString(), status: 'sent',
    }

    // Snapshot da conversa antes de atualizar (para passar ao engine)
    const conv = conversations.find(c => c.id === convId)
    const history = conv ? [...conv.messages] : []
    const contactName = conv?.contact.name ?? ''
    const agentName = conv?.agentName

    setConversations(prev =>
      prev.map(c =>
        c.id !== convId ? c
          : { ...c, messages: [...c.messages, userMsg], lastMessage: content, lastMessageTime: new Date().toISOString(), unread: 0 }
      )
    )

    // Gera resposta contextual e calcula delay realista
    const reply = generateAIResponse(content, agentName, contactName, [...history, userMsg])
    const delay = getTypingDelay(reply)

    setTimeout(() => {
      const aiMsg: Message = { id: uid(), content: reply, sender: 'ai', timestamp: new Date().toISOString() }
      setConversations(prev =>
        prev.map(c =>
          c.id !== convId ? c
            : { ...c, messages: [...c.messages, aiMsg], lastMessage: reply, lastMessageTime: new Date().toISOString() }
        )
      )
    }, delay)
  }, [conversations])

  const createConversation = useCallback((contact: { name: string; phone: string; company?: string }) => {
    const conv: Conversation = {
      id: uid(),
      contact: { id: uid(), ...contact },
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unread: 0,
      status: 'new',
      agentName: 'Aria',
      messages: [],
    }
    setConversations(prev => [conv, ...prev])
    setActiveConversationId(conv.id)
    addNotification({ title: 'Nova conversa', message: `Conversa criada com ${contact.name}.`, type: 'info' })
  }, [addNotification])

  const updateConversationStatus = useCallback((id: string, status: Conversation['status']) => {
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, status } : c)))
  }, [])

  const archiveConversation = useCallback((id: string) => {
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, status: 'closed' } : c)))
  }, [])

  const markConversationRead = useCallback((id: string) => {
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread: 0 } : c)))
  }, [])

  // ─── Leads ───────────────────────────────────────────────
  const addLead = useCallback((l: Omit<Lead, 'id' | 'createdAt' | 'score'>) => {
    const newLead: Lead = {
      ...l, id: uid(), createdAt: new Date().toISOString(),
      score: Math.floor(Math.random() * 30) + 50,
    }
    setLeads(prev => [newLead, ...prev])
    addNotification({ title: 'Lead adicionado', message: `${l.name} foi adicionado ao pipeline.`, type: 'success' })
  }, [addNotification])

  const updateLead = useCallback((id: string, data: Partial<Lead>) => {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...data } : l)))
  }, [])

  const deleteLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id))
    addNotification({ title: 'Lead removido', message: 'O lead foi excluído.', type: 'info' })
  }, [addNotification])

  // ─── CRM ─────────────────────────────────────────────────
  const moveCard = useCallback((cardId: string, fromColId: string, toColId: string) => {
    if (fromColId === toColId) return
    setKanbanColumns(prev => {
      const card = prev.find(c => c.id === fromColId)?.cards.find(k => k.id === cardId)
      if (!card) return prev
      return prev.map(col => {
        if (col.id === fromColId) return { ...col, cards: col.cards.filter(k => k.id !== cardId) }
        if (col.id === toColId) return { ...col, cards: [{ ...card, daysInStage: 0 }, ...col.cards] }
        return col
      })
    })
  }, [])

  const addKanbanCard = useCallback((colId: string, card: Omit<KanbanCard, 'id' | 'daysInStage'>) => {
    setKanbanColumns(prev =>
      prev.map(col =>
        col.id !== colId ? col
          : { ...col, cards: [{ ...card, id: uid(), daysInStage: 0 }, ...col.cards] }
      )
    )
    addNotification({ title: 'Oportunidade criada', message: `${card.title} adicionado ao CRM.`, type: 'success' })
  }, [addNotification])

  const updateKanbanCard = useCallback((cardId: string, colId: string, data: Partial<KanbanCard>) => {
    setKanbanColumns(prev =>
      prev.map(col =>
        col.id !== colId ? col
          : { ...col, cards: col.cards.map(k => (k.id === cardId ? { ...k, ...data } : k)) }
      )
    )
  }, [])

  const deleteKanbanCard = useCallback((cardId: string, colId: string) => {
    setKanbanColumns(prev =>
      prev.map(col =>
        col.id !== colId ? col
          : { ...col, cards: col.cards.filter(k => k.id !== cardId) }
      )
    )
  }, [])

  // ─── Knowledge ───────────────────────────────────────────
  const addKnowledgeFile = useCallback((f: { name: string; size: string; category: string }) => {
    const file: KnowledgeFile = {
      id: uid(), ...f, status: 'processing', chunks: 0,
      date: new Date().toLocaleDateString('pt-BR'), progress: 0,
    }
    setKnowledgeFiles(prev => [file, ...prev])
    let prog = 0
    const interval = setInterval(() => {
      prog += Math.floor(Math.random() * 20) + 5
      if (prog >= 100) {
        prog = 100
        clearInterval(interval)
        setKnowledgeFiles(prev =>
          prev.map(kf =>
            kf.id === file.id
              ? { ...kf, status: 'processed', chunks: Math.floor(Math.random() * 150) + 20, progress: 100 }
              : kf
          )
        )
        addNotification({ title: 'Arquivo processado', message: `${f.name} foi indexado.`, type: 'success' })
      } else {
        setKnowledgeFiles(prev => prev.map(kf => (kf.id === file.id ? { ...kf, progress: prog } : kf)))
      }
    }, 600)
  }, [addNotification])

  const deleteKnowledgeFile = useCallback((id: string) => {
    setKnowledgeFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  // ─── Flows ───────────────────────────────────────────────
  const addFlow = useCallback((name: string) => {
    const flow: Flow = { id: uid(), name, status: 'inactive', runs: 0, conversion: '0%', lastRun: 'Nunca', nodes: [] }
    setFlows(prev => [flow, ...prev])
    addNotification({ title: 'Fluxo criado', message: `"${name}" foi criado.`, type: 'success' })
  }, [addNotification])

  const updateFlow = useCallback((id: string, data: Partial<Flow>) => {
    setFlows(prev => prev.map(f => (f.id === id ? { ...f, ...data } : f)))
    addNotification({ title: 'Fluxo salvo', message: 'Alterações salvas com sucesso.', type: 'success' })
  }, [addNotification])

  const deleteFlow = useCallback((id: string) => {
    setFlows(prev => prev.filter(f => f.id !== id))
  }, [])

  const toggleFlowStatus = useCallback((id: string) => {
    setFlows(prev =>
      prev.map(f => (f.id === id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f))
    )
  }, [])

  // ─── Settings ────────────────────────────────────────────
  const updateSettings = useCallback((data: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...data }))
    if (data.theme) setTheme(data.theme)
  }, [])

  // ─── Profile ─────────────────────────────────────────────
  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...data }))
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  // ─── Global Search ───────────────────────────────────────
  const globalSearch = useCallback((query: string): GlobalSearchResult[] => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const results: GlobalSearchResult[] = []
    leads.forEach(l => {
      if (l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q))
        results.push({ type: 'lead', id: l.id, title: l.name, subtitle: l.company, route: '/leads' })
    })
    conversations.forEach(c => {
      if (c.contact.name.toLowerCase().includes(q) || (c.contact.company ?? '').toLowerCase().includes(q))
        results.push({ type: 'conversation', id: c.id, title: c.contact.name, subtitle: c.contact.company ?? '', route: '/conversations' })
    })
    agents.forEach(a => {
      if (a.name.toLowerCase().includes(q))
        results.push({ type: 'agent', id: a.id, title: a.name, subtitle: a.model, route: '/agents' })
    })
    flows.forEach(f => {
      if (f.name.toLowerCase().includes(q))
        results.push({ type: 'flow', id: f.id, title: f.name, subtitle: f.status === 'active' ? 'Ativo' : 'Inativo', route: '/flows' })
    })
    return results.slice(0, 8)
  }, [leads, conversations, agents, flows])

  const value: AppContextValue = {
    isAuthenticated, login, register, logout,
    theme, toggleTheme,
    agents, addAgent, updateAgent, deleteAgent, duplicateAgent,
    conversations, activeConversationId, setActiveConversationId,
    sendMessage, createConversation, updateConversationStatus, archiveConversation, markConversationRead,
    leads, addLead, updateLead, deleteLead,
    kanbanColumns, moveCard, addKanbanCard, updateKanbanCard, deleteKanbanCard,
    notifications, addNotification, markNotificationRead, markAllNotificationsRead, unreadCount,
    knowledgeFiles, addKnowledgeFile, deleteKnowledgeFile,
    flows, addFlow, updateFlow, deleteFlow, toggleFlowStatus,
    settings, updateSettings,
    profile, updateProfile,
    globalSearch,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
