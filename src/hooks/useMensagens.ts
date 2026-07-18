import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  enviarMensagem,
  simularResposta,
  escutarMensagens,
} from '@/services/atendimento/mensagemService'
import type { Mensagem } from '@/types'

export function useMensagens(conversaId: string | null) {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (!empresaId || !conversaId) {
      setMensagens([])
      return
    }

    setCarregando(true)
    const unsubscribe = escutarMensagens(empresaId, conversaId, (data) => {
      setMensagens(data)
      setCarregando(false)
    })

    return () => unsubscribe()
  }, [empresaId, conversaId])

  const enviar = useCallback(
    async (dados: Omit<Mensagem, 'id' | 'enviadaEm'>) => {
      if (!empresaId || !conversaId) return
      return enviarMensagem(empresaId, conversaId, dados)
    },
    [empresaId, conversaId]
  )

  const simular = useCallback(
    async (texto: string) => {
      if (!empresaId || !conversaId) return
      await simularResposta(empresaId, conversaId, texto)
    },
    [empresaId, conversaId]
  )

  return {
    mensagens,
    carregando,
    enviarMensagem: enviar,
    simularResposta: simular,
  }
}
