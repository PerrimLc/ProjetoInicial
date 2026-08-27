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
