import { useEffect, useState } from 'react'
import { Bot, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useIAConfig } from '@/hooks/useIAConfig'
import { useToast } from '@/components/ui/toast'
import { chamarGroq, type ConfiguracaoIA } from '@/services/ia/groqService'

const MODELOS = [
  { value: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B — Mais capaz (recomendado)' },
  { value: 'llama-3.1-8b-instant',    label: 'LLaMA 3.1 8B — Mais rápido' },
  { value: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B — Contexto longo' },
]

export function AbaIA() {
  const { config, apiKey, carregando, salvarConfig } = useIAConfig()
  const { success, error: toastError } = useToast()

  const [form, setForm] = useState<ConfiguracaoIA>(config)
  const [chaveLocal, setChaveLocal] = useState(apiKey)
  const [mostrarChave, setMostrarChave] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [testando, setTestando] = useState(false)
  const [statusTeste, setStatusTeste] = useState<'idle' | 'ok' | 'erro'>('idle')

  useEffect(() => {
    setForm(config)
  }, [config])

  useEffect(() => {
    setChaveLocal(apiKey)
  }, [apiKey])

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      // Salva a config E a chave no Firestore
      await salvarConfig(form, chaveLocal)
      success('Configurações da IA salvas!')
    } catch (e) {
      toastError('Erro ao salvar', (e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const handleTestar = async () => {
    if (!chaveLocal) { toastError('Informe a chave da Groq primeiro'); return }
    setTestando(true)
    setStatusTeste('idle')
    try {
      const resposta = await chamarGroq(
        chaveLocal,
        [
          { role: 'system', content: form.systemPrompt },
          { role: 'user', content: 'Olá! Só testando a conexão.' },
        ],
        form
      )
      if (resposta) {
        setStatusTeste('ok')
        success('IA funcionando!', `Resposta: "${resposta.slice(0, 80)}..."`)
      }
    } catch (e) {
      setStatusTeste('erro')
      toastError('Erro ao conectar com Groq', (e as Error).message)
    } finally {
      setTestando(false) }
  }

  if (carregando) return <div className="text-sm text-muted-foreground">Carregando...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" /> Agente de IA
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure a IA para responder automaticamente as conversas usando Groq
        </p>
      </div>

      {/* Toggle ativo */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div>
          <p className="text-sm font-medium">Ativar Resposta Automática</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            A IA responderá automaticamente quando chegar nova mensagem
          </p>
        </div>
        <button
          onClick={() => setForm(p => ({ ...p, ativa: !p.ativa }))}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.ativa ? 'bg-primary' : 'bg-secondary'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.ativa ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {/* Chave API */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">
          Chave da API Groq{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer"
            className="text-primary hover:underline">(Obter grátis →)</a>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={mostrarChave ? 'text' : 'password'}
              value={chaveLocal}
              onChange={e => setChaveLocal(e.target.value)}
              placeholder="gsk_..."
              className="h-9 text-sm pr-10 font-mono"
            />
            <button onClick={() => setMostrarChave(!mostrarChave)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {mostrarChave ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 shrink-0"
            onClick={handleTestar} disabled={testando || !chaveLocal}>
            {testando ? 'Testando...' : 'Testar conexão'}
          </Button>
          {statusTeste === 'ok' && <CheckCircle2 className="w-5 h-5 text-emerald-400 self-center shrink-0" />}
          {statusTeste === 'erro' && <XCircle className="w-5 h-5 text-red-400 self-center shrink-0" />}
        </div>
        <p className="text-[11px] text-muted-foreground">
          A chave é salva de forma segura no banco de dados da sua empresa.
        </p>
      </div>

      {/* Modelo */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">Modelo</label>
        <select value={form.modelo} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))}
          className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          {MODELOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* System Prompt */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">
          Instruções da IA <span className="text-muted-foreground font-normal">(system prompt)</span>
        </label>
        <textarea
          value={form.systemPrompt}
          onChange={e => setForm(p => ({ ...p, systemPrompt: e.target.value }))}
          rows={8}
          placeholder="Descreva como a IA deve se comportar, quais produtos/serviços oferece, tom de voz, etc."
          className="w-full text-sm bg-transparent border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[140px]"
        />
        <p className="text-[11px] text-muted-foreground">
          Aqui você "treina" a IA. Descreva sua empresa, produtos, preços, tom de voz e regras de atendimento.
        </p>
      </div>

      {/* Temperatura */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            Criatividade (temperatura): <span className="text-foreground">{form.temperatura}</span>
          </label>
        </div>
        <input type="range" min="0" max="1" step="0.1"
          value={form.temperatura}
          onChange={e => setForm(p => ({ ...p, temperatura: parseFloat(e.target.value) }))}
          className="w-full accent-violet-500" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0 — Mais preciso/conservador</span>
          <span>1 — Mais criativo</span>
        </div>
      </div>

      {/* Pausar quando atendente assumir */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div>
          <p className="text-sm font-medium">Pausar quando atendente assumir</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            A IA para de responder quando um atendente humano assume a conversa
          </p>
        </div>
        <button
          onClick={() => setForm(p => ({ ...p, pausarQuandoAtendente: !p.pausarQuandoAtendente }))}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.pausarQuandoAtendente ? 'bg-primary' : 'bg-secondary'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.pausarQuandoAtendente ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="pt-2">
        <Button variant="gradient" size="sm" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}
