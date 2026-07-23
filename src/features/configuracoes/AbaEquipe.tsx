import { useState } from 'react'
import { UserPlus, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useMembros } from '@/hooks/useMembros'
import { useToast } from '@/components/ui/toast'
import type { PapelUsuario } from '@/types'



export function AbaEquipe() {
  const { membros, carregando, convidarMembro, alterarPapel, inativarMembro } = useMembros()
  const { success, error: toastError } = useToast()

  const [showConvite, setShowConvite] = useState(false)
  const [inativarId, setInativarId] = useState<string | null>(null)
  const [conviteForm, setConviteForm] = useState({ nome: '', email: '', papel: 'atendente' as PapelUsuario })
  const [salvando, setSalvando] = useState(false)

  const handleConvidar = async () => {
    if (!conviteForm.nome || !conviteForm.email) return
    setSalvando(true)
    try {
      await convidarMembro({
        usuarioId: `pending_${Date.now()}`,
        nome: conviteForm.nome,
        email: conviteForm.email,
        papel: conviteForm.papel,
        setorIds: [],
        ativo: true,
      })
      success('Membro adicionado!')
      setShowConvite(false)
      setConviteForm({ nome: '', email: '', papel: 'atendente' })
    } catch (e) {
      toastError('Erro ao convidar', (e as Error).message)
    } finally { setSalvando(false) }
  }

  const handleAlterarPapel = async (uid: string, papel: PapelUsuario) => {
    try {
      await alterarPapel(uid, papel)
      success('Papel atualizado!')
    } catch { toastError('Erro ao alterar papel') }
  }

  const handleInativar = async () => {
    if (!inativarId) return
    try {
      await inativarMembro(inativarId)
      success('Membro inativado.')
    } catch { toastError('Erro ao inativar') }
    finally { setInativarId(null) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Equipe</h3>
          <p className="text-xs text-muted-foreground">Gerencie os membros da sua empresa</p>
        </div>
        <Button variant="gradient" size="sm" className="gap-1.5" onClick={() => setShowConvite(true)}>
          <UserPlus className="w-3.5 h-3.5" /> Adicionar Membro
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {carregando ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : membros.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum membro cadastrado</p>
        ) : (
          <div className="divide-y divide-border">
            {membros.map(m => (
              <div key={m.usuarioId} className={`flex items-center gap-3 p-4 ${!m.ativo ? 'opacity-50' : ''}`}>
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-sm font-semibold">
                    {m.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{m.nome}</p>
                    {!m.ativo && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={m.papel} disabled={!m.ativo}
                    onChange={e => handleAlterarPapel(m.usuarioId, e.target.value as PapelUsuario)}
                    className="h-7 text-xs bg-transparent border border-border rounded-lg px-2 text-foreground focus:outline-none">
                    <option value="administrador">Administrador</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="atendente">Atendente</option>
                  </select>
                  {m.ativo && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setInativarId(m.usuarioId)}>
                      <UserX className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showConvite} onClose={() => setShowConvite(false)} title="Adicionar Membro" size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome *</label>
            <Input value={conviteForm.nome} onChange={e => setConviteForm(p => ({ ...p, nome: e.target.value }))}
              placeholder="Nome completo" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">E-mail *</label>
            <Input value={conviteForm.email} onChange={e => setConviteForm(p => ({ ...p, email: e.target.value }))}
              type="email" placeholder="email@empresa.com" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Papel</label>
            <select value={conviteForm.papel}
              onChange={e => setConviteForm(p => ({ ...p, papel: e.target.value as PapelUsuario }))}
              className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none">
              <option value="atendente">Atendente</option>
              <option value="supervisor">Supervisor</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowConvite(false)}>Cancelar</Button>
            <Button variant="gradient" size="sm" onClick={handleConvidar}
              disabled={!conviteForm.nome || !conviteForm.email || salvando}>
              {salvando ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!inativarId} onClose={() => setInativarId(null)}
        onConfirm={handleInativar} title="Inativar Membro"
        message="O membro perderá acesso ao sistema." confirmLabel="Inativar" danger />
    </div>
  )
}
