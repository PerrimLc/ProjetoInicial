import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateAcao {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon: LucideIcon
  titulo: string
  descricao: string
  acao?: EmptyStateAcao
}

export function EmptyState({ icon: Icon, titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold mb-1">{titulo}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{descricao}</p>
      {acao && (
        <Button
          size="sm"
          variant="default"
          className="mt-4"
          onClick={acao.onClick}
        >
          {acao.label}
        </Button>
      )}
    </div>
  )
}
