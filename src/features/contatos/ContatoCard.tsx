import { useState } from 'react'
import { Phone, Mail, MessageSquare, Edit2, UserX, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ConfirmModal } from '@/components/ui/modal'
import type { Contato, Etiqueta } from '@/types'

interface ContatoCardProps {
  contato: Contato
  etiquetas: Etiqueta[]
  onEditar: (contato: Contato) => void
  onInativar: (id: string) => void
  onNovaConversa: (contato: Contato) => void
  onNovoNegocio?: (contato: Contato) => void
}

export function ContatoCard({
  contato,
  etiquetas,
  onEditar,
  onInativar,
  onNovaConversa,
  onNovoNegocio,
}: ContatoCardProps) {
  const [confirmInativar, setConfirmInativar] = useState(false)

  const etiquetaMap = Object.fromEntries(etiquetas.map((e) => [e.id, e]))

  const initials = contato.nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <>
      <div
        className={`bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:shadow-black/10 transition-all group ${
          !contato.ativo ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback className="text-sm bg-gradient-to-br from-violet-500/20 to-blue-500/20 font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold truncate">{contato.nome}</p>
              {!contato.ativo && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Inativo
                </Badge>
              )}
            </div>

            {contato.empresa && (
              <p className="text-xs text-muted-foreground">{contato.empresa}</p>
            )}

            <div className="mt-2 space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                {contato.telefone}
              </p>
              {contato.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  {contato.email}
                </p>
              )}
            </div>

            {/* Etiquetas */}
            {(contato.etiquetaIds?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {contato.etiquetaIds.map((eid) => {
                  const et = etiquetaMap[eid]
                  if (!et) return null
                  return (
                    <span
                      key={eid}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ backgroundColor: et.cor + '22', color: et.cor }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: et.cor }}
                      />
                      {et.nome}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 flex-1"
            onClick={() => onNovaConversa(contato)}
            disabled={!contato.ativo}
          >
            <MessageSquare className="w-3 h-3" /> Conversar
          </Button>
          {onNovoNegocio && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 flex-1"
              onClick={() => onNovoNegocio(contato)}
              disabled={!contato.ativo}
            >
              <Briefcase className="w-3 h-3" /> Negócio
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEditar(contato)}
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          {contato.ativo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => setConfirmInativar(true)}
            >
              <UserX className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmInativar}
        onClose={() => setConfirmInativar(false)}
        onConfirm={() => { onInativar(contato.id); setConfirmInativar(false) }}
        title="Inativar Contato"
        message={`Inativar "${contato.nome}"? O contato não aparecerá nas buscas mas pode ser reativado.`}
        confirmLabel="Inativar"
        danger
      />
    </>
  )
}
