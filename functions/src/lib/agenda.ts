/**
 * Porta server-side (Admin SDK) de src/services/agenda/agendaService.ts,
 * só das funções que a IA precisa para checar/criar agendamentos.
 */
import { db, Timestamp } from './firestore'

export interface HorarioDisponivel {
  diaSemana: number
  inicio: string
  fim: string
  intervalMin: number
}

export interface Agendamento {
  id: string
  titulo: string
  tipo: string
  contatoNome: string
  data: Date
  duracaoMin: number
  status: string
  observacoes?: string
}

export const HORARIOS_PADRAO: HorarioDisponivel[] = [
  { diaSemana: 1, inicio: '09:00', fim: '18:00', intervalMin: 60 },
  { diaSemana: 2, inicio: '09:00', fim: '18:00', intervalMin: 60 },
  { diaSemana: 3, inicio: '09:00', fim: '18:00', intervalMin: 60 },
  { diaSemana: 4, inicio: '09:00', fim: '18:00', intervalMin: 60 },
  { diaSemana: 5, inicio: '09:00', fim: '18:00', intervalMin: 60 },
]

export async function buscarHorariosDisponiveis(empresaId: string): Promise<HorarioDisponivel[]> {
  const snap = await db.doc(`empresas/${empresaId}/configuracoes/principal`).get()
  const dados = snap.exists ? snap.data() : undefined
  return (dados?.horarios as HorarioDisponivel[]) ?? HORARIOS_PADRAO
}

export async function listarAgendamentosIntervalo(
  empresaId: string,
  inicio: Date,
  fim: Date
): Promise<Agendamento[]> {
  const snap = await db
    .collection(`empresas/${empresaId}/agendamentos`)
    .where('data', '>=', Timestamp.fromDate(inicio))
    .where('data', '<=', Timestamp.fromDate(fim))
    .orderBy('data')
    .get()

  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      titulo: data.titulo,
      tipo: data.tipo,
      contatoNome: data.contatoNome,
      data: (data.data as FirebaseFirestore.Timestamp).toDate(),
      duracaoMin: data.duracaoMin,
      status: data.status,
      observacoes: data.observacoes,
    }
  })
}

export async function criarAgendamento(
  empresaId: string,
  dados: {
    titulo: string
    tipo: string
    contatoNome: string
    data: Date
    duracaoMin: number
    status: string
    observacoes?: string
  }
): Promise<string> {
  const ref = await db.collection(`empresas/${empresaId}/agendamentos`).add({
    ...dados,
    data: Timestamp.fromDate(dados.data),
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  })
  return ref.id
}

/** Idêntico ao cálculo puro do frontend — mesma regra de negócio. */
export function calcularSlotsLivres(
  data: Date,
  agendamentos: Agendamento[],
  horarios: HorarioDisponivel[]
): Date[] {
  const diaSemana = data.getDay()
  const config = horarios.find((h) => h.diaSemana === diaSemana)
  if (!config) return []

  const [hIni, mIni] = config.inicio.split(':').map(Number)
  const [hFim, mFim] = config.fim.split(':').map(Number)
  const slots: Date[] = []

  let current = new Date(data)
  current.setHours(hIni, mIni, 0, 0)
  const end = new Date(data)
  end.setHours(hFim, mFim, 0, 0)

  while (current < end) {
    const slotFim = new Date(current.getTime() + config.intervalMin * 60_000)
    const ocupado = agendamentos.some((ag) => {
      if (ag.status === 'cancelado') return false
      const agInicio = ag.data
      const agFim = new Date(agInicio.getTime() + ag.duracaoMin * 60_000)
      return current < agFim && slotFim > agInicio
    })
    if (!ocupado) slots.push(new Date(current))
    current = slotFim
  }

  return slots
}
