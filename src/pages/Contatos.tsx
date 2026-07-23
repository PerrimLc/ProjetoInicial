import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Users, Phone, Mail, UserX, MessageSquare, Briefcase } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ContatoForm, type ContatoFormData } from '@/features/contatos/ContatoForm'
import { useContatos } from '@/hooks/useContatos'
import { useEtiquetas } from '@/hooks/useEtiquetas'
import { useConversas } from '@/hooks/useConversas'
import { useToast } from '@/components/ui/toast'
import type { Contato } from '@/types'

export function Contatos() {
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const {
    contatos,
    carregando,
    carregandoMais,
    erro,
    temMais,
    busca,
    setBusca,
    carregarMais,
    criarContato,
    atualizarContato,
    inativarContato,
  } = useContatos()

  const { etiquetas } = useEtiquetas()
  const { criarConversa } = useConversas()

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Contato | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [inativarId, setInativarId] = useState<string | null>(null)

  const etiquetaMap = Object.fromEntries(etiquetas.map((e) => [e.id, e]))

  const handleSalvar = async (dados: ContatoFormData) => {
    setSalvando(true)
    try {
      if (editando) {
        await atualizarContato(editando.id, dados)
        success('Contato atualizado!')
      } else {
        await criarContato({
          ...dados,
          ativo: true,
          etiquetaIds: dados.etiquetaIds ?? [],
        })
        success('Contato cadastrado!')
      }
      setShowModal(false)
      setEditando(null)
    } catch (e) {
      toastError('Erro ao salvar contato', (e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const handleNovaConversa = async (contato: Contato) => {
    try {
      await criarConversa({
        contatoId: contato.id,
        contatoNome: contato.nome,
        telefone: contato.telefone,
        status: 'aguardando',
        ultimaMensagem: '',
        ultimaMensagemEm: new Date(),
        mensagensNaoLidas: 0,
        etiquetaIds: [],
        origem: 'simulacao',
      })
      success('Conversa criada!')
      navigate('/atendimento')
    } catch (e) {
      toastError('Erro ao criar conversa', (e as Error).message)
    }
  }

  const handleInativar = async () => {
    if (!inativarId) return
    try {
      await inativarContato(inativarId)
      success('Contato inativado.')
    } catch (e) {
      toastError('Erro ao inativar', (e as Error).message)
    } finally {
      setInativarId(null)
    }
  }

  const openEditar = (contato: Contato) => {
    setEditando(contato)
    setShowModal(true)
  }

  const ativos = contatos.filter((c) => c.ativo)
  const inativos = contatos.filter((c) => !c.ativo)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Contatos', value: contatos.length, color: 'text-violet-400' },
          { label: 'Ativos', value: ativos.length, color: 'text-emerald-400' },
          { label: 'Inativos', value: inativos.length, color: 'text-zinc-400' },
          { label: 'Com Etiquetas', value: contatos.filter((c) => c.etiquetaIds?.length > 0).length, color: 'text-blue-400' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{carregando ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="pl-9 h-8 text-xs"
            />
          </div>
          <Button
            size="sm"
            variant="gradient"
            className="h-8 text-xs gap-1.5 ml-auto"
            onClick={() => { setEditando(null); setShowModal(true) }}
          >
            <Plus className="w-3.5 h-3.5" /> Novo Contato
          </Button>
        </div>

        {/* List */}
        {erro ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-sm text-red-400">Erro ao carregar contatos: {erro}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        ) : carregando ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : contatos.length === 0 ? (
          <EmptyState
            icon={Users}
            titulo="Nenhum contato encontrado"
            descricao={busca ? 'Tente outra busca.' : 'Adicione seu primeiro contato para começar.'}
            acao={{ label: 'Novo Contato', onClick: () => { setEditando(null); setShowModal(true) } }}
          />
        ) : (
          <div className="divide-y divide-border">
            {contatos.map((contato, i) => (
              <motion.div
                key={contato.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors ${!contato.ativo ? 'opacity-50' : ''}`}
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="text-sm bg-gradient-to-br from-violet-500/20 to-blue-500/20 font-semibold">
                    {contato.nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{contato.nome}</p>
                    {!contato.ativo && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inativo</Badge>
                    )}
                    {contato.etiquetaIds?.map((eid) => {
                      const et = etiquetaMap[eid]
                      if (!et) return null
                      return (
                        <span
                          key={eid}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ backgroundColor: et.cor + '22', color: et.cor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: et.cor }} />
                          {et.nome}
                        </span>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                    {contato.telefone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />{contato.telefone}
                      </span>
                    )}
                    {contato.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />{contato.email}
                      </span>
                    )}
                    {contato.empresa && (
                      <span className="text-xs text-muted-foreground">{contato.empresa}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Iniciar conversa"
                    onClick={() => handleNovaConversa(contato)}
                    disabled={!contato.ativo}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Editar"
                    onClick={() => openEditar(contato)}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                  </Button>
                  {contato.ativo && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                      title="Inativar"
                      onClick={() => setInativarId(contato.id)}
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load more */}
        {temMais && (
          <div className="p-4 border-t border-border text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarMais}
              disabled={carregandoMais}
            >
              {carregandoMais ? 'Carregando...' : 'Carregar mais'}
            </Button>
          </div>
        )}
      </div>

      {/* Modal cadastro/edição */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditando(null) }}
        title={editando ? 'Editar Contato' : 'Novo Contato'}
        size="md"
      >
        <ContatoForm
          contato={editando ?? undefined}
          onSalvar={handleSalvar}
          onCancelar={() => { setShowModal(false); setEditando(null) }}
          salvando={salvando}
        />
      </Modal>

      {/* Confirm inativar */}
      <ConfirmModal
        open={!!inativarId}
        onClose={() => setInativarId(null)}
        onConfirm={handleInativar}
        title="Inativar Contato"
        message="O contato ficará inativo e não aparecerá nas buscas. Você pode reativá-lo depois."
        confirmLabel="Inativar"
        danger
      />
    </motion.div>
  )
}
