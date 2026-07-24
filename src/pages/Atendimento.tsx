import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Search, Plus, MessageSquare, Check, CheckCheck,
  UserCheck, UserX, RotateCcw, ChevronRight, Bot, Zap, X, Phone
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useConversas } from '@/hooks/useConversas'
import { useMensagens } from '@/hooks/useMensagens'
import { useRespostasRapidas } from '@/hooks/useRespostasRapidas'
import { useContatos } from '@/hooks/useContatos'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { useIAConfig } from '@/hooks/useIAConfig'
import { montarHistoricoGroq } from '@/services/ia/groqService'
import { chamarIAComAgenda } from '@/services/ia/iaAgendaService'
import { SimuladorIA } from '@/features/atendimento/SimuladorIA'
import { getRelativeTime } from '@/lib/utils'
import type { Conversa, RespostaRapida } from '@/types'

type FiltroStatus = 'todos' | 'aguardando' | 'em_atendimento' | 'finalizada'

const statusConfig = {
  aguardando:     { label: 'Aguardando',     variant: 'warning' as const,     dot: 'bg-amber-500' },
  em_atendimento: { label: 'Em Atendimento', variant: 'success' as const,     dot: 'bg-emerald-500' },
  finalizada:     { label: 'Finalizada',     variant: 'secondary' as const,   dot: 'bg-zinc-500' },
}

