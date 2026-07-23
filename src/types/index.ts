// ─── Tipos existentes do template (preservados) ─────────────────────────────

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

// ─── Novos tipos do domínio WhatsApp CRM SaaS ────────────────────────────────

export type PapelUsuario = 'administrador' | 'supervisor' | 'atendente'

export interface Usuario {
  id: string
  nome: string
  email: string
  fotoUrl?: string
  empresaAtualId?: string
  criadoEm: Date
  ultimoAcessoEm?: Date
}

export interface Empresa {
  id: string
  nome: string
  documento?: string
  telefone?: string
  email?: string
  ativa: boolean
  criadaPor: string
  criadoEm: Date
  atualizadoEm: Date
}

export interface MembroEmpresa {
  usuarioId: string
  nome: string
  email: string
  papel: PapelUsuario
  setorIds: string[]
  ativo: boolean
  criadoEm: Date
}

export interface Setor {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  criadoEm: Date
}

export interface Contato {
  id: string
  nome: string
  telefone: string
  email?: string
  empresa?: string
  observacoes?: string
  etiquetaIds: string[]
  origem?: string
  responsavelId?: string
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface Etiqueta {
  id: string
  nome: string
  cor: string
  criadoEm: Date
}

export interface EtapaFunil {
  id: string
  nome: string
  ordem: number
  ativo: boolean
  criadoEm: Date
}

export type PrioridadeNegocio = 'baixa' | 'media' | 'alta'
export type StatusNegocio = 'aberto' | 'ganho' | 'perdido' | 'arquivado'

export interface Negocio {
  id: string
  titulo: string
  contatoId: string
  contatoNome: string
  etapaId: string
  responsavelId?: string
  valor?: number
  prioridade: PrioridadeNegocio
  status: StatusNegocio
  origem?: string
  observacoes?: string
  criadoEm: Date
  atualizadoEm: Date
}

export type StatusConversa = 'aguardando' | 'em_atendimento' | 'finalizada'
export type DirecaoMensagem = 'entrada' | 'saida'
export type StatusMensagem = 'enviando' | 'enviada' | 'entregue' | 'lida' | 'erro'

export interface Conversa {
  id: string
  contatoId: string
  contatoNome: string
  telefone: string
  atendenteId?: string
  setorId?: string
  status: StatusConversa
  ultimaMensagem: string
  ultimaMensagemEm: Date
  mensagensNaoLidas: number
  etiquetaIds: string[]
  origem: 'simulacao' | 'whatsapp'
  criadoEm: Date
  atualizadoEm: Date
}

export interface Mensagem {
  id: string
  conversaId: string
  texto: string
  tipo: 'texto' | 'sistema'
  direcao: DirecaoMensagem
  remetenteId?: string
  status: StatusMensagem
  enviadaEm: Date
  whatsappMessageId?: string
}

export interface RespostaRapida {
  id: string
  titulo: string
  atalho: string
  mensagem: string
  setorId?: string
  ativa: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface MetricasPrincipal {
  contatosAtivos: number
  negociosAbertos: number
  valorTotalAbertos: number
  negociosGanhos: number
  negociosPerdidos: number
  conversasAguardando: number
  conversasEmAtendimento: number
  conversasFinalizadas: number
  atendentesAtivos: number
  atualizadoEm: Date
}

// ─── Agenda ──────────────────────────────────────────────────────────────────

export type StatusAgendamento = 'agendado' | 'confirmado' | 'cancelado' | 'concluido'
export type TipoAgendamento = 'reuniao' | 'demo' | 'call' | 'outro'

export interface Agendamento {
  id: string
  titulo: string
  tipo: TipoAgendamento
  contatoId?: string
  contatoNome: string
  responsavelId?: string
  data: Date          // data + hora de início
  duracaoMin: number  // duração em minutos
  status: StatusAgendamento
  observacoes?: string
  criadoEm: Date
  atualizadoEm: Date
}

export interface HorarioDisponivel {
  diaSemana: number   // 0=dom, 1=seg ... 6=sab
  inicio: string      // "09:00"
  fim: string         // "18:00"
  intervalMin: number // duração padrão do slot em minutos
}
