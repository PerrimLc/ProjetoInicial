import { cn } from '@/lib/utils'

interface StatusDotProps {
  status: 'active' | 'inactive' | 'training' | 'online' | 'offline'
  className?: string
  showLabel?: boolean
}

const statusConfig = {
  active: { color: 'bg-emerald-500', label: 'Ativo', pulse: true },
  online: { color: 'bg-emerald-500', label: 'Online', pulse: true },
  inactive: { color: 'bg-zinc-500', label: 'Inativo', pulse: false },
  offline: { color: 'bg-zinc-500', label: 'Offline', pulse: false },
  training: { color: 'bg-amber-500', label: 'Treinando', pulse: true },
}

export function StatusDot({ status, className, showLabel = false }: StatusDotProps) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', config.color)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', config.color)} />
      </span>
      {showLabel && <span className="text-xs text-muted-foreground">{config.label}</span>}
    </span>
  )
}