export function Atendimento() {
  const navigate = useNavigate()
  const { membro, empresa } = useAuth()
  const { success, error: toastError } = useToast()

  const {
    conversas, carregando: carregandoConversas,
    criarConversa, assumirAtendimento, finalizarAtendimento,
    reabrirAtendimento, zerarNaoLidas,
  } = useConversas()

  const { contatos } = useContatos()
  const { respostas: respostasRapidas } = useRespostasRapidas()

  const [conversaSelecionadaId, setConversaSelecionadaId] = useState<string | null>(null)
  const { mensagens, carregando: carregandoMensagens, enviarMensagem, simularResposta } = useMensagens(conversaSelecionadaId)

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [busca, setBusca] = useState('')
  const [texto, setTexto] = useState('')
  const [showSugestoes, setShowSugestoes] = useState(false)
  const [sugestoesRR, setSugestoesRR] = useState<RespostaRapida[]>([])
  const [showNovaConversa, setShowNovaConversa] = useState(false)
  const [showFinalizar, setShowFinalizar] = useState(false)
  const [modoCliente, setModoCliente] = useState(false) // Modo simulação: você é o cliente
  const [painelContato, setPainelContato] = useState(false)
  const [iaDigitando, setIaDigitando] = useState(false)
  const [showSimuladorIA, setShowSimuladorIA] = useState(false)

  const { config: iaConfig, apiKey: groqApiKey } = useIAConfig()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const conversaAtual = conversas.find(c => c.id === conversaSelecionadaId) ?? null

  // Campos para nova conversa manual
  const [novaForm, setNovaForm] = useState({ contatoId: '', nome: '', telefone: '' })

  // Scroll automático ao fim das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  // Zerar não lidas ao selecionar conversa
  const selecionarConversa = useCallback(async (conversa: Conversa) => {
    setConversaSelecionadaId(conversa.id)
    setPainelContato(false)
    if (conversa.mensagensNaoLidas > 0) {
      await zerarNaoLidas(conversa.id)
    }
  }, [zerarNaoLidas])

  // Filtros
  const conversasFiltradas = conversas.filter(c => {
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false
    if (busca) {
      const q = busca.toLowerCase()
      if (!c.contatoNome.toLowerCase().includes(q) && !c.telefone.includes(q)) return false
    }
    return true
  })

  // Respostas rápidas — detectar '/'
  const handleTextoChange = (val: string) => {
    setTexto(val)
    if (val.startsWith('/') && val.length > 0) {
      const termo = val.slice(1).toLowerCase()
      const sugs = respostasRapidas.filter(r =>
        r.ativa && (r.atalho.toLowerCase().includes(termo) || r.titulo.toLowerCase().includes(termo))
      )
      setSugestoesRR(sugs)
      setShowSugestoes(sugs.length > 0)
    } else {
      setShowSugestoes(false)
    }
  }

  const aplicarResposta = (rr: RespostaRapida) => {
    setTexto(rr.mensagem)
    setShowSugestoes(false)
    inputRef.current?.focus()
  }

  // Enviar mensagem
  const handleEnviar = async () => {
    if (!texto.trim() || !conversaSelecionadaId || !membro) return
    try {
      // Modo cliente: envia como mensagem de entrada (do cliente)
      if (modoCliente) {
        await enviarMensagem({
          conversaId: conversaSelecionadaId,
          texto: texto.trim(),
          tipo: 'texto',
          direcao: 'entrada',
          status: 'lida',
        })
        setTexto('')
        setShowSugestoes(false)

        // IA responde automaticamente com integração de agenda
        const iaPausadaPeloAtendente = iaConfig.pausarQuandoAtendente && !!conversaAtual?.atendenteId
        if (iaConfig.ativa && groqApiKey && empresa && !iaPausadaPeloAtendente) {
          setIaDigitando(true)
          try {
            const historico = montarHistoricoGroq(
              iaConfig.systemPrompt,
              mensagens.map(m => ({ texto: m.texto, direcao: m.direcao }))
            )
            const resultado = await chamarIAComAgenda(
              groqApiKey,
              empresa.id,
              iaConfig.systemPrompt,
              historico,
              iaConfig,
              conversaAtual?.contatoNome ?? 'Cliente'
            )
            if (resultado.texto) {
              await enviarMensagem({
                conversaId: conversaSelecionadaId,
                texto: resultado.texto,
                tipo: 'texto',
                direcao: 'saida',
                remetenteId: 'ia',
                status: 'enviada',
              })
            }
            // Feedback visual quando agendamento é criado
            if (resultado.agendamentoCriado) {
              success('📅 Consulta agendada!', `${resultado.agendamentoCriado.label}`)
            }
          } catch (e) {
            console.error('[Modo cliente] Erro IA:', e)
          } finally {
            setIaDigitando(false)
          }
        } else if (!iaConfig.ativa || !groqApiKey) {
          // Se IA não configurada, simula uma resposta genérica
          setIaDigitando(true)
          try {
            const frases = [
              'Olá! Como posso ajudá-lo?',
              'Claro, posso ajudar com isso!',
              'Vou verificar e retorno em breve.',
              'Qual horário seria melhor para você?',
            ]
            await simularResposta(frases[Math.floor(Math.random() * frases.length)])
          } finally { setIaDigitando(false) }
        }
        return
      }

      // Modo normal: envia como mensagem de saída (do atendente)
      await enviarMensagem({
        conversaId: conversaSelecionadaId,
        texto: texto.trim(),
        tipo: 'texto',
        direcao: 'saida',
        remetenteId: membro.usuarioId,
        status: 'enviada',
      })
      setTexto('')
      setShowSugestoes(false)
    } catch (e) {
      toastError('Erro ao enviar mensagem')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar() }
    if (e.key === 'Escape') setShowSugestoes(false)
  }

  // Ações de atendimento
  const handleAssumir = async () => {
    if (!conversaSelecionadaId || !membro) return
    try {
      await assumirAtendimento(conversaSelecionadaId, membro.usuarioId)
      success('Atendimento assumido!')
    } catch { toastError('Erro ao assumir atendimento') }
  }

  const handleFinalizar = async () => {
    if (!conversaSelecionadaId) return
    try {
      await finalizarAtendimento(conversaSelecionadaId)
      success('Conversa finalizada.')
      setShowFinalizar(false)
    } catch { toastError('Erro ao finalizar') }
  }

  const handleReabrir = async () => {
    if (!conversaSelecionadaId) return
    try {
      await reabrirAtendimento(conversaSelecionadaId)
      success('Conversa reaberta.')
    } catch { toastError('Erro ao reabrir') }
  }

  // Nova conversa manual
  const handleNovaConversa = async () => {
    try {
      let nome = novaForm.nome
      let telefone = novaForm.telefone
      let contatoId = novaForm.contatoId

      if (contatoId) {
        const c = contatos.find(ct => ct.id === contatoId)
        if (c) { nome = c.nome; telefone = c.telefone }
      }
      if (!nome || !telefone) { toastError('Informe nome e telefone'); return }

      const id = await criarConversa({
        contatoId: contatoId || '',
        contatoNome: nome,
        telefone,
        status: 'aguardando',
        ultimaMensagem: '',
        ultimaMensagemEm: new Date(),
        mensagensNaoLidas: 0,
        etiquetaIds: [],
        origem: 'simulacao',
      })
      success('Conversa criada!')
      setShowNovaConversa(false)
      setNovaForm({ contatoId: '', nome: '', telefone: '' })
      if (id) setConversaSelecionadaId(id)
    } catch (e) {
      toastError('Erro ao criar conversa', (e as Error).message)
    }
  }

  // Contato da conversa atual
  const contatoDaConversa = conversaAtual
    ? contatos.find(c => c.id === conversaAtual.contatoId)
    : null

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Sidebar de conversas ── */}
      <div className={`shrink-0 border-r border-border flex flex-col bg-card/30 w-full sm:w-72 ${conversaSelecionadaId ? 'hidden sm:flex' : 'flex'}`}>
        {/* Busca + novo */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="Buscar conversa..." className="pl-9 h-8 text-xs" />
            </div>
            <Button size="icon" variant="gradient" className="h-8 w-8 shrink-0"
              onClick={() => setShowNovaConversa(true)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          {/* Filtros de status */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {(['todos', 'aguardando', 'em_atendimento', 'finalizada'] as const).map(f => (
              <button key={f} onClick={() => setFiltroStatus(f)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  filtroStatus === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-muted-foreground hover:text-foreground'
                }`}>
                {f === 'todos' ? 'Todos'
                  : f === 'aguardando' ? 'Aguardando'
                  : f === 'em_atendimento' ? 'Em Atend.'
                  : 'Finalizadas'}
              </button>
            ))}
          </div>
          {/* Botão Testar IA */}
          <button
            onClick={() => setShowSimuladorIA(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-violet-500/30 text-violet-400 text-xs font-medium hover:bg-violet-500/10 transition-colors">
            <Bot className="w-3.5 h-3.5" /> Testar com IA
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {carregandoConversas ? (
            <div className="space-y-0 divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs">Nenhuma conversa</p>
            </div>
          ) : (
            conversasFiltradas.map(conv => {
              const cfg = statusConfig[conv.status]
              const isSelected = conv.id === conversaSelecionadaId
              return (
                <button key={conv.id} onClick={() => selecionarConversa(conv)}
                  className={`w-full flex items-center gap-3 p-3 border-b border-border/50 text-left transition-colors hover:bg-accent/30 ${
                    isSelected ? 'bg-primary/8 border-l-2 border-l-primary' : ''
                  }`}>
                  <div className="relative shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-xs font-semibold">
                        {conv.contatoNome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${cfg.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold truncate">{conv.contatoNome}</p>
                      <p className="text-[10px] text-muted-foreground shrink-0 ml-1">
                        {getRelativeTime(conv.ultimaMensagemEm)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.ultimaMensagem || '—'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant={cfg.variant} className="text-[10px] px-1.5 py-0">{cfg.label}</Badge>
                    </div>
                  </div>
                  {conv.mensagensNaoLidas > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                      {conv.mensagensNaoLidas}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Área de chat ── */}
      {conversaAtual ? (
        <div className={`flex-1 flex flex-col min-w-0 ${conversaSelecionadaId ? 'flex' : 'hidden sm:flex'}`}>
          {/* Header do chat */}
          <div className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card/30 shrink-0">
            {/* Botão voltar no mobile */}
            <button
              className="sm:hidden text-muted-foreground hover:text-foreground mr-1"
              onClick={() => setConversaSelecionadaId(null)}
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-xs font-semibold">
                {conversaAtual.contatoNome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{conversaAtual.contatoNome}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />{conversaAtual.telefone}
                {iaConfig.ativa && groqApiKey && (
                  <span className="ml-1 inline-flex items-center gap-0.5 bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                    <Bot className="w-2.5 h-2.5" /> IA ativa
                  </span>
                )}
              </p>
            </div>
            {/* Ações */}
            <div className="flex items-center gap-1 shrink-0">
              {conversaAtual.status === 'aguardando' && (
                <Button size="sm" variant="gradient" className="h-7 text-xs gap-1.5" onClick={handleAssumir}>
                  <UserCheck className="w-3.5 h-3.5" /> Assumir
                </Button>
              )}
              {conversaAtual.status === 'em_atendimento' && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30"
                  onClick={() => setShowFinalizar(true)}>
                  <UserX className="w-3.5 h-3.5" /> Finalizar
                </Button>
              )}
              {conversaAtual.status === 'finalizada' && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleReabrir}>
                  <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                </Button>
              )}
              {/* Toggle modo cliente */}
              <Button
                size="sm"
                variant={modoCliente ? 'gradient' : 'outline'}
                className={`h-7 text-xs gap-1.5 transition-all ${modoCliente ? 'ring-2 ring-violet-500/40' : ''}`}
                onClick={() => setModoCliente(v => !v)}
                title={modoCliente ? 'Sair do modo cliente' : 'Modo cliente: você digita como cliente, a IA responde'}
              >
                <Bot className="w-3.5 h-3.5" />
                {modoCliente ? '● Modo cliente' : 'Simular'}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8"
                onClick={() => setPainelContato(!painelContato)}>
                <ChevronRight className={`w-4 h-4 transition-transform ${painelContato ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {carregandoMensagens ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <Skeleton className="h-10 w-48 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : mensagens.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-xs">Nenhuma mensagem ainda</p>
                <p className="text-xs opacity-60 mt-1">Use "Simular" para testar uma resposta</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {mensagens.map((msg, i) => {
                  const isEntrada = msg.direcao === 'entrada'
                  return (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i < 10 ? i * 0.02 : 0 }}
                      className={`flex items-end gap-2 ${isEntrada ? 'justify-start' : 'justify-end'}`}>
                      {isEntrada && (
                        <Avatar className="w-7 h-7 shrink-0 mb-1">
                          <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-[10px]">
                            {conversaAtual.contatoNome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isEntrada
                          ? 'bg-accent rounded-tl-none'
                          : 'bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-tr-none'
                      }`}>
                        {msg.tipo === 'sistema' ? (
                          <p className="text-xs italic opacity-70">{msg.texto}</p>
                        ) : (
                          <p className="text-sm leading-relaxed">{msg.texto}</p>
                        )}
                        <div className={`flex items-center gap-1 mt-1 ${isEntrada ? 'justify-start' : 'justify-end'}`}>
                          <p className={`text-[10px] ${isEntrada ? 'text-muted-foreground' : 'text-white/60'}`}>
                            {msg.enviadaEm instanceof Date
                              ? msg.enviadaEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </p>
                          {!isEntrada && (
                            msg.status === 'lida' ? <CheckCheck className="w-3 h-3 text-white/60" />
                            : <Check className="w-3 h-3 text-white/60" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Indicador IA digitando */}
          {iaDigitando && (
            <div className="px-4 pb-1 flex items-center gap-2">
              <div className="flex items-center gap-2 bg-accent rounded-2xl rounded-tl-none px-4 py-2.5">
                <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.span key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 bg-primary/60 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">IA respondendo...</span>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border bg-card/30 shrink-0">
            {/* Banner modo cliente */}
            {modoCliente && (
              <div className="px-4 py-2 bg-violet-500/10 border-b border-violet-500/20 flex items-center justify-between">
                <span className="text-xs text-violet-400 font-medium flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  Modo cliente ativo — você é o cliente, a IA responde
                </span>
                <button onClick={() => setModoCliente(false)}
                  className="text-xs text-violet-400/70 hover:text-violet-400 transition-colors">
                  Sair
                </button>
              </div>
            )}
          <div className="p-3 relative">
            {/* Sugestões de respostas rápidas */}
            <AnimatePresence>
              {showSugestoes && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-full left-3 right-3 mb-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-10">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Zap className="w-3 h-3" /> Respostas Rápidas
                    </span>
                    <button onClick={() => setShowSugestoes(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {sugestoesRR.map(rr => (
                      <button key={rr.id} onClick={() => aplicarResposta(rr)}
                        className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-primary">{rr.atalho}</span>
                          <span className="text-xs text-muted-foreground">—</span>
                          <span className="text-xs font-medium">{rr.titulo}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{rr.mensagem}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 bg-accent rounded-xl px-4 py-2">
              <input ref={inputRef}
                value={texto}
                onChange={e => handleTextoChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={conversaAtual.status === 'finalizada'
                  ? 'Conversa finalizada — reabra para responder'
                  : modoCliente
                    ? '🟢 Modo cliente ativo — digite como se fosse o cliente...'
                    : 'Digite "/" para respostas rápidas...'}
                disabled={conversaAtual.status === 'finalizada'}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button size="icon" variant="gradient" className="h-8 w-8 shrink-0 rounded-lg"
                onClick={handleEnviar}
                disabled={!texto.trim() || conversaAtual.status === 'finalizada'}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          </div>
        </div>
      ) : (
        <div className="hidden sm:flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Selecione uma conversa</p>
            <p className="text-xs opacity-60 mt-1">ou crie uma nova com o botão +</p>
          </div>
        </div>
      )}

      {/* ── Painel lateral do contato ── */}
      <AnimatePresence>
        {painelContato && conversaAtual && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="shrink-0 border-l border-border bg-card/30 overflow-hidden">
            <div className="w-64 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</p>
                <button onClick={() => setPainelContato(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-center">
                <Avatar className="w-14 h-14 mx-auto mb-2">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-lg font-bold">
                    {conversaAtual.contatoNome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold">{conversaAtual.contatoNome}</p>
                <p className="text-xs text-muted-foreground">{conversaAtual.telefone}</p>
              </div>
              {contatoDaConversa && (
                <div className="space-y-2">
                  {contatoDaConversa.email && (
                    <p className="text-xs text-muted-foreground">{contatoDaConversa.email}</p>
                  )}
                  {contatoDaConversa.empresa && (
                    <p className="text-xs text-muted-foreground">{contatoDaConversa.empresa}</p>
                  )}
                </div>
              )}
              <div className="space-y-2 pt-2 border-t border-border">
                <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 h-8"
                  onClick={() => navigate('/contatos')}>
                  Ver Contato Completo
                </Button>
                <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 h-8"
                  onClick={() => navigate('/crm')}>
                  Criar Negócio
                </Button>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Status da conversa</p>
                <Badge variant={statusConfig[conversaAtual.status].variant} className="text-xs">
                  {statusConfig[conversaAtual.status].label}
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal nova conversa ── */}
      <Modal open={showNovaConversa} onClose={() => setShowNovaConversa(false)}
        title="Nova Conversa" size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Contato existente</label>
            <select value={novaForm.contatoId}
              onChange={e => {
                const c = contatos.find(ct => ct.id === e.target.value)
                setNovaForm({ contatoId: e.target.value, nome: c?.nome ?? '', telefone: c?.telefone ?? '' })
              }}
              className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Ou preencha manualmente abaixo...</option>
              {contatos.filter(c => c.ativo).map(c => (
                <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome *</label>
            <Input value={novaForm.nome}
              onChange={e => setNovaForm(p => ({ ...p, nome: e.target.value }))}
              placeholder="Nome do contato" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Telefone *</label>
            <Input value={novaForm.telefone}
              onChange={e => setNovaForm(p => ({ ...p, telefone: e.target.value }))}
              placeholder="+55 11 99999-9999" className="h-9 text-sm" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowNovaConversa(false)}>Cancelar</Button>
            <Button variant="gradient" size="sm" onClick={handleNovaConversa}
              disabled={!novaForm.nome && !novaForm.contatoId}>
              Iniciar Conversa
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirmar finalizar ── */}
      <ConfirmModal open={showFinalizar} onClose={() => setShowFinalizar(false)}
        onConfirm={handleFinalizar}
        title="Finalizar Atendimento"
        message="Confirmar finalização desta conversa?"
        confirmLabel="Finalizar"
        danger />

      {/* ── Simulador IA ── */}
      <SimuladorIA open={showSimuladorIA} onClose={() => setShowSimuladorIA(false)} />
    </div>
  )
}
