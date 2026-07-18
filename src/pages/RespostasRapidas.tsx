import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Zap, Edit2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useRespostasRapidas } from '@/hooks/useRespostasRapidas'
import { useToast } from '@/components/ui/toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { RespostaRapida } from '@/types'

const schema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  atalho: z.string().min(2, 'Atalho deve ter pelo menos 2 caracteres').refine(
    v => v.startsWith('/'), 'Atalho deve começar com /'
  ),
  mensagem: z.string().min(1, 'Mensagem obrigatória'),
})
type FormData = z.infer<typeof schema>

export function RespostasRapidas() {
  const { success, error: toastError } = useToast()
  const {
    respostas, carregando, busca, setBusca,
    criarRespostaRapida, atualizarRespostaRapida, ativar, inativar,
  } = useRespostasRapidas()

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<RespostaRapida | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { titulo: '', atalho: '/', mensagem: '' },
  })

  const abrirNovo = () => {
    setEditando(null)
    reset({ titulo: '', atalho: '/', mensagem: '' })
    setShowModal(true)
  }

  const abrirEditar = (rr: RespostaRapida) => {
    setEditando(rr)
    reset({ titulo: rr.titulo, atalho: rr.atalho, mensagem: rr.mensagem })
    setShowModal(true)
  }

  const onSubmit = async (dados: FormData) => {
    setSalvando(true)
    try {
      if (editando) {
        await atualizarRespostaRapida(editando.id, dados)
        success('Resposta atualizada!')
      } else {
        await criarRespostaRapida({ ...dados, ativa: true })
        success('Resposta criada!')
      }
      setShowModal(false)
    } catch (e) {
      toastError('Erro ao salvar', (e as Error).message)
    } finally { setSalvando(false) }
  }

  const handleToggle = async (rr: RespostaRapida) => {
    try {
      if (rr.ativa) { await inativar(rr.id); success('Resposta inativada.') }
      else { await ativar(rr.id); success('Resposta ativada!') }
    } catch { toastError('Erro ao alterar status') }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Respostas Rápidas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Digite <code className="bg-accent px-1 rounded text-primary">/</code> no chat para usar os atalhos
          </p>
        </div>
        <Button variant="gradient" size="sm" className="gap-1.5" onClick={abrirNovo}>
          <Plus className="w-3.5 h-3.5" /> Nova Resposta
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por título ou atalho..." className="pl-9 h-9 text-sm" />
      </div>

      {/* Lista */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {carregando ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <Skeleton className="h-8 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : respostas.length === 0 ? (
          <EmptyState icon={Zap} titulo="Nenhuma resposta rápida"
            descricao="Crie atalhos para agilizar o atendimento. Digite '/' no chat para usá-los."
            acao={{ label: 'Criar primeira resposta', onClick: abrirNovo }} />
        ) : (
          <div className="divide-y divide-border">
            {respostas.map((rr, i) => (
              <motion.div key={rr.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-start gap-4 p-4 hover:bg-accent/20 transition-colors ${!rr.ativa ? 'opacity-50' : ''}`}>
                <div className="shrink-0 mt-0.5">
                  <code className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-lg">
                    {rr.atalho}
                  </code>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{rr.titulo}</p>
                    <Badge variant={rr.ativa ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      {rr.ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{rr.mensagem}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggle(rr)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-accent"
                    title={rr.ativa ? 'Inativar' : 'Ativar'}>
                    {rr.ativa
                      ? <ToggleRight className="w-5 h-5 text-primary" />
                      : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(rr)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => setExcluindoId(rr.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editando ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Título *</label>
              <Input {...register('titulo')} placeholder="Ex: Saudação inicial" className="h-9 text-sm" />
              {errors.titulo && <p className="text-xs text-red-400 mt-1">{errors.titulo.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Atalho * <span className="text-muted-foreground font-normal">(começa com /)</span>
              </label>
              <Input {...register('atalho')} placeholder="/oi" className="h-9 text-sm font-mono" />
              {errors.atalho && <p className="text-xs text-red-400 mt-1">{errors.atalho.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Mensagem *</label>
            <textarea {...register('mensagem')} rows={4}
              placeholder="Texto que será inserido no chat ao selecionar este atalho..."
              className="w-full text-sm bg-transparent border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            {errors.mensagem && <p className="text-xs text-red-400 mt-1">{errors.mensagem.message}</p>}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" variant="gradient" size="sm" disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!excluindoId} onClose={() => setExcluindoId(null)}
        onConfirm={async () => {
          if (excluindoId) {
            await inativar(excluindoId)
            success('Resposta removida.')
            setExcluindoId(null)
          }
        }}
        title="Remover Resposta" message="A resposta ficará inativa e não aparecerá no chat."
        confirmLabel="Remover" danger />
    </motion.div>
  )
}
