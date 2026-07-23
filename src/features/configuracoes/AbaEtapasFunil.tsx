import { useState } from 'react'
import { Plus, Pencil, PowerOff, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useEtapasFunil } from '@/hooks/useEtapasFunil'
import { useToast } from '@/components/ui/toast'
import { GitBranch } from 'lucide-react'
import type { EtapaFunil } from '@/types'

export function AbaEtapasFunil() {
  const { etapas, carregando, criarEtapa, atualizarEtapa, desativarEtapa } = useEtapasFunil()
  const { success, error: toastError } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<EtapaFunil | null>(null)
  const [nome, setNome] = useState('')
  const [desativarId, setDesativarId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const abrirNovo = () => { setEditando(null); setNome(''); setShowModal(true) }
  const abrirEditar = (e: EtapaFunil) => { setEditando(e); setNome(e.nome); setShowModal(true) }

  const handleSalvar = async () => {
    if (!nome.trim()) return
    setSalvando(true)
    try {
      if (editando) {
        await atualizarEtapa(editando.id, { nome: nome.trim() })
        success('Etapa atualizada!')
      } else {
        const maxOrdem = etapas.length > 0 ? Math.max(...etapas.map(e => e.ordem)) : 0
        await criarEtapa({ nome: nome.trim(), ordem: maxOrdem + 1 })
        success('Etapa criada!')
      }
      setShowModal(false)
    } catch (e) { toastError('Erro ao salvar', (e as Error).message) }
    finally { setSalvando(false) }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Etapas do Funil</h3>
          <p className="text-xs text-muted-foreground">Defina as etapas do seu pipeline de vendas</p>
        </div>
        <Button variant="gradient" size="sm" className="gap-1.5" onClick={abrirNovo}>
          <Plus className="w-3.5 h-3.5" /> Nova Etapa
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {carregando ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-4 w-6" /><Skeleton className="h-4 w-36" /><Skeleton className="h-4 w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : etapas.length === 0 ? (
          <EmptyState icon={GitBranch} titulo="Nenhuma etapa" descricao="Crie as etapas do funil de vendas."
            acao={{ label: 'Criar Etapa', onClick: abrirNovo }} />
        ) : (
          <div className="divide-y divide-border">
            {etapas.map(e => (
              <div key={e.id} className={`flex items-center gap-3 p-4 ${!e.ativo ? 'opacity-50' : ''}`}>
                <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                <span className="text-xs text-muted-foreground w-5 shrink-0">{e.ordem}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{e.nome}</p>
                    {!e.ativo && <Badge variant="secondary" className="text-[10px]">Inativa</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrirEditar(e)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {e.ativo && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setDesativarId(e.id)}>
                      <PowerOff className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editando ? 'Editar Etapa' : 'Nova Etapa'} size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome da Etapa *</label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Proposta Enviada" className="h-9 text-sm" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="gradient" size="sm" onClick={handleSalvar} disabled={!nome.trim() || salvando}>
              {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!desativarId} onClose={() => setDesativarId(null)}
        onConfirm={async () => { if (desativarId) { await desativarEtapa(desativarId); success('Etapa desativada.') } setDesativarId(null) }}
        title="Desativar Etapa" message="A etapa não aparecerá mais no Kanban. Negócios existentes são mantidos."
        confirmLabel="Desativar" danger />
    </div>
  )
}
