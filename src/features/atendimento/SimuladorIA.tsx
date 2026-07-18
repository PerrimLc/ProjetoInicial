import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Bot, User, X, Trash2, AlertCircle,
  ExternalLink, Calendar, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIAConfig } from '@/hooks/useIAConfig'
import { useAuth } from '@/hooks/useAuth'
import { chamarIAComAgenda } from '@/services/ia/iaAgendaService'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'

interface MensagemSim {
  id: string
  role: 'user' | 'assistant'
  texto: string
  enviadaEm: Date
  agendamentoCriado?: { data: Date; label: string }
}

interface SimuladorIAProps {
  open: boolean
  onClose: () => void
}

const COL = (empresaId: string) =>
  collection(db, 'empresas', empresaId, 'simuladorHistorico')

export function SimuladorIA({ open, onClose }: SimuladorIAProps) {
  const { config: iaConfig, apiKey } = useIAConfig()
  const { empresa, membro } = useAuth()
  const empresaId = empresa?.id ?? null
  const contatoNome = membro?.nome ?? 'Cliente'

  const [mensagens, setMensagens] = useState<MensagemSim[]>([])
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, carregando])

  // Foco no input ao abrir
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  // Carregar histórico do Firestore ao abrir
  const carregarHistorico = useCallback(async () => {
    if (!empresaId || !open) return
    setCarregandoHistorico(true)
    try {
      const q = query(COL(empresaId), orderBy('enviadaEm'))
      const snap = await getDocs(q)
      const msgs = snap.docs.map(d =>
        converterTimestamps<MensagemSim>({ id: d.id, ...d.data() })
      )
      setMensagens(msgs)
    } catch (e) {
      console.error('[SimuladorIA] Erro ao carregar histórico:', e)
    } finally {
      setCarregandoHistorico(false)
    }
  }, [empresaId, open])

  useEffect(() => {
    carregarHistorico()
  }, [carregarHistorico])

  // Salvar mensagem no Firestore
  const salvarMensagem = async (msg: Omit<MensagemSim, 'id'>): Promise<string> => {
    if (!empresaId) return ''
    const ref = await addDoc(COL(empresaId), {
      ...msg,
      enviadaEm: serverTimestamp(),
    })
    return ref.id
  }

  const handleEnviar = async () => {
    if (!texto.trim() || carregando || !empresaId) return

    if (!apiKey) {
      const msg: MensagemSim = {
        id: Date.now().toString(),
        role: 'assistant',
        texto: '⚠️ Chave da Groq não configurada. Vá em Configurações → Agente de IA.',
        enviadaEm: new Date(),
      }
      setMensagens(prev => [...prev, msg])
      return
    }

    const novaMensagem: MensagemSim = {
      id: Date.now().toString(),
      role: 'user',
      texto: texto.trim(),
      enviadaEm: new Date(),
    }

    setMensagens(prev => [...prev, novaMensagem])
    setTexto('')
    setCarregando(true)

    try {
      // Salvar mensagem do usuário
      const idSalvo = await salvarMensagem({ role: 'user', texto: novaMensagem.texto, enviadaEm: novaMensagem.enviadaEm })
      novaMensagem.id = idSalvo || novaMensagem.id

      // Montar histórico para a Groq (apenas as mensagens, sem system)
      const historicoParaGroq = [...mensagens, novaMensagem].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.texto,
      }))

      // Chamar IA com integração de agenda
      const resultado = await chamarIAComAgenda(
        apiKey,
        empresaId,
        iaConfig.systemPrompt,
        historicoParaGroq,
        iaConfig,
        contatoNome
      )

      const respostaMensagem: MensagemSim = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        texto: resultado.texto,
        enviadaEm: new Date(),
        ...(resultado.agendamentoCriado ? { agendamentoCriado: resultado.agendamentoCriado } : {}),
      }

      // Salvar resposta da IA — omite agendamentoCriado se undefined (Firestore não aceita undefined)
      const dadosParaSalvar: Omit<MensagemSim, 'id'> = {
        role: 'assistant',
        texto: resultado.texto,
        enviadaEm: respostaMensagem.enviadaEm,
        ...(resultado.agendamentoCriado ? { agendamentoCriado: resultado.agendamentoCriado } : {}),
      }
      const idResposta = await salvarMensagem(dadosParaSalvar)
      respostaMensagem.id = idResposta || respostaMensagem.id

      setMensagens(prev => [...prev, respostaMensagem])
    } catch (e) {
      const errMsg: MensagemSim = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        texto: `❌ Erro: ${(e as Error).message}`,
        enviadaEm: new Date(),
      }
      await salvarMensagem({ role: 'assistant', texto: errMsg.texto, enviadaEm: errMsg.enviadaEm })
      setMensagens(prev => [...prev, errMsg])
    } finally {
      setCarregando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar() }
  }

  // Limpar histórico (Firestore + memória)
  const limparConversa = async () => {
    if (!empresaId) return
    try {
      const snap = await getDocs(COL(empresaId))
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'empresas', empresaId, 'simuladorHistorico', d.id))))
      setMensagens([])
    } catch (e) {
      console.error('[SimuladorIA] Erro ao limpar histórico:', e)
    }
  }

  const semChave = !apiKey
  const iaDesligada = !iaConfig.ativa

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg h-[620px] bg-card border border-border rounded-2xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Simulador com IA</p>
                    <p className="text-xs text-muted-foreground">
                      Histórico salvo · IA integrada com agenda
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {mensagens.length > 0 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={limparConversa}
                      title="Limpar histórico">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Avisos */}
              {(semChave || iaDesligada) && (
                <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-400 font-medium">
                      {semChave ? 'Chave da Groq não configurada' : 'IA está desligada'}
                    </p>
                    <p className="text-xs text-amber-400/70 mt-0.5">
                      {semChave ? 'Configure em Configurações → Agente de IA' : 'Ative em Configurações → Agente de IA'}
                    </p>
                  </div>
                  <a href="/configuracoes" onClick={onClose}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-0.5 shrink-0">
                    Ir <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {carregandoHistorico ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground">Carregando histórico...</p>
                  </div>
                ) : mensagens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <Bot className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Simulador de atendimento</p>
                    <p className="text-xs mt-1 opacity-60 max-w-xs">
                      Digite como cliente. A IA verifica a agenda e marca consultas automaticamente.
                    </p>
                    <div className="mt-4 p-3 bg-accent rounded-xl text-left max-w-xs w-full">
                      <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Sugestões para testar
                      </p>
                      {[
                        '"Quais horários estão disponíveis?"',
                        '"Quero marcar uma consulta"',
                        '"Qual o valor da consulta?"',
                      ].map(s => (
                        <button key={s} onClick={() => setTexto(s.replace(/"/g, ''))}
                          className="block text-xs text-primary hover:underline mt-1 text-left">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {mensagens.map(msg => (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1 ${
                            msg.role === 'assistant'
                              ? 'bg-gradient-to-br from-violet-500 to-blue-500'
                              : 'bg-gradient-to-br from-violet-500/20 to-blue-500/20'
                          }`}>
                            {msg.role === 'assistant'
                              ? <Bot className="w-3.5 h-3.5 text-white" />
                              : <User className="w-3.5 h-3.5" />}
                          </div>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-none'
                              : 'bg-accent rounded-tl-none'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
                            <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                              {msg.enviadaEm instanceof Date
                                ? msg.enviadaEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                : '--:--'}
                            </p>
                          </div>
                        </div>

                        {/* Badge de agendamento criado */}
                        {msg.agendamentoCriado && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 ml-9">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Agendamento salvo na agenda: <strong>{msg.agendamentoCriado.label}</strong></span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {/* IA digitando */}
                {carregando && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-accent rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.span key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                          className="w-1.5 h-1.5 bg-primary/60 rounded-full"
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">verificando agenda...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border shrink-0">
                <div className="flex items-center gap-2 bg-accent rounded-xl px-4 py-2">
                  <input ref={inputRef} value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite como se fosse o cliente..."
                    disabled={carregando || carregandoHistorico}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                  />
                  <Button size="icon" variant="gradient" className="h-8 w-8 shrink-0 rounded-lg"
                    onClick={handleEnviar}
                    disabled={!texto.trim() || carregando || carregandoHistorico}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" /> Histórico salvo · Agendamentos integrados com a Agenda
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
