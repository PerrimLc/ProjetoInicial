import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useMembros } from '@/hooks/useMembros'

const papelLabel: Record<string, string> = {
  administrador: 'Administrador',
  supervisor: 'Supervisor',
  atendente: 'Atendente',
}
const papelVariant: Record<string, 'destructive' | 'warning' | 'secondary'> = {
  administrador: 'destructive',
  supervisor: 'warning',
  atendente: 'secondary',
}

export function Equipe() {
  const { membros, carregando } = useMembros()
  const ativos = membros.filter(m => m.ativo)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 max-w-[900px] mx-auto">
      <div>
        <h2 className="text-base font-semibold">Equipe</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{ativos.length} membro{ativos.length !== 1 ? 's' : ''} ativo{ativos.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {carregando ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))
        ) : ativos.length === 0 ? (
          <div className="col-span-3">
            <EmptyState icon={Users} titulo="Nenhum membro ativo"
              descricao="Adicione membros em Configurações > Equipe." />
          </div>
        ) : (
          ativos.map((m, i) => (
            <motion.div key={m.usuarioId}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:shadow-black/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-base font-bold">
                    {m.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Badge variant={papelVariant[m.papel] ?? 'secondary'} className="text-[10px] px-1.5 py-0">
                  {papelLabel[m.papel] ?? m.papel}
                </Badge>
              </div>
              <p className="text-sm font-semibold truncate">{m.nome}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{m.email}</p>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
