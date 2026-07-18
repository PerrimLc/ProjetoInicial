import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  listarMembros,
  criarMembro,
  atualizarPapel,
  inativarMembro,
} from '@/services/empresas/membroService'
import type { MembroEmpresa, PapelUsuario } from '@/types'

export function useMembros() {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [membros, setMembros] = useState<MembroEmpresa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarMembros = useCallback(async () => {
    if (!empresaId) {
      setMembros([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const data = await listarMembros(empresaId)
      setMembros(data)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [empresaId])

  useEffect(() => {
    carregarMembros()
  }, [carregarMembros])

  const convidarMembro = useCallback(
    async (dados: Omit<MembroEmpresa, 'criadoEm'>) => {
      if (!empresaId) return
      await criarMembro(empresaId, dados)
      await carregarMembros()
    },
    [empresaId, carregarMembros]
  )

  const alterarPapel = useCallback(
    async (uid: string, papel: PapelUsuario) => {
      if (!empresaId) return
      await atualizarPapel(empresaId, uid, papel)
      await carregarMembros()
    },
    [empresaId, carregarMembros]
  )

  const removerMembro = useCallback(
    async (uid: string) => {
      if (!empresaId) return
      await inativarMembro(empresaId, uid)
      await carregarMembros()
    },
    [empresaId, carregarMembros]
  )

  return {
    membros,
    carregando,
    erro,
    convidarMembro,
    alterarPapel,
    inativarMembro: removerMembro,
    recarregar: carregarMembros,
  }
}
