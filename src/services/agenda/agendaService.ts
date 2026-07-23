import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { buscarConfiguracoes, salvarConfiguracoes } from '@/services/empresas/empresaService'
import type { Agendamento, HorarioDisponivel } from '@/types'

// ── Agendamentos ──────────────────────────────────────────────────────────────

export async function listarAgendamentosDia(
  empresaId: string,
  data: Date
): Promise<Agendamento[]> {
  try {
    const inicio = new Date(data)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(data)
    fim.setHours(23, 59, 59, 999)

    const q = query(
      collection(db, 'empresas', empresaId, 'agendamentos'),
      where('data', '>=', Timestamp.fromDate(inicio)),
      where('data', '<=', Timestamp.fromDate(fim)),
      orderBy('data')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d =>
      converterTimestamps<Agendamento>({ id: d.id, ...d.data() })
    )
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function listarAgendamentosIntervalo(
  empresaId: string,
  inicio: Date,
  fim: Date
): Promise<Agendamento[]> {
  try {
    const q = query(
      collection(db, 'empresas', empresaId, 'agendamentos'),
      where('data', '>=', Timestamp.fromDate(inicio)),
      where('data', '<=', Timestamp.fromDate(fim)),
      orderBy('data')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d =>
      converterTimestamps<Agendamento>({ id: d.id, ...d.data() })
    )
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function criarAgendamento(
  empresaId: string,
  dados: Omit<Agendamento, 'id' | 'criadoEm' | 'atualizadoEm'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'empresas', empresaId, 'agendamentos'), {
      ...dados,
      data: Timestamp.fromDate(dados.data),
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    })
    return ref.id
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function atualizarAgendamento(
  empresaId: string,
  id: string,
  dados: Partial<Agendamento>
): Promise<void> {
  try {
    const update: Record<string, unknown> = { ...dados, atualizadoEm: serverTimestamp() }
    if (dados.data) update.data = Timestamp.fromDate(dados.data)
    await updateDoc(doc(db, 'empresas', empresaId, 'agendamentos', id), update)
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function excluirAgendamento(empresaId: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'empresas', empresaId, 'agendamentos', id))
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

// ── Horários disponíveis ──────────────────────────────────────────────────────

const DOC_HORARIOS = 'horarios'

export const HORARIOS_PADRAO: HorarioDisponivel[] = [
  { diaSemana: 1, inicio: '09:00', fim: '18:00', intervalMin: 60 },
  { diaSemana: 2, inicio: '09:00', fim: '18:00', intervalMin: 60 },
  { diaSemana: 3, inicio: '09:00', fim: '18:00', intervalMin: 60 },
  { diaSemana: 4, inicio: '09:00', fim: '18:00', intervalMin: 60 },
  { diaSemana: 5, inicio: '09:00', fim: '18:00', intervalMin: 60 },
]

export async function buscarHorariosDisponiveis(empresaId: string): Promise<HorarioDisponivel[]> {
  try {
    const dados = await buscarConfiguracoes(empresaId)
    return (dados[DOC_HORARIOS] as HorarioDisponivel[]) ?? HORARIOS_PADRAO
  } catch {
    return HORARIOS_PADRAO
  }
}

export async function salvarHorariosDisponiveis(
  empresaId: string,
  horarios: HorarioDisponivel[]
): Promise<void> {
  await salvarConfiguracoes(empresaId, { [DOC_HORARIOS]: horarios })
}

/**
 * Retorna slots livres de uma data com base nos horários configurados
 * e nos agendamentos já existentes.
 */
export function calcularSlotsLivres(
  data: Date,
  agendamentos: Agendamento[],
  horarios: HorarioDisponivel[]
): Date[] {
  const diaSemana = data.getDay()
  const config = horarios.find(h => h.diaSemana === diaSemana)
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
    // Verifica se há conflito com agendamentos existentes
    const ocupado = agendamentos.some(ag => {
      if (ag.status === 'cancelado') return false
      const agInicio = ag.data instanceof Date ? ag.data : new Date(ag.data)
      const agFim = new Date(agInicio.getTime() + ag.duracaoMin * 60_000)
      return current < agFim && slotFim > agInicio
    })
    if (!ocupado) slots.push(new Date(current))
    current = slotFim
  }

  return slots
}
