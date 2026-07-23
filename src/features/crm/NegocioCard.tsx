import { useState } from 'react'
import {
  MoreHorizontal, Edit2, Trash2, TrendingUp, TrendingDown,
  GripVertical, DollarSign, Archive
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/ui/modal'
import { formatCurrency } from '@/lib/utils'
import type { Negocio } from '@/types'

const prioridadeCor: Record<string, string> = {
  baixa: 'bg-zinc-500',
  media: 'bg-amber-500',
  alta: 'bg-red-500',
}
const prioridadeLabel: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

interface NegocioCardProps {
  negocio: Negocio
  onEditar: (negocio: Negocio) => void
  onGanho: (id: string) => void
  onPerdido: (id: string) => void
  onArquivar: (id: string) => void
  onExcluir: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  isDragging?: boolean
}

export function NegocioCard({
  negocio,
  onEditar,
  onGanho,
  onPerdido,
  onArquivar,
  onExcluir,
  onDragStart,
  onDragEnd,
  isDragging,
}: NegocioCardProps) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [confirmarGanho, setConfirmarGanho] = useState(false)
  const [confirmarPerdido, setConfirmarPerdido] = useState(false)
  const [confirmarArquivar, setConfirmarArquivar] = useState(false)
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)

  return (
    <>
      <motion.div
        layout
        animate={{ opacity: isDragging ? 0.4 : 1 }}
        draggable
        onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, negocio.id)}
        onDragEnd={onDragEnd}
        whileHover={{ y: -2 }}
        className="bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-black/20 transition-all group select-none"
      >
        {/* Header: prioridade + menu */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span className={`w-1.5 h-1.5 rounded-full ${prioridadeCor[negocio.prioridade]}`} />
            <span className="text-[10px] text-muted-foreground">{prioridadeLabel[negocio.prioridade]}</span>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); setMenuAberto(!menuAberto) }}
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
            <AnimatePresence>
              {menuAberto && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-6 z-20 bg-card border border-border rounded-lg shadow-xl w-40 overflow-hidden"
                  >
                    <button
                      onClick={() => { onEditar(negocio); setMenuAberto(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={() => { setConfirmarGanho(true); setMenuAberto(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                    >
                      <TrendingUp className="w-3 h-3" /> Marcar Ganho
                    </button>
                    <button
                      onClick={() => { setConfirmarPerdido(true); setMenuAberto(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-orange-500/10 text-orange-400 transition-colors"
                    >
                      <TrendingDown className="w-3 h-3" /> Marcar Perdido
                    </button>
                    <button
                      onClick={() => { setConfirmarArquivar(true); setMenuAberto(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-500/10 text-blue-400 transition-colors border-t border-border"
                    >
                      <Archive className="w-3 h-3" /> Arquivar
                    </button>
                    <button
                      onClick={() => { setConfirmarExcluir(true); setMenuAberto(false) }}
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

        {/* Conteúdo */}
        <p className="text-sm font-semibold mb-0.5 truncate">{negocio.titulo}</p>
        <p className="text-xs text-muted-foreground mb-2 truncate">{negocio.contatoNome}</p>

        {(negocio.valor ?? 0) > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">{formatCurrency(negocio.valor ?? 0)}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {negocio.status !== 'aberto' && (
            <Badge
              variant={
                negocio.status === 'ganho' ? 'success'
                : negocio.status === 'perdido' ? 'destructive'
                : 'secondary'
              }
              className="text-[10px] px-1.5 py-0"
            >
              {negocio.status === 'ganho' ? 'Ganho'
                : negocio.status === 'perdido' ? 'Perdido'
                : 'Arquivado'}
            </Badge>
          )}
          {negocio.origem && (
            <span className="text-[10px] text-muted-foreground ml-auto truncate">{negocio.origem}</span>
          )}
        </div>
      </motion.div>

      <ConfirmModal
        open={confirmarGanho}
        onClose={() => setConfirmarGanho(false)}
        onConfirm={() => onGanho(negocio.id)}
        title="Marcar como Ganho"
        message={`Confirmar que "${negocio.titulo}" foi ganho?`}
        confirmLabel="Ganho!"
      />
      <ConfirmModal
        open={confirmarPerdido}
        onClose={() => setConfirmarPerdido(false)}
        onConfirm={() => onPerdido(negocio.id)}
        title="Marcar como Perdido"
        message={`Confirmar que "${negocio.titulo}" foi perdido?`}
        confirmLabel="Perdido"
        danger
      />
      <ConfirmModal
        open={confirmarArquivar}
        onClose={() => setConfirmarArquivar(false)}
        onConfirm={() => onArquivar(negocio.id)}
        title="Arquivar Negócio"
        message={`"${negocio.titulo}" será arquivado e poderá ser visualizado na aba Arquivo.`}
        confirmLabel="Arquivar"
      />
      <ConfirmModal
        open={confirmarExcluir}
        onClose={() => setConfirmarExcluir(false)}
        onConfirm={() => onExcluir(negocio.id)}
        title="Excluir Negócio"
        message={`Excluir "${negocio.titulo}" permanentemente? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
      />
    </>
  )
}
