import { motion } from 'framer-motion'
import { MessageSquare, TrendingUp, Users, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useDashboard } from '@/hooks/useDashboard'
import { useNegocios } from '@/hooks/useNegocios'
import { useMembros } from '@/hooks/useMembros'
import { useEtapasFunil } from '@/hooks/useEtapasFunil'
import { formatCurrency } from '@/lib/utils'

export function Relatorios() {
  const { metricas, carregando, erro, recarregar } = useDashboard()
  const { negocios } = useNegocios()
  const { membros } = useMembros()
  const { etapas } = useEtapasFunil()

  const totalConversas = (metricas?.conversasAguardando ?? 0) +
    (metricas?.conversasEmAtendimento ?? 0) +
    (metricas?.conversasFinalizadas ?? 0)

  const taxaFinalizacao = totalConversas > 0
    ? Math.round(((metricas?.conversasFinalizadas ?? 0) / totalConversas) * 100)
    : 0

  // Negócios por responsável
  const negociosPorMembro = membros
    .filter(m => m.ativo)
    .map(m => ({
      nome: m.nome,
      total: negocios.filter(n => n.responsavelId === m.usuarioId).length,
      valor: negocios.filter(n => n.responsavelId === m.usuarioId).reduce((s, n) => s + (n.valor ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total)

  // Taxa de conversão por etapa
  const conversaoPorEtapa = etapas
    .filter(e => e.ativo)
    .map(e => {
      const total = negocios.filter(n => n.etapaId === e.id).length
      const ganhos = negocios.filter(n => n.etapaId === e.id && n.status === 'ganho').length
      return { nome: e.nome, total, ganhos, taxa: total > 0 ? Math.round((ganhos / total) * 100) : 0 }
    })

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-muted-foreground">Erro ao carregar relatórios</p>
        <Button variant="outline" size="sm" onClick={recarregar} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-base font-semibold">Relatórios</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Visão geral do desempenho operacional</p>
      </div>

      {/* KPIs de conversas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Conversas', value: totalConversas, icon: MessageSquare, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Aguardando', value: metricas?.conversasAguardando ?? 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Finalizadas', value: metricas?.conversasFinalizadas ?? 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Taxa Finalização', value: `${taxaFinalizacao}%`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <kpi.icon className="w-4 h-4 text-foreground/70" />
              </div>
              {carregando ? <Skeleton className="h-7 w-16 mb-1" /> : (
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Negócios por responsável */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> Negócios por Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            {negociosPorMembro.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {negociosPorMembro.slice(0, 8).map(m => {
                  const maxTotal = Math.max(...negociosPorMembro.map(n => n.total), 1)
                  return (
                    <div key={m.nome} className="flex items-center gap-3">
                      <p className="text-xs text-muted-foreground w-28 truncate shrink-0">{m.nome.split(' ')[0]}</p>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }}
                          animate={{ width: `${(m.total / maxTotal) * 100}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />
                      </div>
                      <span className="text-xs font-semibold w-5 text-right shrink-0">{m.total}</span>
                      <span className="text-xs text-emerald-400 w-24 text-right shrink-0 hidden sm:block">
                        {formatCurrency(m.valor)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversão por etapa */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Taxa de Conversão por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversaoPorEtapa.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {conversaoPorEtapa.map(e => (
                  <div key={e.nome} className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground w-32 truncate shrink-0">{e.nome}</p>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }}
                        animate={{ width: `${e.taxa}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    </div>
                    <span className="text-xs font-semibold w-10 text-right shrink-0">{e.taxa}%</span>
                    <span className="text-xs text-muted-foreground w-14 text-right shrink-0 hidden sm:block">
                      {e.total} negóc.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo CRM */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Negócios Abertos', value: negocios.filter(n => n.status === 'aberto').length, color: 'text-foreground' },
          { label: 'Negócios Ganhos', value: negocios.filter(n => n.status === 'ganho').length, color: 'text-emerald-400' },
          { label: 'Negócios Perdidos', value: negocios.filter(n => n.status === 'perdido').length, color: 'text-red-400' },
          { label: 'Pipeline Total', value: formatCurrency(metricas?.valorTotalAbertos ?? 0), color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
