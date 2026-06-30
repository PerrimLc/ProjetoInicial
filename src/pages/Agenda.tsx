import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Video, Phone, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const hours = Array.from({ length: 10 }, (_, i) => `${i + 8}:00`)

const events = [
  { id: '1', title: 'Demo — TechCorp', time: '09:00', duration: 60, type: 'video', day: 2, color: '#8B5CF6', contact: 'Rafael Mendes' },
  { id: '2', title: 'Follow-up Proposta', time: '10:30', duration: 30, type: 'call', day: 2, color: '#06B6D4', contact: 'Carolina Silva' },
  { id: '3', title: 'Reunião de Equipe', time: '14:00', duration: 60, type: 'meeting', day: 3, color: '#F59E0B', contact: 'Equipe Comercial' },
  { id: '4', title: 'Onboarding — Fortis', time: '11:00', duration: 90, type: 'video', day: 4, color: '#10B981', contact: 'Pedro Rodrigues' },
  { id: '5', title: 'Negociação — NextGen', time: '15:30', duration: 45, type: 'video', day: 4, color: '#EC4899', contact: 'Mariana Costa' },
  { id: '6', title: 'Qualificação Lead', time: '09:30', duration: 30, type: 'call', day: 5, color: '#8B5CF6', contact: 'Novo Lead' },
]

const typeIcons = { video: Video, call: Phone, meeting: Users }

const upcomingEvents = [
  { title: 'Demo — TechCorp', time: 'Hoje, 09:00', type: 'video', contact: 'Rafael Mendes', color: '#8B5CF6' },
  { title: 'Follow-up Proposta', time: 'Hoje, 10:30', type: 'call', contact: 'Carolina Silva', color: '#06B6D4' },
  { title: 'Reunião de Equipe', time: 'Amanhã, 14:00', type: 'meeting', contact: 'Equipe Comercial', color: '#F59E0B' },
  { title: 'Onboarding — Fortis', time: 'Qui, 11:00', type: 'video', contact: 'Pedro Rodrigues', color: '#10B981' },
]

export function Agenda() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col p-4 gap-4 overflow-y-auto">
        {/* Mini calendar */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Junho 2024</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronLeft className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronRight className="w-3 h-3" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map(d => (
              <div key={d} className="text-[10px] text-muted-foreground font-medium py-1">{d[0]}</div>
            ))}
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                className={`text-xs py-1 rounded-lg transition-colors font-medium ${
                  day === 23 ? 'bg-primary text-primary-foreground' :
                  [15, 20, 22].includes(day) ? 'bg-primary/20 text-primary' :
                  'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Próximos</h3>
            <Button variant="gradient" size="icon" className="h-6 w-6"><Plus className="w-3 h-3" /></Button>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map((ev, i) => {
              const Icon = typeIcons[ev.type as keyof typeof typeIcons]
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-2.5 p-2.5 bg-accent/30 rounded-xl hover:bg-accent/60 transition-colors cursor-pointer"
                >
                  <div className="w-2 h-8 rounded-full shrink-0" style={{ background: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{ev.title}</p>
                    <p className="text-[10px] text-muted-foreground">{ev.time}</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: ev.color + '20' }}>
                    <Icon className="w-3 h-3" style={{ color: ev.color }} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm font-semibold">23 – 29 de Junho, 2024</span>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Button variant="outline" size="sm" className="text-xs h-8">Hoje</Button>
          <div className="ml-auto flex items-center gap-1 bg-accent/50 rounded-lg p-1">
            {['Dia', 'Semana', 'Mês'].map((v, i) => (
              <button key={v} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${i === 1 ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{v}</button>
            ))}
          </div>
          <Button variant="gradient" size="sm" className="gap-1 text-xs h-8">
            <Plus className="w-3.5 h-3.5" /> Novo Evento
          </Button>
        </div>

        {/* Week view */}
        <div className="flex-1 overflow-auto">
          <div className="flex">
            {/* Time column */}
            <div className="w-16 shrink-0 pt-10">
              {hours.map(h => (
                <div key={h} className="h-16 flex items-start justify-end pr-3 pt-1">
                  <span className="text-[10px] text-muted-foreground">{h}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex-1 grid grid-cols-7 border-l border-border">
              {days.map((day, dayIdx) => (
                <div key={day} className="border-r border-border last:border-r-0">
                  {/* Day header */}
                  <div className={`h-10 flex flex-col items-center justify-center border-b border-border ${dayIdx === 0 ? 'bg-primary/5' : ''}`}>
                    <span className="text-[10px] text-muted-foreground">{day}</span>
                    <span className={`text-sm font-semibold ${dayIdx === 0 ? 'text-primary' : ''}`}>{22 + dayIdx}</span>
                  </div>

                  {/* Time slots */}
                  <div className="relative">
                    {hours.map(h => (
                      <div key={h} className="h-16 border-b border-border/50 hover:bg-accent/20 transition-colors cursor-pointer" />
                    ))}

                    {/* Events */}
                    {events.filter(e => e.day === dayIdx).map((ev) => {
                      const Icon = typeIcons[ev.type as keyof typeof typeIcons]
                      const topOffset = (parseInt(ev.time.split(':')[0]) - 8) * 64 + (parseInt(ev.time.split(':')[1]) / 60) * 64
                      const height = (ev.duration / 60) * 64
                      return (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          style={{
                            position: 'absolute',
                            top: topOffset + 2,
                            left: 2,
                            right: 2,
                            height: height - 4,
                            background: ev.color + '25',
                            borderLeft: `3px solid ${ev.color}`,
                            borderRadius: 8,
                          }}
                          className="px-2 py-1 cursor-pointer overflow-hidden"
                        >
                          <div className="flex items-start gap-1">
                            <Icon className="w-3 h-3 mt-0.5 shrink-0" style={{ color: ev.color }} />
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold leading-tight truncate">{ev.title}</p>
                              <p className="text-[9px] text-muted-foreground">{ev.time}</p>
                            </div>
                          </div>
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
    </motion.div>
  )
}
