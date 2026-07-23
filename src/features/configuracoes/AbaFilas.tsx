import { useState, useEffect } from 'react'
import { GitMerge, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useSetores } from '@/hooks/useSetores'
import { useToast } from '@/components/ui/toast'
import { buscarConfiguracoes, salvarConfiguracoes } from '@/services/empresas/empresaService'

export interface ConfiguracaoFila {
  modoDistribuicao: 'manual' | 'round_robin' | 'menos_conversas'
  setorPadrao: string
  tempoLimiteEsperaMin: number
  distribuirPorSetor: boolean
}

const CONFIG_FILA_PADRAO: ConfiguracaoFila = {
  modoDistribuicao: 'manual',
  setorPadrao: '',
  tempoLimiteEsperaMin: 30,
  distribuirPorSetor: false,
}

export function AbaFilas() {
  const { empresa } = useAuth()
  const { setores } = useSetores()
  const { success, error: toastError } = useToast()

  const [config, setConfig] = useState<ConfiguracaoFila>(CONFIG_FILA_PADRAO)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!empresa) return
    buscarConfiguracoes(empresa.id)
      .then(dados => {
        const fila = dados['fila'] as ConfiguracaoFila | undefined
        if (fila) setConfig({ ...CONFIG_FILA_PADRAO, ...fila })
      })
      .finally(() => setCarregando(false))
  }, [empresa])

  const handleSalvar = async () => {
    if (!empresa) return
    setSalvando(true)
    try {
      await salvarConfiguracoes(empresa.id, { fila: config })
      success('Configuração de filas salva!')
    } catch (e) {
      toastError('Erro ao salvar', (e as Error).message)
    } finally {
      setSalvando(false) }
  }

  if (carregando) return <div className="text-sm text-muted-foreground">Carregando...</div>

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-primary" /> Filas de Distribuição
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure como as conversas são distribuídas entre os atendentes
        </p>
      </div>

      {/* Modo de distribuição */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Modo de Distribuição</label>
        <div className="space-y-2">
          {[
            {
              value: 'manual',
              label: 'Manual',
              desc: 'Atendentes assumem as conversas por conta própria',
            },
            {
              value: 'round_robin',
              label: 'Round Robin',
              desc: 'Distribui em rodízio entre atendentes disponíveis',
            },
            {
              value: 'menos_conversas',
              label: 'Menor carga',
              desc: 'Encaminha para o atendente com menos conversas abertas',
            },
          ].map(op => (
            <button key={op.value}
              onClick={() => setConfig(p => ({ ...p, modoDistribuicao: op.value as ConfiguracaoFila['modoDistribuicao'] }))}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                config.modoDistribuicao === op.value
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border hover:bg-accent/40'
              }`}>
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                config.modoDistribuicao === op.value ? 'border-primary' : 'border-border'
              }`}>
                {config.modoDistribuicao === op.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{op.label}</p>
                <p className="text-xs text-muted-foreground">{op.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Setor padrão */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Setor Padrão</label>
        <select value={config.setorPadrao}
          onChange={e => setConfig(p => ({ ...p, setorPadrao: e.target.value }))}
          className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Sem setor padrão</option>
          {setores.filter(s => s.ativo).map(s => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <p className="text-[11px] text-muted-foreground">
          Novas conversas são atribuídas a este setor automaticamente
        </p>
      </div>

      {/* Tempo limite de espera */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Alerta de espera (minutos)
        </label>
        <div className="flex items-center gap-3">
          <input type="range" min="5" max="120" step="5"
            value={config.tempoLimiteEsperaMin}
            onChange={e => setConfig(p => ({ ...p, tempoLimiteEsperaMin: Number(e.target.value) }))}
            className="flex-1 accent-violet-500" />
          <span className="text-sm font-semibold w-14 text-right shrink-0">
            {config.tempoLimiteEsperaMin} min
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Conversas aguardando além deste tempo aparecem com destaque na lista
        </p>
      </div>

      {/* Distribuir por setor */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div>
          <p className="text-sm font-medium">Distribuir por setor do atendente</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Só encaminha para atendentes do mesmo setor da conversa
          </p>
        </div>
        <button
          onClick={() => setConfig(p => ({ ...p, distribuirPorSetor: !p.distribuirPorSetor }))}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            config.distribuirPorSetor ? 'bg-primary' : 'bg-secondary'
          }`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            config.distribuirPorSetor ? 'translate-x-5' : ''
          }`} />
        </button>
      </div>

      <div className="pt-2">
        <Button variant="gradient" size="sm" className="gap-1.5" onClick={handleSalvar} disabled={salvando}>
          <Save className="w-3.5 h-3.5" />
          {salvando ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}
