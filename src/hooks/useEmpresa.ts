import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { buscarEmpresa } from '@/services/empresas/empresaService'

export function useEmpresa() {
  const { empresa, membro, carregando } = useAuth()

  const recarregar = useCallback(async () => {
    if (!empresa?.id) return
    await buscarEmpresa(empresa.id)
  }, [empresa?.id])

  return { empresa, membro, carregando, recarregar }
}
