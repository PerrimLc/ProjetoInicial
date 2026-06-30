import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, ChevronUp, ChevronDown,
  ArrowUpDown, Mail, Phone, Download, Edit2, Trash2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'
import type { Lead } from '@/types'

const statusConfig: Record<Lead['status'], { label: string; variant: any }> = {
  new: { label: 'Novo', variant: 'info' },
  qualified: { label: 'Qualificado', variant: 'purple' },
  proposal: { label: 'Proposta', variant: 'warning' },
  negotiation: { label: 'Negociação', variant: 'default' },
  closed: { label: 'Fechado', variant: 'success' },
  lost: { label: 'Perdido', variant: 'destructive' },
}

const sources = ['LinkedIn', 'Site', 'Indicação', 'Google Ads', 'Webinar', 'Cold Outreach', 'Instagram', 'Evento']
const responsibles = ['Ana Lima', 'Carlos Rocha', 'Pedro Matos', 'Julia Souza']

const emptyForm = (): Omit<Lead, 'id' | 'createdAt' | 'score'> => ({
  name: '', company: '', phone: '', email: '', source: 'LinkedIn',
  status: 'new', value: 0, responsible: 'Ana Lima',
})

export function Leads() {
  const { leads, addLead, updateLead, deleteLead } = useApp()
  const { success } = useToast()

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())

  const PER_PAGE = 8

  const filtered = leads
    .filter(l => {
      const q = search.toLowerCase()
      const matchSearch = !search || l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || l.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1
      if (sortBy === 'value') return (a.value - b.value) * mult
      if (sortBy === 'score') return (a.score - b.score) * mult
      if (sortBy === 'name') return a.name.localeCompare(b.name) * mult
      return 0
    })

  const pages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('desc') }
    setPage(1)
  }

  const openAdd = () => { setForm(emptyForm()); setEditingLead(null); setShowModal(true) }
  const openEdit = (lead: Lead) => { setEditingLead(lead); setForm({ name: lead.name, company: lead.company, phone: lead.phone, email: lead.email, source: lead.source, status: lead.status, value: lead.value, responsible: lead.responsible }); setShowModal(true) }

  const handleSave = () => {
    if (!form.name || !form.email) return
    if (editingLead) {
      updateLead(editingLead.id, form)
      success('Lead atualizado!')
    } else {
      addLead(form)
    }
    setShowModal(false)
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteLead(deleteId)
    setDeleteId(null)
  }

  const stats = {
    total: leads.length,
    pipeline: leads.reduce((s, l) => s + l.value, 0),
    closed: leads.filter(l => l.status === 'closed').length,
    conv: leads.length ? Math.round((leads.filter(l => l.status === 'closed').length / leads.length) * 100) : 0,
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Leads', value: stats.total, color: 'text-violet-400' },
          { label: 'Pipeline Total', value: formatCurrency(stats.pipeline), color: 'text-blue-400' },
          { label: 'Fechados', value: stats.closed, color: 'text-emerald-400' },
          { label: 'Conversão', value: `${stats.conv}%`, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar lead..." className="pl-9 h-8 text-xs" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-8 text-xs bg-accent border border-border rounded-lg px-2 text-foreground focus:outline-none">
            <option value="all">Todos status</option>
            {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"><Download className="w-3.5 h-3.5" /> Exportar</Button>
          <Button size="sm" variant="gradient" className="h-8 text-xs gap-1.5 ml-auto" onClick={openAdd}>
            <Plus className="w-3.5 h-3.5" /> Novo Lead
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[{ key: 'name', label: 'Nome / Empresa' }, { key: 'phone', label: 'Contato' }, { key: 'source', label: 'Origem' }, { key: 'status', label: 'Status' }, { key: 'value', label: 'Valor Est.' }, { key: 'score', label: 'Score' }, { key: 'responsible', label: 'Responsável' }, { key: 'actions', label: '' }].map(col => (
                  <th key={col.key} className="text-left px-4 py-3">
                    <button onClick={() => ['name', 'value', 'score'].includes(col.key) && handleSort(col.key)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                      {col.label}
                      {['name', 'value', 'score'].includes(col.key) && (
                        sortBy === col.key
                          ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          : <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">Nenhum lead encontrado</td></tr>
              )}
              {paginated.map((lead, i) => (
                <motion.tr key={lead.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                          {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="text-xs flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" />{lead.phone}</p>
                      <p className="text-xs flex items-center gap-1 text-muted-foreground"><Mail className="w-3 h-3" />{lead.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-accent">{lead.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusConfig[lead.status].variant}>{statusConfig[lead.status].label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(lead.value)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden w-16">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${lead.score}%` }} />
                      </div>
                      <span className="text-xs font-medium w-8">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 flex items-center justify-center text-[10px] font-bold">
                        {lead.responsible.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs text-muted-foreground">{lead.responsible}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lead)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400" onClick={() => setDeleteId(lead.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Mostrando {Math.min(paginated.length, PER_PAGE)} de {filtered.length} leads</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingLead ? 'Editar Lead' : 'Novo Lead'} size="md">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Nome *', key: 'name', type: 'text', placeholder: 'Nome completo' },
            { label: 'Empresa', key: 'company', type: 'text', placeholder: 'Nome da empresa' },
            { label: 'E-mail *', key: 'email', type: 'email', placeholder: 'email@empresa.com' },
            { label: 'Telefone', key: 'phone', type: 'text', placeholder: '+55 11 99999-9999' },
            { label: 'Valor Estimado (R$)', key: 'value', type: 'number', placeholder: '50000' },
          ].map(f => (
            <div key={f.key} className={f.key === 'email' || f.key === 'name' ? '' : ''}>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">{f.label}</label>
              <Input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} className="h-9 text-sm" />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Origem</label>
            <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))} className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Responsável</label>
            <select value={form.responsible} onChange={e => setForm(p => ({ ...p, responsible: e.target.value }))} className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              {responsibles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="gradient" size="sm" onClick={handleSave} disabled={!form.name || !form.email}>
            {editingLead ? 'Salvar Alterações' : 'Adicionar Lead'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Excluir Lead" message="Tem certeza? Esta ação não pode ser desfeita." confirmLabel="Excluir" danger />
    </motion.div>
  )
}
