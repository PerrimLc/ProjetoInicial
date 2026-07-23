import { useAuth } from '@/hooks/useAuth'

export function usePermissao() {
  const { membro } = useAuth()
  const papel = membro?.papel

  return {
    podeGerenciarUsuarios: () => papel === 'administrador',
    podeVisualizarRelatorios: () => papel === 'administrador' || papel === 'supervisor',
    podeTransferirConversa: () => papel === 'administrador' || papel === 'supervisor',
    podeGerenciarEmpresa: () => papel === 'administrador',
    podeGerenciarConfiguracoes: () => papel === 'administrador',
  }
}
