import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Copy, Trash2, Edit2, MessageSquare, Zap, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StatusDot } from '@/components/ui/status-dot'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/components/ui/toast'
import { formatNumber } from '@/lib/utils'
import type { Agent } from '@/types'

const models = ['GPT-4o', 'GPT-4o Mini', 'Claude 3.5 Sonnet', 'Claude 3 Haiku', 'Gemini Pro']
const colors = ['#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EC4899', '#F97316', '#3B82F6', '#EF4444']

const emptyForm = () => ({
  name: '', description: '', model: 'GPT-4o', temperature: 0.7,
  status: 'inactive' as Agent['status'], color: '#8B5CF6', prompt: '',
})

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export function Agents() {
  const { agents, addAgent, updateAgent, deleteAgent, duplicateAgent } = useApp()
  const { success } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())

  const openAdd = () => { setForm(emptyForm()); setEditingAgent(null); setShowModal(true) }
  const openEdit = (a: Agent) => {
    setEditingAgent(a)
    setForm({ name: a.name, description: a.description, model: a.model, temperature: a.temperature, status: a.status, color: a.color, prompt: a.prompt ?? '' })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name) return
    if (editingAgent) { updateAgent(editingAgent.id, form); success('Agente atualizado!') }
    else addAgent(form)
    setShowModal(false)
  }

  const toggleStatus = (a: Agent) => {
    const newStatus = a.status === 'active' ? 'inactive' : 'active'
    updateAgent(a.id, { status: newStatus })
    success(newStatus === 'active' ? `${a.name} ativado!` : `${a.name} desativado`)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground text-sm">
          {agents.filter(a => a.status === 'active').length} ativos · {agents.length} total
        </p>
        <Button variant="gradient" size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Criar Novo Agente
        </Button>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {agents.map(agent => (
          <motion.div key={agent.id} variants={item} whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-black/30 transition-all duration-300 group">
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${agent.color}, ${agent.color}88)` }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${agent.color}, ${agent.color}aa)` }}>
                    {agent.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">{agent.model}</p>
                  </div>
                </div>
                <StatusDot status={agent.status} showLabel />
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{agent.description}</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-accent/50 rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground mb-1">Temperatura</p>
                  <div className="flex items-center gap-2">
                    <Progress value={agent.temperature * 100} className="flex-1 h-1" />
                    <span className="text-xs font-medium">{agent.temperature}</span>
                  </div>
                </div>
                <div className="bg-accent/50 rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Conversas</p>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium">{formatNumber(agent.conversations)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 py-3 border-y border-border mb-4">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium">
                  {agent.status === 'active' ? 'Online agora' : agent.status === 'training' ? 'Em treinamento...' : 'Offline'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => openEdit(agent)}>
                  <Edit2 className="w-3 h-3" /> Editar
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-400" onClick={() => duplicateAgent(agent.id)}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${agent.status === 'active' ? 'hover:bg-amber-500/10 hover:text-amber-400' : 'hover:bg-emerald-500/10 hover:text-emerald-400'}`}
                  onClick={() => toggleStatus(agent)}>
                  <Power className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400" onClick={() => setDeleteId(agent.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add Card */}
        <motion.div variants={item} whileHover={{ y: -4 }} onClick={openAdd}
          className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">Criar Novo Agente</p>
            <p className="text-xs text-muted-foreground mt-1">Configure um agente personalizado</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingAgent ? 'Editar Agente' : 'Novo Agente'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome do Agente *</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Aria, Max, Luna..." className="h-9 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Descrição</label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descreva o propósito do agente..." className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Modelo de IA</label>
              <select value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Temperatura: {form.temperature}</label>
              <input type="range" min={0} max={1} step={0.1} value={form.temperature}
                onChange={e => setForm(p => ({ ...p, temperature: Number(e.target.value) }))}
                className="w-full accent-violet-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Prompt Base</label>
              <textarea value={form.prompt} onChange={e => setForm(p => ({ ...p, prompt: e.target.value }))}
                placeholder="Você é um assistente especializado em..."
                rows={3} className="w-full text-sm bg-transparent border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">Cor do Agente</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                    className={`w-7 h-7 rounded-lg transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-offset-card ring-white/30' : 'hover:scale-110'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="gradient" size="sm" onClick={handleSave} disabled={!form.name}>
              {editingAgent ? 'Salvar' : 'Criar Agente'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deleteAgent(deleteId); setDeleteId(null) }}
        title="Excluir Agente" message="Tem certeza? Esta ação não pode ser desfeita." confirmLabel="Excluir" danger />
    </motion.div>
  )
}
