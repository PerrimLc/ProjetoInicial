import { useState, useEffect } from 'react'
import { Clock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import {
  buscarHorariosDisponiveis,
  salvarHorariosDisponiveis,
  HORARIOS_PADRAO,
} from '@/services/agenda/agendaService'
import type { HorarioDisponivel } from '@/types'

const DIAS = [
  { num: 0, label: 'Domingo' },
  { num: 1, label: 'Segunda-feira' },
  { num: 2, label: 'Terça-feira' },
  { num: 3, label: 'Quarta-feira' },
  { num: 4, label: 'Quinta-feira' },
  { num: 5, label: 'Sexta-feira' },
  { num: 6, label: 'Sábado' },
]

const DURACOES = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
]

export function AbaHorarios() {
  const { empresa } = useAuth()
  const { success, error: toastError } = useToast()

  const [horarios, setHorarios] = useState<HorarioDisponivel[]>(HORARIOS_PADRAO)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!empresa) return
    buscarHorariosDisponiveis(empresa.id)
      .then(h => setHorarios(h))
      .finally(() => setCarregando(false))
  }, [empresa])

  const isDiaAtivo = (num: number) => horarios.some(h => h.diaSemana === num)

  const toggleDia = (num: number) => {
    if (isDiaAtivo(num)) {
      setHorarios(prev => prev.filter(h => h.diaSemana !== num))
    } else {
      setHorarios(prev => [...prev, { diaSemana: num, inicio: '09:00', fim: '18:00', intervalMin: 60 }]
        .sort((a, b) => a.diaSemana - b.diaSemana))
    }
  }

  const atualizarHorario = (num: number, campo: keyof HorarioDisponivel, valor: string | number) => {
    setHorarios(prev => prev.map(h =>
      h.diaSemana === num ? { ...h, [campo]: campo === 'intervalMin' ? Number(valor) : valor } : h
    ))
  }

  const handleSalvar = async () => {
    if (!empresa) return
    setSalvando(true)
    try {
      await salvarHorariosDisponiveis(empresa.id, horarios)
      success('Horários salvos!')
    } catch (e) {
      toastError('Erro ao salvar', (e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <div className="text-sm text-muted-foreground">Carregando...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Horários de Atendimento
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure os dias e horários disponíveis para consultas. A IA usará estes horários para agendar.
        </p>
      </div>

      <div className="space-y-2">
        {DIAS.map(({ num, label }) => {
          const ativo = isDiaAtivo(num)
          const config = horarios.find(h => h.diaSemana === num)

          return (
            <div key={num}
              className={`rounded-xl border transition-all ${
                ativo ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/30'
              }`}>
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Toggle */}
                <button onClick={() => toggleDia(num)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                    ativo ? 'bg-primary' : 'bg-secondary'
                  }`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    ativo ? 'translate-x-5' : ''
                  }`} />
                </button>

                <span className={`text-sm font-medium w-36 shrink-0 ${ativo ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>

                {ativo && config && (
                  <div className="flex items-center gap-3 flex-wrap flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">De</span>
                      <input type="time" value={config.inicio}
                        onChange={e => atualizarHorario(num, 'inicio', e.target.value)}
                        className="h-7 text-xs bg-transparent border border-border rounded-lg px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">até</span>
                      <input type="time" value={config.fim}
                        onChange={e => atualizarHorario(num, 'fim', e.target.value)}
                        className="h-7 text-xs bg-transparent border border-border rounded-lg px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Duração</span>
                      <select value={config.intervalMin}
                        onChange={e => atualizarHorario(num, 'intervalMin', Number(e.target.value))}
                        className="h-7 text-xs bg-transparent border border-border rounded-lg px-2 text-foreground focus:outline-none">
                        {DURACOES.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {!ativo && (
                  <span className="text-xs text-muted-foreground">Fechado</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {horarios.length} dia{horarios.length !== 1 ? 's' : ''} configurado{horarios.length !== 1 ? 's' : ''}
        </p>
        <Button variant="gradient" size="sm" className="gap-1.5" onClick={handleSalvar} disabled={salvando}>
          <Save className="w-3.5 h-3.5" />
          {salvando ? 'Salvando...' : 'Salvar Horários'}
        </Button>
      </div>
    </div>
  )
}
