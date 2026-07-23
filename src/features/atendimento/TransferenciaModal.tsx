import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMembros } from '@/hooks/useMembros'
import { useSetores } from '@/hooks/useSetores'

type Modo = 'atendente' | 'setor'

interface TransferenciaModalProps {
  open: boolean
  onClose: () => void
  onTransferir: (params: { atendenteId?: string; setorId?: string }) => Promise<void>
  atendenteAtualId?: string
  setorAtualId?: string
}

export function TransferenciaModal({
  open, onClose, onTransferir,
  atendenteAtualId, setorAtualId
}: TransferenciaModalProps) {
  const { membros } = useMembros()
  const { setores } = useSetores()

  const [modo, setModo] = useState<Modo>('atendente')
  const [selecionado, setSelecionado] = useState<string>('')
  const [transferindo, setTransferindo] = useState(false)

  const handleTransferir = async () => {
    if (!selecionado) return
    setTransferindo(true)
    try {
      if (modo === 'atendente') {
        await onTransferir({ atendenteId: selecionado })
      } else {
        await onTransferir({ setorId: selecionado })
      }
      onClose()
      setSelecionado('')
    } finally {
      setTransferindo(false)
    }
  }

  const atendentesAtivos = membros.filter(m => m.ativo && m.usuarioId !== atendenteAtualId)
  const setoresAtivos = setores.filter(s => s.ativo && s.id !== setorAtualId)

  return (
    <Modal open={open} onClose={onClose} title="Transferir Conversa" size="sm">
      <div className="space-y-4">
        {/* Toggle atendente / setor */}
        <div className="flex items-center bg-accent/60 rounded-xl p-1">
          {(['atendente', 'setor'] as const).map(m => (
            <button key={m} onClick={() => { setModo(m); setSelecionado('') }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                modo === m
                  ? 'bg-card shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {m === 'atendente' ? '👤 Atendente' : '🏢 Setor'}
            </button>
          ))}
        </div>

        {/* Lista de opções */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {modo === 'atendente' ? (
            atendentesAtivos.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum atendente disponível
              </p>
            ) : (
              atendentesAtivos.map(m => (
                <button key={m.usuarioId} onClick={() => setSelecionado(m.usuarioId)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    selecionado === m.usuarioId
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-accent/40 hover:bg-accent border border-transparent'
                  }`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                    {m.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.nome}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                    {m.papel}
                  </Badge>
                </button>
              ))
            )
          ) : (
            setoresAtivos.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum setor disponível
              </p>
            ) : (
              setoresAtivos.map(s => (
                <button key={s.id} onClick={() => setSelecionado(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    selecionado === s.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-accent/40 hover:bg-accent border border-transparent'
                  }`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold">
                      {s.nome.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.nome}</p>
                    {s.descricao && (
                      <p className="text-xs text-muted-foreground truncate">{s.descricao}</p>
                    )}
                  </div>
                </button>
              ))
            )
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="gradient" size="sm" className="gap-1.5"
            onClick={handleTransferir}
            disabled={!selecionado || transferindo}>
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {transferindo ? 'Transferindo...' : 'Transferir'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
