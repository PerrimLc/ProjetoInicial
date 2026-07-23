import { motion } from 'framer-motion'
import {
  MessageSquare, Users, TrendingUp, DollarSign,
  RefreshCw, ArrowRight, AlertCircle, Phone
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useDashboard } from '@/hooks/useDashboard'
import { useEtapasFunil } from '@/hooks/useEtapasFunil'
import { useNegocios } from '@/hooks/useNegocios'
import { formatCurrency } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export function Dashboard() {
  const { metricas, carregando, erro, recarregar, ultimosContatos, ultimosNegocios } = useDashboard()
  const { etapas } = useEtapasFunil()
  const { negocios } = useNegocios()

  // negócios por etapa para gráfico de barras
  const negociosPorEtapa = etapas
    .filter((e) => e.ativo)
    .map((e) => ({
      nome: e.nome,
      total: negocios.filter((n) => n.etapaId === e.id && n.status === 'aberto').length,
    }))
  const maxEtapa = Math.max(...negociosPorEtapa.map((e) => e.total), 1)

  // conversas por status
  const totalConversas = (metricas?.conversasAguardando ?? 0)
    + (metricas?.conversasEmAtendimento ?? 0)
    + (metricas?.conversasFinalizadas ?? 0)

  const statusConversas = [
    { label: 'Aguardando', value: metricas?.conversasAguardando ?? 0, color: 'bg-amber-500' },
    { label: 'Em Atendimento', value: metricas?.conversasEmAtendimento ?? 0, color: 'bg-violet-500' },
    { label: 'Finalizadas', value: metricas?.conversasFinalizadas ?? 0, color: 'bg-emerald-500' },
  ]

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm text-muted-foreground">Erro ao carregar o dashboard</p>
        <Button variant="outline" size="sm" onClick={recarregar} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto"
    >
      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Contatos Ativos',
            value: metricas?.contatosAtivos ?? 0,
            icon: Users,
            color: 'from-violet-600 to-violet-400',
            bg: 'bg-violet-500/10',
          },
          {
            title: 'Negócios Abertos',
            value: metricas?.negociosAbertos ?? 0,
            icon: TrendingUp,
            color: 'from-blue-600 to-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            title: 'Conversas Abertas',
            value: (metricas?.conversasAguardando ?? 0) + (metricas?.conversasEmAtendimento ?? 0),
            icon: MessageSquare,
            color: 'from-amber-600 to-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            title: 'Pipeline Total',
            value: formatCurrency(metricas?.valorTotalAbertos ?? 0),
            icon: DollarSign,
            color: 'from-emerald-600 to-emerald-400',
            bg: 'bg-emerald-500/10',
            isCurrency: true,
          },
        ].map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className="w-4 h-4 text-foreground/80" />
                </div>
              </div>
              {carregando ? (
                <Skeleton className="h-8 w-24 mb-1" />
              ) : (
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.title}</p>
              <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${kpi.color} w-2/3`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Negócios por etapa — barra CSS */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Negócios por Etapa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {negociosPorEtapa.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma etapa configurada</p>
              ) : (
                negociosPorEtapa.map((e) => (
                  <div key={e.nome} className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground w-28 truncate shrink-0">{e.nome}</p>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(e.total / maxEtapa) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                      />
                    </div>
                    <span className="text-xs font-semibold w-5 text-right">{e.total}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Conversas por status — barras horizontais */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Conversas por Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carregando ? (
                <>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </>
              ) : (
                statusConversas.map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.color}`} />
                    <p className="text-xs text-muted-foreground w-28 shrink-0">{s.label}</p>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: totalConversas ? `${(s.value / totalConversas) * 100}%` : '0%' }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${s.color}`}
                      />
                    </div>
                    <span className="text-xs font-semibold w-5 text-right">{s.value}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Listas recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos contatos */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Últimos Contatos</CardTitle>
                <Link to="/contatos">
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {carregando ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : ultimosContatos.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum contato ainda</p>
              ) : (
                <div className="divide-y divide-border">
                  {ultimosContatos.map((c) => (
                    <Link
                      key={c.id}
                      to="/contatos"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                        {c.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.nome}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />{c.telefone}
                        </p>
                      </div>
                      {!c.ativo && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inativo</Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Últimos negócios */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Últimos Negócios</CardTitle>
                <Link to="/crm">
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {carregando ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : ultimosNegocios.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum negócio ainda</p>
              ) : (
                <div className="divide-y divide-border">
                  {ultimosNegocios.map((n) => (
                    <Link
                      key={n.id}
                      to="/crm"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                        {n.titulo.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.titulo}</p>
                        <p className="text-xs text-muted-foreground">{n.contatoNome}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {(n.valor ?? 0) > 0 && (
                          <p className="text-sm font-semibold text-emerald-400">{formatCurrency(n.valor ?? 0)}</p>
                        )}
                        <Badge
                          variant={n.status === 'ganho' ? 'success' : n.status === 'perdido' ? 'destructive' : 'secondary'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {n.status === 'ganho' ? 'Ganho' : n.status === 'perdido' ? 'Perdido' : 'Aberto'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
