import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  listarEtiquetas,
  criarEtiqueta,
  excluirEtiqueta,
} from '@/services/contatos/etiquetaService'
import type { Etiqueta } from '@/types'

export function useEtiquetas() {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarEtiquetas = useCallback(async () => {
    if (!empresaId) {
      setEtiquetas([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const data = await listarEtiquetas(empresaId)
      setEtiquetas(data)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [empresaId])

  useEffect(() => {
    carregarEtiquetas()
  }, [carregarEtiquetas])

  const novaEtiqueta = useCallback(
    async (dados: { nome: string; cor: string }) => {
      if (!empresaId) return
      await criarEtiqueta(empresaId, dados)
      await carregarEtiquetas()
    },
    [empresaId, carregarEtiquetas]
  )

  const removerEtiqueta = useCallback(
    async (etiquetaId: string) => {
      if (!empresaId) return
      await excluirEtiqueta(empresaId, etiquetaId)
      await carregarEtiquetas()
    },
    [empresaId, carregarEtiquetas]
  )

  return {
    etiquetas,
    carregando,
    erro,
    criarEtiqueta: novaEtiqueta,
    excluirEtiqueta: removerEtiqueta,
    recarregar: carregarEtiquetas,
  }
}
