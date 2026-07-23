import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  criarConversa,
  atualizarConversa,
  assumirAtendimento,
  finalizarAtendimento,
  reabrirAtendimento,
  transferirConversa,
  zerarNaoLidas,
  escutarConversas,
} from '@/services/atendimento/conversaService'
import type { Conversa } from '@/types'

export function useConversas() {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [conversas, setConversas] = useState<Conversa[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!empresaId) {
      setConversas([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    const unsubscribe = escutarConversas(empresaId, (data) => {
      setConversas(data)
      setCarregando(false)
    })

    return () => unsubscribe()
  }, [empresaId])

  const novaConversa = useCallback(
    async (dados: Omit<Conversa, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
      if (!empresaId) return
      return criarConversa(empresaId, dados)
    },
    [empresaId]
  )

  const editarConversa = useCallback(
    async (conversaId: string, dados: Partial<Conversa>) => {
      if (!empresaId) return
      await atualizarConversa(empresaId, conversaId, dados)
    },
    [empresaId]
  )

  const assumir = useCallback(
    async (conversaId: string, atendenteId: string) => {
      if (!empresaId) return
      await assumirAtendimento(empresaId, conversaId, atendenteId)
    },
    [empresaId]
  )

  const finalizar = useCallback(
    async (conversaId: string) => {
      if (!empresaId) return
      await finalizarAtendimento(empresaId, conversaId)
    },
    [empresaId]
  )

  const reabrir = useCallback(
    async (conversaId: string) => {
      if (!empresaId) return
      await reabrirAtendimento(empresaId, conversaId)
    },
    [empresaId]
  )

  const transferir = useCallback(
    async (conversaId: string, params: { atendenteId?: string; setorId?: string }) => {
      if (!empresaId) return
      await transferirConversa(empresaId, conversaId, params)
    },
    [empresaId]
  )

  const limparNaoLidas = useCallback(
    async (conversaId: string) => {
      if (!empresaId) return
      await zerarNaoLidas(empresaId, conversaId)
    },
    [empresaId]
  )

  return {
    conversas,
    carregando,
    criarConversa: novaConversa,
    atualizarConversa: editarConversa,
    assumirAtendimento: assumir,
    finalizarAtendimento: finalizar,
    reabrirAtendimento: reabrir,
    transferirConversa: transferir,
    zerarNaoLidas: limparNaoLidas,
  }
}
