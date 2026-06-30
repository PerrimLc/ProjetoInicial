export interface Agent {
  id: string
  name: string
  description: string
  model: string
  temperature: number
  status: 'active' | 'inactive' | 'training'
  conversations: number
  createdAt: string
  color: string
  prompt?: string
}

export interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: string
  status?: 'sent' | 'delivered' | 'read'
}

export interface Contact {
  id: string
  name: string
  phone: string
  email?: string
  company?: string
}

export interface Conversation {
  id: string
  contact: Contact
  lastMessage: string
  lastMessageTime: string
  unread: number
  status: 'new' | 'active' | 'closed'
  agentName?: string
  messages: Message[]
}

export interface Lead {
  id: string
  name: string
  company: string
  phone: string
  email: string
  source: string
  status: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost'
  value: number
  responsible: string
  createdAt: string
  score: number
  notes?: string
}

export interface KanbanCard {
  id: string
  title: string
  company: string
  value: number
  responsible: string
  daysInStage: number
  priority: 'low' | 'medium' | 'high'
  email?: string
  phone?: string
}

export interface KanbanColumn {
  id: string
  title: string
  color: string
  cards: KanbanCard[]
}

export interface KnowledgeFile {
  id: string
  name: string
  size: string
  category: string
  status: 'processed' | 'processing' | 'error'
  chunks: number
  date: string
  progress?: number
}

export interface FlowNode {
  id: string
  type: 'trigger' | 'message' | 'wait' | 'condition' | 'agent' | 'end'
  label: string
  x: number
  y: number
  color: string
  content?: string
}

export interface Flow {
  id: string
  name: string
  status: 'active' | 'inactive'
  runs: number
  conversion: string
  lastRun: string
  nodes: FlowNode[]
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  time: string
  read: boolean
}

export interface UserProfile {
  name: string
  lastName: string
  email: string
  phone: string
  role: string
  company: string
  website: string
  plan: string
  avatar: string
}

export interface AppSettings {
  companyName: string
  companyEmail: string
  companyPhone: string
  companyWebsite: string
  whatsappConnected: boolean
  openaiKey: string
  defaultModel: string
  defaultTemperature: number
  defaultPrompt: string
  theme: 'dark' | 'light'
  language: string
  notificationsEnabled: boolean
  twoFactor: boolean
}

export interface ChartDataPoint {
  name: string
  value: number
  value2?: number
  value3?: number
}
