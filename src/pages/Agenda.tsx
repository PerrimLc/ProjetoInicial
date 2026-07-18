import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Video, Phone, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'

const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const hours = Array.from({ length: 10 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`)

interface CalendarEvent {
  id: string
  title: string
  time: string
  duration: number
  type: 'video' | 'call' | 'meeting'
  day: number
  color: string
  contact: string
}

const typeIcons = { video: Video, call: Phone, meeting: Users }
const typeColors = { video: '#8B5CF6', call: '#06B6D4', meeting: '#F59E0B' }
const typeLabels = { video: 'Videochamada', call: 'Ligação', meeting: 'Reunião' }

const initialEvents: CalendarEvent[] = [
  { id: '1', title: 'Demo — TechCorp', time: '09:00', duration: 60, type: 'video', day: 2, color: '#8B5CF6', contact: 'Rafael Mendes' },
  { id: '2', title: 'Follow-up Proposta', time: '10:30', duration: 30, type: 'call', day: 2, color: '#06B6D4', contact: 'Carolina Silva' },
  { id: '3', title: 'Reunião de Equipe', time: '14:00', duration: 60, type: 'meeting', day: 3, color: '#F59E0B', contact: 'Equipe Comercial' },
  { id: '4', title: 'Onboarding — Fortis', time: '11:00', duration: 90, type: 'video', day: 4, color: '#10B981', contact: 'Pedro Rodrigues' },
  { id: '5', title: 'Negociação — NextGen', time: '15:30', duration: 45, type: 'video', day: 4, color: '#EC4899', contact: 'Mariana Costa' },
  { id: '6', title: 'Qualificação Lead', time: '09:30', duration: 30, type: 'call', day: 5, color: '#8B5CF6', contact: 'Novo Lead' },
]

export function Agenda() {
  const { success } = useToast()
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [form, setForm] = useState({ title: '', contact: '', time: '09:00', duration: 60, type: 'video' as CalendarEvent['type'], day: 1 })

  const upcoming = events
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
    .slice(0, 5)

  const handleAddEvent = () => {
    if (!form.title) return
    const color = typeColors[form.type]
    const newEvent: CalendarEvent = { ...form, id: Math.random().toString(36).slice(2), color }
    setEvents(prev => [...prev, newEvent])
    success('Evento criado!', `${form.title} adicionado à agenda.`)
    setShowModal(false)
    setForm({ title: '', contact: '', time: '09:00', duration: 60, type: 'video', day: 1 })
  }

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    setSelectedEvent(null)
    success('Evento removido')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col p-4 gap-4 overflow-y-auto bg-card/20">
        {/* Mini calendar */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Junho 2024</span>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronLeft className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronRight className="w-3 h-3" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {days.map(d => (
              <div key={d} className="text-[10px] text-muted-foreground font-medium py-1">{d[0]}</div>
            ))}
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                className={`text-xs py-1 rounded-md transition-all font-medium ${
                  day === 23 ? 'bg-primary text-primary-foreground' :
                  events.some(e => e.day === (day % 7)) ? 'bg-primary/15 text-primary' :
                  'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próximos</h3>
            <Button variant="gradient" size="icon" className="h-6 w-6" onClick={() => setShowModal(true)}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          <div className="space-y-1.5">
            {upcoming.map((ev, i) => {
              const Icon = typeIcons[ev.type]
              return (
                <motion.button
                  key={ev.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full flex items-center gap-2 p-2 bg-accent/30 rounded-xl hover:bg-accent/60 transition-colors text-left group"
                >
                  <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{ev.title}</p>
                    <p className="text-[10px] text-muted-foreground">{days[ev.day]}, {ev.time}</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: ev.color + '20' }}>
                    <Icon className="w-3 h-3" style={{ color: ev.color }} />
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-wrap">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm font-semibold whitespace-nowrap">23 – 29 Jun, 2024</span>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Button variant="outline" size="sm" className="text-xs h-7">Hoje</Button>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-accent/50 rounded-lg p-0.5">
              {['Dia', 'Semana', 'Mês'].map((v, i) => (
                <button key={v} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${i === 1 ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{v}</button>
              ))}
            </div>
            <Button variant="gradient" size="sm" className="gap-1 text-xs h-8" onClick={() => setShowModal(true)}>
              <Plus className="w-3.5 h-3.5" /> Novo Evento
            </Button>
          </div>
        </div>

        {/* Week grid */}
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-[600px]">
            {/* Time column */}
            <div className="w-14 shrink-0 pt-10 border-r border-border/50">
              {hours.map(h => (
                <div key={h} className="h-16 flex items-start justify-end pr-2 pt-1">
                  <span className="text-[10px] text-muted-foreground/60">{h}</span>
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="flex-1 grid grid-cols-7">
              {days.map((day, dayIdx) => (
                <div key={day} className="border-r border-border/50 last:border-r-0">
                  {/* Day header */}
                  <div className={`h-10 flex flex-col items-center justify-center border-b border-border sticky top-0 z-10 bg-background/90 backdrop-blur-sm ${dayIdx === 0 ? 'bg-primary/5' : ''}`}>
                    <span className="text-[10px] text-muted-foreground">{day}</span>
                    <span className={`text-xs font-bold ${dayIdx === 0 ? 'text-primary' : ''}`}>{22 + dayIdx}</span>
                  </div>

                  {/* Time slots + events */}
                  <div className="relative">
                    {hours.map(h => (
                      <div
                        key={h}
                        onClick={() => { setForm(p => ({ ...p, day: dayIdx, time: h })); setShowModal(true) }}
                        className="h-16 border-b border-border/30 hover:bg-primary/5 transition-colors cursor-pointer"
                      />
                    ))}

                    {events.filter(e => e.day === dayIdx).map((ev) => {
                      const topOffset = (parseInt(ev.time.split(':')[0]) - 8) * 64 + (parseInt(ev.time.split(':')[1]) / 60) * 64
                      const height = (ev.duration / 60) * 64
                      return (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, scaleY: 0.8 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          whileHover={{ scale: 1.02, zIndex: 20 }}
                          onClick={() => setSelectedEvent(ev)}
                          style={{
                            position: 'absolute',
                            top: topOffset + 2,
                            left: 2, right: 2,
                            height: height - 4,
                            background: ev.color + '22',
                            borderLeft: `3px solid ${ev.color}`,
                            borderRadius: 8,
                            zIndex: 5,
                          }}
                          className="px-2 py-1 cursor-pointer overflow-hidden"
                        >
                          <p className="text-[10px] font-bold leading-tight truncate" style={{ color: ev.color }}>{ev.title}</p>
                          {height > 36 && <p className="text-[9px] text-muted-foreground">{ev.time}</p>}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Evento" size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Título *</label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Demo — Cliente X" className="h-9 text-sm" autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Contato</label>
            <Input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="Nome do contato" className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Dia da semana</label>
              <select value={form.day} onChange={e => setForm(p => ({ ...p, day: Number(e.target.value) }))} className="w-full h-9 text-sm px-2">
                {days.map((d, i) => <option key={d} value={i}>{d} {22 + i}/06</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Horário</label>
              <Input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Duração (min)</label>
              <Input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))} min={15} step={15} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tipo</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))} className="w-full h-9 text-sm px-2">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="gradient" size="sm" onClick={handleAddEvent} disabled={!form.title}>Criar Evento</Button>
          </div>
        </div>
      </Modal>

      {/* Event detail popover */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-2xl shadow-2xl w-72 overflow-hidden"
            >
              <div className="h-1.5 w-full" style={{ background: selectedEvent.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold">{selectedEvent.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedEvent.contact}</p>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <Badge variant="secondary" className="text-xs">{typeLabels[selectedEvent.type]}</Badge>
                  <span>{days[selectedEvent.day]}, {selectedEvent.time}</span>
                  <span>{selectedEvent.duration}min</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-7">Editar</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7 hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}>
                    Excluir
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
