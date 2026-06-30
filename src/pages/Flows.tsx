import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Play, Pause, GitBranch, MessageSquare, Clock, CheckCircle2, Zap, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/components/ui/toast'
import { defaultFlowNodes } from '@/data/mock'
import type { Flow, FlowNode } from '@/types'

const nodeIcons: Record<string, any> = {
  trigger: Zap, message: MessageSquare, wait: Clock,
  condition: GitBranch, agent: Play, end: CheckCircle2,
}

export function Flows() {
  const { flows, addFlow, updateFlow, deleteFlow, toggleFlowStatus } = useApp()
  const { success } = useToast()

  const [editingFlow, setEditingFlow] = useState<Flow | null>(null)
  const [newFlowName, setNewFlowName] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')

  // Use first flow's nodes for the visual editor, or defaultFlowNodes
  const editorFlow = editingFlow ?? flows[0]
  const canvasNodes: FlowNode[] = editorFlow?.nodes?.length > 0 ? editorFlow.nodes : defaultFlowNodes

  const handleAddFlow = () => {
    if (!newFlowName.trim()) return
    addFlow(newFlowName.trim())
    setNewFlowName('')
    setShowNewModal(false)
  }

  const handleSaveFlow = () => {
    if (!editorFlow) return
    updateFlow(editorFlow.id, { nodes: canvasNodes })
  }

  const handleToggle = (flow: Flow) => {
    toggleFlowStatus(flow.id)
    success(
      flow.status === 'active' ? 'Fluxo pausado' : 'Fluxo ativado!',
      flow.name
    )
  }

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
    const node = canvasNodes.find(n => n.id === nodeId)
    setEditingLabel(node?.label ?? '')
  }

  const handleLabelSave = () => {
    if (!editingFlow || !selectedNode) return
    const updatedNodes = canvasNodes.map(n =>
      n.id === selectedNode ? { ...n, label: editingLabel } : n
    )
    updateFlow(editingFlow.id, { nodes: updatedNodes })
    setSelectedNode(null)
  }

  const stats = {
    active: flows.filter(f => f.status === 'active').length,
    totalRuns: flows.reduce((s, f) => s + f.runs, 0),
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Stats + Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Fluxos Ativos', value: stats.active, color: 'text-emerald-400' },
            { label: 'Execuções Total', value: stats.totalRuns.toLocaleString(), color: 'text-blue-400' },
            { label: 'Fluxos Criados', value: flows.length, color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-2">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <Button variant="gradient" size="sm" className="gap-1.5" onClick={() => setShowNewModal(true)}>
          <Plus className="w-4 h-4" /> Novo Fluxo
        </Button>
      </div>

      {/* Visual Flow Canvas */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold">{editorFlow?.name ?? 'Selecione um fluxo'}</h3>
            <p className="text-xs text-muted-foreground">Editor visual — clique nos nós para editar o texto</p>
          </div>
          <div className="flex items-center gap-2">
            {editorFlow && (
              <>
                <Badge variant={editorFlow.status === 'active' ? 'success' : 'secondary'} className="text-xs">
                  {editorFlow.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleToggle(editorFlow)}>
                  {editorFlow.status === 'active'
                    ? <><Pause className="w-3 h-3" /> Pausar</>
                    : <><Play className="w-3 h-3" /> Ativar</>
                  }
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleSaveFlow}>
                  <Save className="w-3 h-3" /> Salvar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div
          className="relative overflow-auto bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]"
          style={{ height: 360 }}
        >
          {/* SVG connections */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#334155" />
              </marker>
            </defs>
            {[
              { x1: 148, y1: 180, x2: 272, y2: 115 },
              { x1: 148, y1: 180, x2: 272, y2: 255 },
              { x1: 348, y1: 100, x2: 472, y2: 170 },
              { x1: 348, y1: 265, x2: 472, y2: 195 },
              { x1: 560, y1: 170, x2: 672, y2: 100 },
              { x1: 560, y1: 192, x2: 672, y2: 265 },
              { x1: 760, y1: 95, x2: 872, y2: 95 },
              { x1: 760, y1: 265, x2: 872, y2: 265 },
            ].map((line, i) => (
              <line key={i} {...line} stroke="#334155" strokeWidth="1.5" markerEnd="url(#arrow)" />
            ))}
            <text x="610" y="148" fill="#6B7280" fontSize="10" textAnchor="middle">Sim</text>
            <text x="610" y="234" fill="#6B7280" fontSize="10" textAnchor="middle">Não</text>
          </svg>

          {/* Nodes */}
          {canvasNodes.map((node) => {
            const Icon = nodeIcons[node.type] ?? Zap
            const isSelected = selectedNode === node.id
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: canvasNodes.indexOf(node) * 0.05 }}
                whileHover={{ scale: 1.06, zIndex: 10 }}
                onClick={() => handleNodeClick(node.id)}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y - 30,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isSelected ? 10 : 1,
                }}
                className="cursor-pointer"
              >
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 shadow-lg bg-card min-w-[120px] transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  style={{
                    borderColor: node.color + '60',
                    boxShadow: `0 4px 20px ${node.color}20`,
                  }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: node.color + '20' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: node.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate max-w-[80px]">{node.label}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{node.type}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Hint */}
          <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground bg-card/80 px-2 py-1 rounded-lg border border-border">
            Clique nos nós para editar
          </div>
        </div>

        {/* Node edit bar */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border overflow-hidden"
            >
              <div className="p-3 flex items-center gap-3">
                <p className="text-xs text-muted-foreground shrink-0">Editar label:</p>
                <Input
                  value={editingLabel}
                  onChange={e => setEditingLabel(e.target.value)}
                  className="h-7 text-xs flex-1"
                  onKeyDown={e => e.key === 'Enter' && handleLabelSave()}
                  autoFocus
                />
                <Button size="sm" variant="gradient" className="h-7 text-xs" onClick={handleLabelSave}>
                  <Save className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedNode(null)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Flows list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Todos os Fluxos</h3>
        </div>
        {flows.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Nenhum fluxo criado. Clique em "Novo Fluxo" para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {flows.map((flow, i) => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer ${editingFlow?.id === flow.id ? 'bg-primary/5' : ''}`}
                onClick={() => setEditingFlow(flow)}
              >
                <div className={`w-2 h-8 rounded-full ${flow.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{flow.name}</p>
                  <p className="text-xs text-muted-foreground">Última execução: {flow.lastRun}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground shrink-0">
                  <div><p className="font-medium text-foreground">{flow.runs.toLocaleString()}</p><p>Execuções</p></div>
                  <div><p className="font-medium text-emerald-400">{flow.conversion}</p><p>Conversão</p></div>
                </div>
                <Badge variant={flow.status === 'active' ? 'success' : 'secondary'} className="text-xs shrink-0">
                  {flow.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={e => { e.stopPropagation(); handleToggle(flow) }}
                  >
                    {flow.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400"
                    onClick={e => { e.stopPropagation(); setDeleteId(flow.id) }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Flow Modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Criar Novo Fluxo" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome do Fluxo *</label>
            <Input
              value={newFlowName}
              onChange={e => setNewFlowName(e.target.value)}
              placeholder="Ex: Qualificação de Lead..."
              className="h-9 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleAddFlow()}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowNewModal(false)}>Cancelar</Button>
            <Button variant="gradient" size="sm" onClick={handleAddFlow} disabled={!newFlowName.trim()}>Criar Fluxo</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteFlow(deleteId); setDeleteId(null) } }}
        title="Excluir Fluxo"
        message="O fluxo será removido permanentemente."
        confirmLabel="Excluir"
        danger
      />
    </motion.div>
  )
}
