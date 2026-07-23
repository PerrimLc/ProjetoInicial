import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  listarSetores,
  criarSetor,
  atualizarSetor,
  inativarSetor,
} from '@/services/empresas/setorService'
import type { Setor } from '@/types'

export function useSetores() {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [setores, setSetores] = useState<Setor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarSetores = useCallback(async () => {
    if (!empresaId) {
      setSetores([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const data = await listarSetores(empresaId)
      setSetores(data)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [empresaId])

  useEffect(() => {
    carregarSetores()
  }, [carregarSetores])

  const novoSetor = useCallback(
    async (dados: { nome: string; descricao?: string }) => {
      if (!empresaId) return
      await criarSetor(empresaId, dados)
      await carregarSetores()
    },
    [empresaId, carregarSetores]
  )

  const editarSetor = useCallback(
    async (setorId: string, dados: Partial<Setor>) => {
      if (!empresaId) return
      await atualizarSetor(empresaId, setorId, dados)
      await carregarSetores()
    },
    [empresaId, carregarSetores]
  )

  const desativarSetor = useCallback(
    async (setorId: string) => {
      if (!empresaId) return
      await inativarSetor(empresaId, setorId)
      await carregarSetores()
    },
    [empresaId, carregarSetores]
  )

  return {
    setores,
    carregando,
    erro,
    criarSetor: novoSetor,
    atualizarSetor: editarSetor,
    inativarSetor: desativarSetor,
    recarregar: carregarSetores,
  }
}
