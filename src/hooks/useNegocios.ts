import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  listarNegocios,
  criarNegocio,
  atualizarNegocio,
  moverNegocio,
  marcarGanho,
  marcarPerdido,
  arquivarNegocio,
  excluirNegocio,
} from '@/services/crm/negocioService'
import type { Negocio, StatusNegocio, PrioridadeNegocio } from '@/types'

export interface FiltrosNegocios {
  etapaId?: string
  responsavelId?: string
  status?: StatusNegocio
  prioridade?: PrioridadeNegocio
  busca?: string
}

export function useNegocios(filtrosIniciais?: FiltrosNegocios) {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosNegocios>(filtrosIniciais ?? {})

  const carregarNegocios = useCallback(async () => {
    if (!empresaId) {
      setNegocios([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      let data = await listarNegocios(empresaId, {
        etapaId: filtros.etapaId,
        responsavelId: filtros.responsavelId,
        status: filtros.status,
        prioridade: filtros.prioridade,
      })
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase()
        data = data.filter(
          (n) =>
            n.titulo.toLowerCase().includes(busca) ||
            n.contatoNome.toLowerCase().includes(busca)
        )
      }
      setNegocios(data)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [empresaId, filtros])

  useEffect(() => {
    carregarNegocios()
  }, [carregarNegocios])

  const novoNegocio = useCallback(
    async (dados: Omit<Negocio, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
      if (!empresaId) return
      await criarNegocio(empresaId, dados)
      await carregarNegocios()
    },
    [empresaId, carregarNegocios]
  )

  const editarNegocio = useCallback(
    async (negocioId: string, dados: Partial<Negocio>) => {
      if (!empresaId) return
      await atualizarNegocio(empresaId, negocioId, dados)
      await carregarNegocios()
    },
    [empresaId, carregarNegocios]
  )

  const mover = useCallback(
    async (negocioId: string, novaEtapaId: string) => {
      if (!empresaId) return
      await moverNegocio(empresaId, negocioId, novaEtapaId)
      await carregarNegocios()
    },
    [empresaId, carregarNegocios]
  )

  const ganho = useCallback(
    async (negocioId: string) => {
      if (!empresaId) return
      await marcarGanho(empresaId, negocioId)
      await carregarNegocios()
    },
    [empresaId, carregarNegocios]
  )

  const perdido = useCallback(
    async (negocioId: string) => {
      if (!empresaId) return
      await marcarPerdido(empresaId, negocioId)
      await carregarNegocios()
    },
    [empresaId, carregarNegocios]
  )

  const arquivar = useCallback(
    async (negocioId: string) => {
      if (!empresaId) return
      await arquivarNegocio(empresaId, negocioId)
      await carregarNegocios()
    },
    [empresaId, carregarNegocios]
  )

  const excluir = useCallback(
    async (negocioId: string) => {
      if (!empresaId) return
      await excluirNegocio(empresaId, negocioId)
      await carregarNegocios()
    },
    [empresaId, carregarNegocios]
  )

  return {
    negocios,
    carregando,
    erro,
    filtros,
    setFiltros,
    criarNegocio: novoNegocio,
    atualizarNegocio: editarNegocio,
    moverNegocio: mover,
    marcarGanho: ganho,
    marcarPerdido: perdido,
    arquivarNegocio: arquivar,
    excluirNegocio: excluir,
    recarregar: carregarNegocios,
  }
}
