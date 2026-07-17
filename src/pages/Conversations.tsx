import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Search, MoreVertical, Phone, Video, Smile, Paperclip, Bot, Plus, Archive, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusDot } from '@/components/ui/status-dot'
import { Modal } from '@/components/ui/modal'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/components/ui/toast'
import { getRelativeTime } from '@/lib/utils'
import { agentProfiles } from '@/lib/aiEngine'
import type { Conversation } from '@/types'

const filters = ['Todos', 'Novo Lead', 'Em Atendimento', 'Finalizado']

export function Conversations() {
  const {
    conversations, sendMessage, createConversation,
    updateConversationStatus, archiveConversation, markConversationRead,
  } = useApp()
  const { success, info } = useToast()

  const [selectedId, setSelectedId] = useState<string>(conversations[0]?.id ?? '')
  const [filter, setFilter] = useState('Todos')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showNewConvModal, setShowNewConvModal] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', company: '' })
  const [showScrollDown, setShowScrollDown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const selected = conversations.find(c => c.id === selectedId)

  const filtered = conversations.filter(c => {
    const matchFilter =
      filter === 'Todos' ? true :
      filter === 'Novo Lead' ? c.status === 'new' :
      filter === 'Em Atendimento' ? c.status === 'active' :
      c.status === 'closed'
    const matchSearch = !search || c.contact.name.toLowerCase().includes(search.toLowerCase()) || (c.contact.company ?? '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  // Scroll down button
  const handleScroll = () => {
    const el = messagesContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollDown(distFromBottom > 120)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Detect when AI is "typing"
  useEffect(() => {
    if (!selected) return
    const lastMsg = selected.messages[selected.messages.length - 1]
    if (lastMsg?.sender === 'user') {
      setIsTyping(true)
      const timer = setTimeout(() => setIsTyping(false), 2000)
      return () => clearTimeout(timer)
    } else {
      setIsTyping(false)
    }
  }, [selected?.messages])

  const handleSelect = (conv: Conversation) => {
    setSelectedId(conv.id)
    if (conv.unread > 0) markConversationRead(conv.id)
  }

  const handleSend = () => {
    if (!message.trim() || !selectedId) return
    sendMessage(selectedId, message.trim())
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleCreateConversation = () => {
    if (!newContact.name || !newContact.phone) return
    createConversation(newContact)
    setShowNewConvModal(false)
    setNewContact({ name: '', phone: '', company: '' })
    success('Conversa criada!', `Nova conversa com ${newContact.name}`)
  }

  const handleArchive = (id: string) => {
    archiveConversation(id)
    info('Conversa arquivada')
    if (selectedId === id && conversations.length > 1) {
      const next = conversations.find(c => c.id !== id)
      if (next) setSelectedId(next.id)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'new') return <Badge variant="info" className="text-[10px]">Novo Lead</Badge>
    if (status === 'active') return <Badge variant="success" className="text-[10px]">Em Atendimento</Badge>
    return <Badge variant="secondary" className="text-[10px]">Finalizado</Badge>
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Contact List */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col bg-card/30">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 h-8 text-xs" />
            </div>
            <Button size="icon" variant="gradient" className="h-8 w-8 shrink-0" onClick={() => setShowNewConvModal(true)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquareEmpty />
              <p className="text-xs mt-2">Nenhuma conversa encontrada</p>
            </div>
          )}
          {filtered.map(conv => (
            <motion.button key={conv.id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              onClick={() => handleSelect(conv)}
              className={`w-full flex items-center gap-3 p-3 border-b border-border/50 text-left transition-colors group ${selectedId === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-xs font-semibold">
                    {conv.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {conv.status === 'active' && <StatusDot status="active" className="absolute -bottom-0.5 -right-0.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">{conv.contact.name}</p>
                  <p className="text-[10px] text-muted-foreground shrink-0">{getRelativeTime(new Date(conv.lastMessageTime))}</p>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || '—'}</p>
                <div className="flex items-center gap-2 mt-1">
                  {statusBadge(conv.status)}
                  {conv.agentName && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Bot className="w-3 h-3" />{conv.agentName}</span>}
                </div>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center shrink-0">{conv.unread}</span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selected ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card/30 shrink-0">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-xs font-semibold">
                {selected.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold">{selected.contact.name}</p>
              <p className="text-xs text-muted-foreground">{selected.contact.company} · {selected.contact.phone}</p>
            </div>
            <div className="flex items-center gap-1">
              {selected.agentName && <Badge variant="purple" className="text-xs gap-1 mr-2"><Bot className="w-3 h-3" />{selected.agentName}</Badge>}
              {/* Status toggle */}
              <select
                value={selected.status}
                onChange={e => updateConversationStatus(selected.id, e.target.value as any)}
                className="text-xs bg-accent border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none mr-2"
              >
                <option value="new">Novo Lead</option>
                <option value="active">Em Atendimento</option>
                <option value="closed">Finalizado</option>
              </select>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleArchive(selected.id)}><Archive className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 relative"
          >
            {/* Date separator */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground px-2">Hoje</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <AnimatePresence initial={false}>
              {selected.messages.map((msg, i) => {
                const isUser = msg.sender === 'user'
                const agentProfile = agentProfiles[selected.agentName ?? ''] ?? agentProfiles['Aria']
                const agentColor = agentProfile.color

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i < 6 ? i * 0.035 : 0, duration: 0.25 }}
                    className={`flex ${isUser ? 'justify-start' : 'justify-end'} items-end gap-2.5`}
                  >
                    {isUser && (
                      <Avatar className="w-7 h-7 shrink-0 mb-1">
                        <AvatarFallback className="bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-[10px] font-bold">
                          {selected.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`flex flex-col gap-1 max-w-[72%] ${isUser ? 'items-start' : 'items-end'}`}>
                      {/* Sender label */}
                      <span className="text-[10px] text-muted-foreground px-1">
                        {isUser ? selected.contact.name.split(' ')[0] : `${selected.agentName ?? 'IA'} · Agente`}
                      </span>

                      <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                        isUser
                          ? 'bg-accent rounded-tl-none'
                          : 'text-white rounded-tr-none'
                      }`}
                        style={!isUser ? { background: `linear-gradient(135deg, ${agentColor}dd, ${agentColor}99)` } : undefined}
                      >
                        {/* Message text — suporta quebra de linha */}
                        {msg.content.split('\n\n').map((para, pi) => (
                          <p key={pi} className={`text-sm leading-relaxed ${pi > 0 ? 'mt-2' : ''}`}>
                            {para}
                          </p>
                        ))}
                        <p className={`text-[10px] mt-1.5 ${isUser ? 'text-muted-foreground' : 'text-white/50'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {msg.status === 'read' && !isUser && ' · lida'}
                        </p>
                      </div>
                    </div>

                    {!isUser && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1 text-white text-xs font-bold shadow-md"
                        style={{ background: agentColor }}
                      >
                        {(selected.agentName ?? 'IA')[0]}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* AI Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex items-end gap-2.5 justify-end"
                >
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-muted-foreground px-1">
                      {selected.agentName ?? 'IA'} · digitando...
                    </span>
                    <div className="bg-gradient-to-br from-violet-600/60 to-blue-600/60 rounded-2xl rounded-tr-none px-5 py-3 flex items-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.18, ease: 'easeInOut' }}
                          className="w-2 h-2 bg-white/80 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 mb-6 text-white text-xs font-bold shadow-md">
                    {(selected.agentName ?? 'IA')[0]}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollDown && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-4 w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-accent transition-colors z-10"
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card/30 shrink-0">
            <div className="flex items-center gap-2 bg-accent rounded-xl px-4 py-2">
              <button className="text-muted-foreground hover:text-foreground transition-colors"><Smile className="w-5 h-5" /></button>
              <button className="text-muted-foreground hover:text-foreground transition-colors"><Paperclip className="w-5 h-5" /></button>
              <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem... (Enter para enviar)"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <Button size="icon" variant="gradient" className="h-8 w-8 shrink-0 rounded-lg" onClick={handleSend} disabled={!message.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {selected.status === 'closed' && (
              <p className="text-[10px] text-center text-muted-foreground mt-2">Esta conversa está finalizada</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Selecione uma conversa</p>
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      <Modal open={showNewConvModal} onClose={() => setShowNewConvModal(false)} title="Nova Conversa" size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome *</label>
            <Input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} placeholder="Nome do contato" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Telefone *</label>
            <Input value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} placeholder="+55 11 99999-9999" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Empresa</label>
            <Input value={newContact.company} onChange={e => setNewContact(p => ({ ...p, company: e.target.value }))} placeholder="Nome da empresa" className="h-9 text-sm" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewConvModal(false)}>Cancelar</Button>
            <Button variant="gradient" size="sm" onClick={handleCreateConversation} disabled={!newContact.name || !newContact.phone}>Iniciar Conversa</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function MessageSquareEmpty() {
  return <Bot className="w-8 h-8 opacity-20" />
}
