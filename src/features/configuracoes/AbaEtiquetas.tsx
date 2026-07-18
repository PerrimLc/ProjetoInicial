import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useEtiquetas } from '@/hooks/useEtiquetas'
import { useToast } from '@/components/ui/toast'
import { Tag } from 'lucide-react'

const coresPredefinidas = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

export function AbaEtiquetas() {
  const { etiquetas, carregando, criarEtiqueta, excluirEtiqueta } = useEtiquetas()
  const { success, error: toastError } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', cor: '#8B5CF6' })
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const handleCriar = async () => {
    if (!form.nome.trim()) return
    setSalvando(true)
    try {
      await criarEtiqueta({ nome: form.nome.trim(), cor: form.cor })
      success('Etiqueta criada!')
      setShowModal(false)
      setForm({ nome: '', cor: '#8B5CF6' })
    } catch (e) { toastError('Erro ao criar', (e as Error).message) }
    finally { setSalvando(false) }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Etiquetas</h3>
          <p className="text-xs text-muted-foreground">Categorize contatos e conversas com tags coloridas</p>
        </div>
        <Button variant="gradient" size="sm" className="gap-1.5" onClick={() => setShowModal(true)}>
          <Plus className="w-3.5 h-3.5" /> Nova Etiqueta
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {carregando ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        ) : etiquetas.length === 0 ? (
          <EmptyState icon={Tag} titulo="Nenhuma etiqueta" descricao="Crie etiquetas para organizar contatos e conversas."
            acao={{ label: 'Nova Etiqueta', onClick: () => setShowModal(true) }} />
        ) : (
          <div className="divide-y divide-border">
            {etiquetas.map(et => (
              <div key={et.id} className="flex items-center gap-3 p-4">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: et.cor }} />
                <p className="text-sm flex-1">{et.nome}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => setExcluirId(et.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Etiqueta" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome *</label>
            <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: VIP" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {coresPredefinidas.map(cor => (
                <button key={cor} onClick={() => setForm(p => ({ ...p, cor }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.cor === cor ? 'ring-2 ring-offset-2 ring-offset-card ring-white scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: cor }} />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="w-7 h-7 rounded-full shrink-0" style={{ backgroundColor: form.cor }} />
              <Input value={form.cor} onChange={e => setForm(p => ({ ...p, cor: e.target.value }))}
                placeholder="#8B5CF6" className="h-8 text-xs font-mono w-28" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="gradient" size="sm" onClick={handleCriar} disabled={!form.nome.trim() || salvando}>
              {salvando ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!excluirId} onClose={() => setExcluirId(null)}
        onConfirm={async () => { if (excluirId) { await excluirEtiqueta(excluirId); success('Etiqueta excluída.') } setExcluirId(null) }}
        title="Excluir Etiqueta" message="A etiqueta será removida permanentemente."
        confirmLabel="Excluir" danger />
    </div>
  )
}
