import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MoreHorizontal, DollarSign, Calendar, Edit2, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'
import type { KanbanCard } from '@/types'

const priorityColors = { low: 'bg-zinc-500', medium: 'bg-amber-500', high: 'bg-red-500' }
const priorityLabel = { low: 'Baixa', medium: 'Média', high: 'Alta' }

const emptyCardForm = (): Omit<KanbanCard, 'id' | 'daysInStage'> => ({
  title: '', company: '', value: 0, responsible: 'AL', priority: 'medium', email: '', phone: '',
})

export function CRM() {
  const { kanbanColumns, moveCard, addKanbanCard, updateKanbanCard, deleteKanbanCard, addNotification } = useApp()
  const { success } = useToast()

  const [dragging, setDragging] = useState<{ cardId: string; fromColId: string } | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState<string | null>(null) // colId
  const [editCard, setEditCard] = useState<{ card: KanbanCard; colId: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ cardId: string; colId: string } | null>(null)
  const [cardForm, setCardForm] = useState(emptyCardForm())
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const dragCardRef = useRef<string | null>(null)

  const totalPipeline = kanbanColumns.flatMap(c => c.cards).reduce((s, c) => s + c.value, 0)
  const totalCards = kanbanColumns.flatMap(c => c.cards).length

  // ─── Drag handlers ───────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, cardId: string, fromColId: string) => {
    dragCardRef.current = cardId
    setDragging({ cardId, fromColId })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', cardId)
  }

  const handleDragEnd = () => {
    setDragging(null)
    setDragOverCol(null)
    dragCardRef.current = null
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colId)
  }

  const handleDrop = (e: React.DragEvent, toColId: string) => {
    e.preventDefault()
    if (!dragging) return
    if (dragging.fromColId !== toColId) {
      moveCard(dragging.cardId, dragging.fromColId, toColId)
      const toCol = kanbanColumns.find(c => c.id === toColId)
      addNotification({ title: 'Card movido', message: `Oportunidade movida para ${toCol?.title ?? toColId}.`, type: 'info' })
    }
    setDragging(null)
    setDragOverCol(null)
  }

  const openAdd = (colId: string) => {
    setCardForm(emptyCardForm())
    setShowAddModal(colId)
  }

  const openEdit = (card: KanbanCard, colId: string) => {
    setEditCard({ card, colId })
    setCardForm({ title: card.title, company: card.company, value: card.value, responsible: card.responsible, priority: card.priority, email: card.email ?? '', phone: card.phone ?? '' })
    setOpenMenu(null)
  }

  const handleSaveCard = () => {
    if (!cardForm.title) return
    if (editCard) {
      updateKanbanCard(editCard.card.id, editCard.colId, cardForm)
      success('Oportunidade atualizada!')
      setEditCard(null)
    } else if (showAddModal) {
      addKanbanCard(showAddModal, cardForm)
      setShowAddModal(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Pipeline Total', value: formatCurrency(totalPipeline), color: 'text-emerald-400' },
            { label: 'Oportunidades', value: totalCards, color: 'text-foreground' },
            { label: 'Colunas', value: kanbanColumns.length, color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-2">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <Button variant="gradient" size="sm" className="gap-1.5" onClick={() => openAdd(kanbanColumns[0]?.id ?? '')}>
          <Plus className="w-4 h-4" /> Nova Oportunidade
        </Button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full" style={{ minWidth: `${kanbanColumns.length * 272}px` }}>
          {kanbanColumns.map((column, colIdx) => {
            const colTotal = column.cards.reduce((s, c) => s + c.value, 0)
            const isOver = dragOverCol === column.id

            return (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: colIdx * 0.06 }}
                className="w-64 flex flex-col shrink-0"
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: column.color }} />
                    <span className="text-sm font-semibold">{column.title}</span>
                    <span className="w-5 h-5 rounded-full bg-accent text-xs flex items-center justify-center font-bold">
                      {column.cards.length}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openAdd(column.id)}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{formatCurrency(colTotal)}</p>

                {/* Drop zone */}
                <motion.div
                  animate={{ borderColor: isOver ? column.color + '80' : 'transparent', backgroundColor: isOver ? column.color + '08' : 'transparent' }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 space-y-2.5 overflow-y-auto rounded-xl border-2 border-dashed border-transparent transition-colors min-h-[120px] pb-2"
                >
                  <AnimatePresence>
                    {column.cards.map((card, cardIdx) => (
                      <motion.div
                        key={card.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: dragging?.cardId === card.id ? 0.4 : 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: cardIdx * 0.03 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e as any, card.id, column.id)}
                        onDragEnd={handleDragEnd}
                        whileHover={{ y: -2 }}
                        className="bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-border/60 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 group select-none"
                      >
                        {/* Priority + drag + menu */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityColors[card.priority]}`} />
                            <span className="text-[10px] text-muted-foreground">{priorityLabel[card.priority]}</span>
                          </div>
                          <div className="relative">
                            <Button
                              variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setOpenMenu(openMenu === card.id ? null : card.id)}
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                            <AnimatePresence>
                              {openMenu === card.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute right-0 top-6 z-20 bg-card border border-border rounded-lg shadow-xl w-32 overflow-hidden"
                                  >
                                    <button onClick={() => openEdit(card, column.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors">
                                      <Edit2 className="w-3 h-3" /> Editar
                                    </button>
                                    <button
                                      onClick={() => { setDeleteTarget({ cardId: card.id, colId: column.id }); setOpenMenu(null) }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-500/10 text-red-400 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" /> Excluir
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <p className="text-sm font-semibold mb-0.5 truncate">{card.title}</p>
                        <p className="text-xs text-muted-foreground mb-3 truncate">{card.company}</p>

                        <div className="flex items-center gap-1.5 mb-3">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-400">{formatCurrency(card.value)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/40 to-blue-500/40 flex items-center justify-center text-[9px] font-bold">
                            {card.responsible}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[10px]">{card.daysInStage}d</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Add placeholder */}
                  <button
                    onClick={() => openAdd(column.id)}
                    className="w-full py-2 border border-dashed border-border/50 rounded-xl text-xs text-muted-foreground hover:border-primary/40 hover:text-primary/70 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={!!showAddModal || !!editCard}
        onClose={() => { setShowAddModal(null); setEditCard(null) }}
        title={editCard ? 'Editar Oportunidade' : 'Nova Oportunidade'}
        size="md"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome do contato *</label>
            <Input value={cardForm.title} onChange={e => setCardForm(p => ({ ...p, title: e.target.value }))} placeholder="Nome completo" className="h-9 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Empresa</label>
            <Input value={cardForm.company} onChange={e => setCardForm(p => ({ ...p, company: e.target.value }))} placeholder="Nome da empresa" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Valor (R$)</label>
            <Input type="number" value={cardForm.value} onChange={e => setCardForm(p => ({ ...p, value: Number(e.target.value) }))} placeholder="50000" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Responsável</label>
            <select value={cardForm.responsible} onChange={e => setCardForm(p => ({ ...p, responsible: e.target.value }))}
              className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              {['AL', 'CR', 'PM', 'JS'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">E-mail</label>
            <Input value={cardForm.email ?? ''} onChange={e => setCardForm(p => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Prioridade</label>
            <select value={cardForm.priority} onChange={e => setCardForm(p => ({ ...p, priority: e.target.value as any }))}
              className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <Button variant="outline" size="sm" onClick={() => { setShowAddModal(null); setEditCard(null) }}>Cancelar</Button>
          <Button variant="gradient" size="sm" onClick={handleSaveCard} disabled={!cardForm.title}>
            {editCard ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) { deleteKanbanCard(deleteTarget.cardId, deleteTarget.colId); setDeleteTarget(null) }
        }}
        title="Excluir oportunidade"
        message="Tem certeza? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
      />
    </motion.div>
  )
}
