import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Clock,
  User, CheckCircle2, XCircle, RotateCcw, Edit2, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useAgenda } from '@/hooks/useAgenda'
import { useContatos } from '@/hooks/useContatos'
import { useMembros } from '@/hooks/useMembros'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import type { Agendamento, StatusAgendamento, TipoAgendamento } from '@/types'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

const statusConfig: Record<StatusAgendamento, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary'; cor: string }> = {
  agendado:   { label: 'Agendado',   variant: 'warning',     cor: 'bg-amber-500' },
  confirmado: { label: 'Confirmado', variant: 'success',     cor: 'bg-emerald-500' },
  cancelado:  { label: 'Cancelado',  variant: 'destructive', cor: 'bg-red-500' },
  concluido:  { label: 'Concluído',  variant: 'secondary',   cor: 'bg-zinc-500' },
}

const tipoConfig: Record<TipoAgendamento, string> = {
  reuniao: 'Reunião',
  demo:    'Demo',
  call:    'Call',
  outro:   'Outro',
}

function formatHora(data: Date): string {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function isMesmaData(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function AgendaNew() {
  const { membro } = useAuth()
  const { success, error: toastError } = useToast()

  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  const [mesAtual, setMesAtual] = useState(new Date())

  const { agendamentos, slotsLivres, carregando, criarAgendamento, atualizarAgendamento, excluirAgendamento } = useAgenda(dataSelecionada)
  const { contatos } = useContatos()
  const { membros } = useMembros()

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Agendamento | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    titulo: '',
    tipo: 'reuniao' as TipoAgendamento,
    contatoId: '',
    responsavelId: membro?.usuarioId ?? '',
    slotIdx: 0,
    duracaoMin: 60,
    observacoes: '',
  })

  const abrirNovo = () => {
    setEditando(null)
    setForm({ titulo: '', tipo: 'reuniao', contatoId: '', responsavelId: membro?.usuarioId ?? '', slotIdx: 0, duracaoMin: 60, observacoes: '' })
    setShowModal(true)
  }

  const abrirEditar = (ag: Agendamento) => {
    setEditando(ag)
    setShowModal(true)
  }

  const handleSalvar = async () => {
    if (!form.titulo) { toastError('Informe o título'); return }
    const slotSelecionado = slotsLivres[form.slotIdx]
    if (!slotSelecionado && !editando) { toastError('Selecione um horário disponível'); return }

    setSalvando(true)
    try {
      const contato = contatos.find(c => c.id === form.contatoId)
      if (editando) {
        await atualizarAgendamento(editando.id, {
          titulo: form.titulo,
          tipo: form.tipo,
          contatoId: form.contatoId || undefined,
          contatoNome: contato?.nome ?? '',
          responsavelId: form.responsavelId || undefined,
          duracaoMin: form.duracaoMin,
          observacoes: form.observacoes || undefined,
        })
        success('Agendamento atualizado!')
      } else {
        await criarAgendamento({
          titulo: form.titulo,
          tipo: form.tipo,
          contatoId: form.contatoId || undefined,
          contatoNome: contato?.nome ?? '',
          responsavelId: form.responsavelId || undefined,
          data: slotSelecionado,
          duracaoMin: form.duracaoMin,
          status: 'agendado',
          observacoes: form.observacoes || undefined,
        })
        success('Agendamento criado!')
      }
      setShowModal(false)
    } catch (e) {
      toastError('Erro ao salvar', (e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const handleStatus = async (id: string, status: StatusAgendamento) => {
    try {
      await atualizarAgendamento(id, { status })
      success(`Status atualizado: ${statusConfig[status].label}`)
    } catch { toastError('Erro ao atualizar status') }
  }

  const handleExcluir = async () => {
    if (!excluindoId) return
    try {
      await excluirAgendamento(excluindoId)
      success('Agendamento excluído.')
    } catch { toastError('Erro ao excluir') }
    finally { setExcluindoId(null) }
  }

  // Calendário mini
  const primeiroDiaDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1)
  const ultimoDiaDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0)
  const diasDoMes: (Date | null)[] = []

  for (let i = 0; i < primeiroDiaDoMes.getDay(); i++) diasDoMes.push(null)
  for (let d = 1; d <= ultimoDiaDoMes.getDate(); d++) {
    diasDoMes.push(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), d))
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* Sidebar calendário */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col bg-card/30 p-4 gap-4">
        {/* Navegação de mês */}
        <div className="flex items-center justify-between">
          <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold">
            {MESES[mesAtual.getMonth()]} {mesAtual.getFullYear()}
          </span>
          <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Grid dos dias */}
        <div className="grid grid-cols-7 gap-0.5">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d[0]}</div>
          ))}
          {diasDoMes.map((dia, i) => {
            if (!dia) return <div key={`empty-${i}`} />
            const isHoje = isMesmaData(dia, new Date())
            const isSelecionado = isMesmaData(dia, dataSelecionada)
            return (
              <button key={dia.toISOString()} onClick={() => setDataSelecionada(new Date(dia))}
                className={`w-full aspect-square rounded-lg text-xs font-medium transition-all ${
                  isSelecionado ? 'bg-primary text-primary-foreground'
                  : isHoje ? 'bg-primary/20 text-primary'
                  : 'hover:bg-accent text-foreground'
                }`}>
                {dia.getDate()}
              </button>
            )
          })}
        </div>

        {/* Slots livres */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Horários livres
          </p>
          {slotsLivres.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum horário disponível</p>
          ) : (
            <div className="space-y-1">
              {slotsLivres.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent/50 text-xs">
                  <Clock className="w-3 h-3 text-primary shrink-0" />
                  <span>{formatHora(slot)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button variant="gradient" size="sm" className="gap-1.5" onClick={abrirNovo}>
          <Plus className="w-3.5 h-3.5" /> Novo Agendamento
        </Button>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">
              {dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {agendamentos.length} agendamento{agendamentos.length !== 1 ? 's' : ''} neste dia
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => setDataSelecionada(new Date())}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => {
                const prev = new Date(dataSelecionada)
                prev.setDate(prev.getDate() - 1)
                setDataSelecionada(prev)
                setMesAtual(new Date(prev.getFullYear(), prev.getMonth()))
              }}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => {
                const next = new Date(dataSelecionada)
                next.setDate(next.getDate() + 1)
                setDataSelecionada(next)
                setMesAtual(new Date(next.getFullYear(), next.getMonth()))
              }}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Lista de agendamentos */}
        <div className="flex-1 overflow-y-auto p-6">
          {carregando ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : agendamentos.length === 0 ? (
            <EmptyState
              icon={Calendar}
              titulo="Nenhum agendamento"
              descricao={`Sem agendamentos para ${dataSelecionada.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}.`}
              acao={{ label: 'Novo Agendamento', onClick: abrirNovo }}
            />
          ) : (
            <div className="space-y-3">
              {agendamentos.map((ag, i) => {
                const cfg = statusConfig[ag.status]
                const hora = ag.data instanceof Date ? formatHora(ag.data) : '--:--'
                const horaFim = ag.data instanceof Date
                  ? formatHora(new Date(ag.data.getTime() + ag.duracaoMin * 60_000))
                  : '--:--'

                return (
                  <motion.div key={ag.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-4 bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:shadow-black/10 transition-all">
                    {/* Linha colorida de status */}
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${cfg.cor}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold">{ag.titulo}</p>
                        <Badge variant={cfg.variant} className="text-[10px] px-1.5 py-0">{cfg.label}</Badge>
                        <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded text-muted-foreground">
                          {tipoConfig[ag.tipo]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hora} – {horaFim} ({ag.duracaoMin}min)
                        </span>
                        {ag.contatoNome && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ag.contatoNome}
                          </span>
                        )}
                      </div>
                      {ag.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{ag.observacoes}</p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      {ag.status === 'agendado' && (
                        <button onClick={() => handleStatus(ag.id, 'confirmado')}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 text-muted-foreground transition-colors"
                          title="Confirmar">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {(ag.status === 'agendado' || ag.status === 'confirmado') && (
                        <button onClick={() => handleStatus(ag.id, 'concluido')}
                          className="p-1.5 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 text-muted-foreground transition-colors"
                          title="Concluir">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {ag.status !== 'cancelado' && ag.status !== 'concluido' && (
                        <button onClick={() => handleStatus(ag.id, 'cancelado')}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors"
                          title="Cancelar">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => abrirEditar(ag)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
                        title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setExcluindoId(ag.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors"
                        title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal criar/editar */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editando ? 'Editar Agendamento' : 'Novo Agendamento'} size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Título *</label>
            <Input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              placeholder="Ex: Reunião de apresentação" className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as TipoAgendamento }))}
                className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                {Object.entries(tipoConfig).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Duração (min)</label>
              <Input type="number" value={form.duracaoMin}
                onChange={e => setForm(p => ({ ...p, duracaoMin: Number(e.target.value) }))}
                className="h-9 text-sm" />
            </div>
          </div>
          {!editando && slotsLivres.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Horário disponível *</label>
              <select value={form.slotIdx} onChange={e => setForm(p => ({ ...p, slotIdx: Number(e.target.value) }))}
                className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                {slotsLivres.map((s, i) => (
                  <option key={i} value={i}>{formatHora(s)}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Contato</label>
            <select value={form.contatoId} onChange={e => setForm(p => ({ ...p, contatoId: e.target.value }))}
              className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Sem contato vinculado</option>
              {contatos.filter(c => c.ativo).map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Responsável</label>
            <select value={form.responsavelId} onChange={e => setForm(p => ({ ...p, responsavelId: e.target.value }))}
              className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              {membros.filter(m => m.ativo).map(m => (
                <option key={m.usuarioId} value={m.usuarioId}>{m.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
              rows={2} placeholder="Notas sobre o agendamento..."
              className="w-full text-sm bg-transparent border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="gradient" size="sm" onClick={handleSalvar} disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!excluindoId} onClose={() => setExcluindoId(null)}
        onConfirm={handleExcluir} title="Excluir Agendamento"
        message="Excluir este agendamento permanentemente?" confirmLabel="Excluir" danger />
    </motion.div>
  )
}
