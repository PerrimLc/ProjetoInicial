import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  listarRespostasRapidas,
  criarRespostaRapida,
  atualizarRespostaRapida,
} from '@/services/atendimento/respostaRapidaService'
import type { RespostaRapida } from '@/types'

export function useRespostasRapidas() {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [todasRespostas, setTodasRespostas] = useState<RespostaRapida[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const carregarRespostas = useCallback(async () => {
    if (!empresaId) {
      setTodasRespostas([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const data = await listarRespostasRapidas(empresaId)
      setTodasRespostas(data)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [empresaId])

  useEffect(() => {
    carregarRespostas()
  }, [carregarRespostas])

  const respostas = useMemo(() => {
    if (!busca) return todasRespostas
    const termo = busca.toLowerCase()
    return todasRespostas.filter(
      (r) =>
        r.titulo.toLowerCase().includes(termo) ||
        r.atalho.toLowerCase().includes(termo) ||
        r.mensagem.toLowerCase().includes(termo)
    )
  }, [todasRespostas, busca])

  const novaResposta = useCallback(
    async (dados: Omit<RespostaRapida, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
      if (!empresaId) return
      await criarRespostaRapida(empresaId, dados)
      await carregarRespostas()
    },
    [empresaId, carregarRespostas]
  )

  const editarResposta = useCallback(
    async (respostaId: string, dados: Partial<RespostaRapida>) => {
      if (!empresaId) return
      await atualizarRespostaRapida(empresaId, respostaId, dados)
      await carregarRespostas()
    },
    [empresaId, carregarRespostas]
  )

  const ativar = useCallback(
    async (id: string) => {
      if (!empresaId) return
      await atualizarRespostaRapida(empresaId, id, { ativa: true })
      await carregarRespostas()
    },
    [empresaId, carregarRespostas]
  )

  const inativar = useCallback(
    async (id: string) => {
      if (!empresaId) return
      await atualizarRespostaRapida(empresaId, id, { ativa: false })
      await carregarRespostas()
    },
    [empresaId, carregarRespostas]
  )

  return {
    respostas,
    carregando,
    erro,
    busca,
    setBusca,
    criarRespostaRapida: novaResposta,
    atualizarRespostaRapida: editarResposta,
    ativar,
    inativar,
    recarregar: carregarRespostas,
  }
}
