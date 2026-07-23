import { useState } from 'react'
import { Plus, Pencil, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useSetores } from '@/hooks/useSetores'
import { useToast } from '@/components/ui/toast'
import { Layers } from 'lucide-react'
import type { Setor } from '@/types'

export function AbaSetores() {
  const { setores, carregando, criarSetor, atualizarSetor, inativarSetor } = useSetores()
  const { success, error: toastError } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Setor | null>(null)
  const [form, setForm] = useState({ nome: '', descricao: '' })
  const [inativarId, setInativarId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const abrirNovo = () => { setEditando(null); setForm({ nome: '', descricao: '' }); setShowModal(true) }
  const abrirEditar = (s: Setor) => { setEditando(s); setForm({ nome: s.nome, descricao: s.descricao ?? '' }); setShowModal(true) }

  const handleSalvar = async () => {
    if (!form.nome) return
    setSalvando(true)
    try {
      if (editando) {
        await atualizarSetor(editando.id, { nome: form.nome, descricao: form.descricao })
        success('Setor atualizado!')
      } else {
        await criarSetor({ nome: form.nome, descricao: form.descricao })
        success('Setor criado!')
      }
      setShowModal(false)
    } catch (e) { toastError('Erro ao salvar', (e as Error).message) }
    finally { setSalvando(false) }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Setores</h3>
          <p className="text-xs text-muted-foreground">Organize o atendimento por departamentos</p>
        </div>
        <Button variant="gradient" size="sm" className="gap-1.5" onClick={abrirNovo}>
          <Plus className="w-3.5 h-3.5" /> Novo Setor
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {carregando ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-48 ml-auto" />
              </div>
            ))}
          </div>
        ) : setores.length === 0 ? (
          <EmptyState icon={Layers} titulo="Nenhum setor" descricao="Crie setores para organizar sua equipe."
            acao={{ label: 'Criar Setor', onClick: abrirNovo }} />
        ) : (
          <div className="divide-y divide-border">
            {setores.map(s => (
              <div key={s.id} className={`flex items-center gap-3 p-4 ${!s.ativo ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{s.nome}</p>
                    {!s.ativo && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                  </div>
                  {s.descricao && <p className="text-xs text-muted-foreground mt-0.5">{s.descricao}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrirEditar(s)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {s.ativo && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setInativarId(s.id)}>
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
        title={editando ? 'Editar Setor' : 'Novo Setor'} size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome *</label>
            <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Vendas" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Descrição</label>
            <Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
              placeholder="Opcional" className="h-9 text-sm" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="gradient" size="sm" onClick={handleSalvar} disabled={!form.nome || salvando}>
              {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!inativarId} onClose={() => setInativarId(null)}
        onConfirm={async () => { if (inativarId) { await inativarSetor(inativarId); success('Setor inativado.') } setInativarId(null) }}
        title="Inativar Setor" message="O setor não estará disponível para novas conversas."
        confirmLabel="Inativar" danger />
    </div>
  )
}
