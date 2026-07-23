import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  listarEtapas,
  criarEtapa,
  atualizarEtapa,
  reordenarEtapas,
  desativarEtapa,
} from '@/services/crm/etapaFunilService'
import type { EtapaFunil } from '@/types'

export function useEtapasFunil() {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [etapas, setEtapas] = useState<EtapaFunil[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarEtapas = useCallback(async () => {
    if (!empresaId) {
      setEtapas([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const data = await listarEtapas(empresaId)
      setEtapas(data)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [empresaId])

  useEffect(() => {
    carregarEtapas()
  }, [carregarEtapas])

  const novaEtapa = useCallback(
    async (dados: { nome: string; ordem: number }) => {
      if (!empresaId) return
      await criarEtapa(empresaId, dados)
      await carregarEtapas()
    },
    [empresaId, carregarEtapas]
  )

  const editarEtapa = useCallback(
    async (etapaId: string, dados: Partial<EtapaFunil>) => {
      if (!empresaId) return
      await atualizarEtapa(empresaId, etapaId, dados)
      await carregarEtapas()
    },
    [empresaId, carregarEtapas]
  )

  const reordenar = useCallback(
    async (lista: { id: string; ordem: number }[]) => {
      if (!empresaId) return
      await reordenarEtapas(empresaId, lista)
      await carregarEtapas()
    },
    [empresaId, carregarEtapas]
  )

  const desativar = useCallback(
    async (etapaId: string) => {
      if (!empresaId) return
      await desativarEtapa(empresaId, etapaId)
      await carregarEtapas()
    },
    [empresaId, carregarEtapas]
  )

  return {
    etapas,
    carregando,
    erro,
    criarEtapa: novaEtapa,
    atualizarEtapa: editarEtapa,
    reordenarEtapas: reordenar,
    desativarEtapa: desativar,
    recarregar: carregarEtapas,
  }
}
