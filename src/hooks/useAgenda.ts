import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  listarAgendamentosDia,
  criarAgendamento,
  atualizarAgendamento,
  excluirAgendamento,
  buscarHorariosDisponiveis,
  salvarHorariosDisponiveis,
  calcularSlotsLivres,
  HORARIOS_PADRAO,
} from '@/services/agenda/agendaService'
import type { Agendamento, HorarioDisponivel } from '@/types'

export function useAgenda(dataSelecionada: Date) {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>(HORARIOS_PADRAO)
  const [slotsLivres, setSlotsLivres] = useState<Date[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) { setCarregando(false); return }
    setCarregando(true)
    setErro(null)
    try {
      const [ags, hrs] = await Promise.all([
        listarAgendamentosDia(empresaId, dataSelecionada),
        buscarHorariosDisponiveis(empresaId),
      ])
      setAgendamentos(ags)
      setHorarios(hrs)
      setSlotsLivres(calcularSlotsLivres(dataSelecionada, ags, hrs))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [empresaId, dataSelecionada])

  useEffect(() => { carregar() }, [carregar])

  const novo = useCallback(async (dados: Omit<Agendamento, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    if (!empresaId) return
    await criarAgendamento(empresaId, dados)
    await carregar()
  }, [empresaId, carregar])

  const atualizar = useCallback(async (id: string, dados: Partial<Agendamento>) => {
    if (!empresaId) return
    await atualizarAgendamento(empresaId, id, dados)
    await carregar()
  }, [empresaId, carregar])

  const excluir = useCallback(async (id: string) => {
    if (!empresaId) return
    await excluirAgendamento(empresaId, id)
    await carregar()
  }, [empresaId, carregar])

  const salvarHorarios = useCallback(async (hrs: HorarioDisponivel[]) => {
    if (!empresaId) return
    await salvarHorariosDisponiveis(empresaId, hrs)
    setHorarios(hrs)
    setSlotsLivres(calcularSlotsLivres(dataSelecionada, agendamentos, hrs))
  }, [empresaId, dataSelecionada, agendamentos])

  return {
    agendamentos,
    horarios,
    slotsLivres,
    carregando,
    erro,
    criarAgendamento: novo,
    atualizarAgendamento: atualizar,
    excluirAgendamento: excluir,
    salvarHorarios,
    recarregar: carregar,
  }
}
