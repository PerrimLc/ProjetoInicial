import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, LayoutGrid, Archive, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { NegocioCard } from '@/features/crm/NegocioCard'
import { NegocioForm, type NegocioFormData } from '@/features/crm/NegocioForm'
import { useEtapasFunil } from '@/hooks/useEtapasFunil'
import { useNegocios } from '@/hooks/useNegocios'
import { useContatos } from '@/hooks/useContatos'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'
import type { Negocio } from '@/types'

type Aba = 'kanban' | 'arquivo'

export function CRM() {
  const { success, error: toastError } = useToast()
  const { etapas, carregando: carregandoEtapas } = useEtapasFunil()
  const {
    negocios,
    carregando: carregandoNegocios,
    criarNegocio,
    atualizarNegocio,
    moverNegocio,
    marcarGanho,
    marcarPerdido,
    arquivarNegocio,
    excluirNegocio,
  } = useNegocios()
  const { contatos } = useContatos()

  const [aba, setAba] = useState<Aba>('kanban')
  const [busca, setBusca] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverEtapaId, setDragOverEtapaId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Negocio | null>(null)
  const [etapaIdModal, setEtapaIdModal] = useState<string>('')
  const [salvando, setSalvando] = useState(false)
  const [restaurandoId, setRestandoId] = useState<string | null>(null)

  // ── Filtros ───────────────────────────────────────────────
  const negociosKanban = negocios.filter((n) => {
    if (n.status !== 'aberto') return false
    if (!busca) return true
    const q = busca.toLowerCase()
    return n.titulo.toLowerCase().includes(q) || n.contatoNome.toLowerCase().includes(q)
  })

  const negociosArquivo = negocios.filter((n) => {
    if (n.status === 'aberto') return false
    if (!busca) return true
    const q = busca.toLowerCase()
    return n.titulo.toLowerCase().includes(q) || n.contatoNome.toLowerCase().includes(q)
  })

  const negociosPorEtapa = (etapaId: string) =>
    negociosKanban.filter((n) => n.etapaId === etapaId)

  const totalPipeline = negociosKanban.reduce((s, n) => s + (n.valor ?? 0), 0)

  // ── Drag & Drop ───────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverEtapaId(null)
  }

  const handleDragOver = (e: React.DragEvent, etapaId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverEtapaId(etapaId)
  }

  const handleDrop = async (e: React.DragEvent, toEtapaId: string) => {
    e.preventDefault()
    if (!draggingId) return
    const negocio = negocios.find((n) => n.id === draggingId)
    if (negocio && negocio.etapaId !== toEtapaId) {
      try {
        await moverNegocio(draggingId, toEtapaId)
        success('Negócio movido!')
      } catch {
        toastError('Erro ao mover negócio')
      }
    }
    setDraggingId(null)
    setDragOverEtapaId(null)
  }

  // ── CRUD ──────────────────────────────────────────────────
  const handleSalvar = async (dados: NegocioFormData) => {
    setSalvando(true)
    try {
      const contato = contatos.find((c) => c.id === dados.contatoId)
      if (editando) {
        await atualizarNegocio(editando.id, { ...dados, contatoNome: contato?.nome ?? '' })
        success('Negócio atualizado!')
      } else {
        await criarNegocio({
          ...dados,
          contatoNome: contato?.nome ?? '',
          status: 'aberto',
          valor: dados.valor ?? 0,
        })
        success('Negócio criado!')
      }
      setShowModal(false)
      setEditando(null)
    } catch (e) {
      toastError('Erro ao salvar', (e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const openAdicionar = (etapaId: string) => {
    setEditando(null)
    setEtapaIdModal(etapaId)
    setShowModal(true)
  }

  const openEditar = (negocio: Negocio) => {
    setEditando(negocio)
    setEtapaIdModal(negocio.etapaId)
    setShowModal(true)
  }

  const handleGanho = async (id: string) => {
    try { await marcarGanho(id); success('Negócio ganho!') }
    catch { toastError('Erro ao marcar como ganho') }
  }

  const handlePerdido = async (id: string) => {
    try { await marcarPerdido(id); success('Negócio marcado como perdido.') }
    catch { toastError('Erro ao marcar como perdido') }
  }

  const handleArquivar = async (id: string) => {
    try { await arquivarNegocio(id); success('Negócio arquivado.') }
    catch { toastError('Erro ao arquivar') }
  }

  const handleExcluir = async (id: string) => {
    try { await excluirNegocio(id); success('Negócio excluído.') }
    catch { toastError('Erro ao excluir') }
  }

  const handleRestaurar = async (id: string) => {
    try {
      await atualizarNegocio(id, { status: 'aberto' })
      success('Negócio restaurado para o Kanban!')
      setRestandoId(null)
    } catch { toastError('Erro ao restaurar') }
  }

  const carregando = carregandoEtapas || carregandoNegocios

  // ── Status label/badge ────────────────────────────────────
  const statusInfo = (status: string) => {
    if (status === 'ganho') return { label: 'Ganho', variant: 'success' as const }
    if (status === 'perdido') return { label: 'Perdido', variant: 'destructive' as const }
    return { label: 'Arquivado', variant: 'secondary' as const }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 flex-nowrap sm:flex-wrap">
          {[
            { label: 'Pipeline Total', value: formatCurrency(totalPipeline), color: 'text-emerald-400' },
            { label: 'Abertos', value: negociosKanban.length, color: 'text-foreground' },
            { label: 'Ganhos', value: negocios.filter((n) => n.status === 'ganho').length, color: 'text-violet-400' },
            { label: 'Arquivados', value: negociosArquivo.length, color: 'text-blue-400' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-2">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar negócio..."
              className="pl-8 h-8 text-xs w-48"
            />
          </div>
          {aba === 'kanban' && (
            <Button variant="gradient" size="sm" className="gap-1.5" onClick={() => openAdicionar(etapas[0]?.id ?? '')}>
              <Plus className="w-4 h-4" /> Novo Negócio
            </Button>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-border">
        {([
          { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
          { id: 'arquivo', label: `Arquivo (${negociosArquivo.length})`, icon: Archive },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              aba === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {aba === 'kanban' ? (
            <motion.div
              key="kanban"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 h-full"
            >
              {carregando ? (
                <div className="flex gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-64 shrink-0 space-y-3">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-24 w-full rounded-xl" />
                      <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex gap-4 h-full"
                  style={{ minWidth: `${etapas.filter((e) => e.ativo).length * 272}px` }}
                >
                  {etapas.filter((e) => e.ativo).map((etapa, idx) => {
                    const itens = negociosPorEtapa(etapa.id)
                    const total = itens.reduce((s, n) => s + (n.valor ?? 0), 0)
                    const isOver = dragOverEtapaId === etapa.id

                    return (
                      <motion.div
                        key={etapa.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="w-64 flex flex-col shrink-0"
                        onDragOver={(e) => handleDragOver(e, etapa.id)}
                        onDrop={(e) => handleDrop(e, etapa.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                            <span className="text-sm font-semibold truncate">{etapa.nome}</span>
                            <span className="w-5 h-5 rounded-full bg-accent text-xs flex items-center justify-center font-bold">
                              {itens.length}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openAdicionar(etapa.id)}>
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{formatCurrency(total)}</p>

                        <div
                          className={`flex-1 space-y-2.5 overflow-y-auto rounded-xl border-2 border-dashed transition-all min-h-[120px] pb-2 ${
                            isOver ? 'border-violet-500/50 bg-violet-500/5' : 'border-transparent'
                          }`}
                        >
                          {itens.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <p className="text-xs text-muted-foreground">Sem negócios</p>
                              <button
                                onClick={() => openAdicionar(etapa.id)}
                                className="mt-2 text-xs text-primary hover:underline"
                              >
                                + Adicionar
                              </button>
                            </div>
                          ) : (
                            itens.map((negocio) => (
                              <NegocioCard
                                key={negocio.id}
                                negocio={negocio}
                                onEditar={openEditar}
                                onGanho={handleGanho}
                                onPerdido={handlePerdido}
                                onArquivar={handleArquivar}
                                onExcluir={handleExcluir}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                isDragging={draggingId === negocio.id}
                              />
                            ))
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            /* ── Aba Arquivo ── */
            <motion.div
              key="arquivo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              {carregando ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : negociosArquivo.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Archive className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold mb-1">Arquivo vazio</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Negócios arquivados, ganhos e perdidos aparecem aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {negociosArquivo.map((n, i) => {
                    const info = statusInfo(n.status)
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-3 hover:bg-accent/20 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{n.titulo}</p>
                            <Badge variant={info.variant} className="text-[10px] px-1.5 py-0">
                              {info.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{n.contatoNome}</p>
                        </div>

                        {(n.valor ?? 0) > 0 && (
                          <p className="text-sm font-semibold text-emerald-400 shrink-0">
                            {formatCurrency(n.valor ?? 0)}
                          </p>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Restaurar para o Kanban */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-violet-500/10 hover:text-violet-400"
                            title="Restaurar para o Kanban"
                            onClick={() => setRestandoId(n.id)}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                          {/* Excluir permanente */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                            title="Excluir permanentemente"
                            onClick={() => handleExcluir(n.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal cadastro/edição */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditando(null) }}
        title={editando ? 'Editar Negócio' : 'Novo Negócio'}
        size="md"
      >
        <NegocioForm
          negocio={editando ?? undefined}
          etapas={etapas}
          etapaIdInicial={etapaIdModal}
          onSalvar={handleSalvar}
          onCancelar={() => { setShowModal(false); setEditando(null) }}
          salvando={salvando}
        />
      </Modal>

      {/* Confirmar restaurar */}
      <ConfirmModal
        open={!!restaurandoId}
        onClose={() => setRestandoId(null)}
        onConfirm={() => restaurandoId && handleRestaurar(restaurandoId)}
        title="Restaurar Negócio"
        message="O negócio voltará para o Kanban como 'Aberto'. Deseja continuar?"
        confirmLabel="Restaurar"
      />
    </motion.div>
  )
}
