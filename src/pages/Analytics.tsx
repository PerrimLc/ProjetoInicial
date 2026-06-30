import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, BarChart3, Clock, MessageSquare, Users, Download, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/components/ui/toast'
import { revenueChartData, conversionChartData, conversationChartData, agentUsageData } from '@/data/mock'
import { formatCurrency, formatNumber } from '@/lib/utils'

const periods = ['Hoje', '7 dias', '30 dias', '90 dias', '12 meses']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-2xl">
        <p className="text-xs text-muted-foreground mb-2 font-medium">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color || p.stroke }}>
            {p.value > 1000 ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function Analytics() {
  const { leads, conversations, agents, kanbanColumns } = useApp()
  const { success } = useToast()
  const [activePeriod, setActivePeriod] = useState(2)
  const [refreshing, setRefreshing] = useState(false)

  const dynamicKpis = useMemo(() => {
    const closedValue = kanbanColumns.find(c => c.id === 'closed')?.cards.reduce((s, c) => s + c.value, 0) ?? 0
    return [
      { label: 'Receita Total', value: formatCurrency(closedValue || 619000), change: '+31.2%', up: true, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      { label: 'Conversas', value: formatNumber(conversations.length), change: '+18.4%', up: true, icon: MessageSquare, color: 'text-violet-400', bg: 'bg-violet-500/10' },
      { label: 'Leads Gerados', value: formatNumber(leads.length), change: '+24.1%', up: true, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
      { label: 'Tempo Médio', value: '1m 42s', change: '-8.3%', up: true, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
      { label: 'Taxa Resolução', value: '94.2%', change: '+3.1%', up: true, icon: BarChart3, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
      { label: 'NPS Score', value: '87', change: '+5pts', up: true, icon: TrendingUp, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    ]
  }, [leads, conversations, kanbanColumns])

  const agentPieData = useMemo(() => {
    const total = agents.reduce((s, a) => s + a.conversations, 0) || 1
    return agents.slice(0, 5).map(a => ({
      name: a.name.split(' ')[0],
      value: Math.round((a.conversations / total) * 100),
      color: a.color,
    }))
  }, [agents])

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(r => setTimeout(r, 1000))
    setRefreshing(false)
    success('Dados atualizados!', 'Métricas sincronizadas com sucesso.')
  }

  const handleExport = () => {
    success('Exportação iniciada', 'O relatório será enviado para seu e-mail em instantes.')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 overflow-x-auto">
          {periods.map((p, i) => (
            <button
              key={p}
              onClick={() => setActivePeriod(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activePeriod === i
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> Exportar
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {dynamicKpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-xl font-bold truncate">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{kpi.label}</p>
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-1 ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Receita Mensal</CardTitle>
                  <p className="text-xs text-muted-foreground">2024 — acumulado</p>
                </div>
                <Badge variant="success" className="text-xs">+31.2% vs 2023</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#10B981' }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Conversas por Dia</CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" />Total</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Resolvidas</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={conversationChartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Total" maxBarSize={28} />
                  <Bar dataKey="value2" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Resolvidas" maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Taxa de Conversão Mensal</CardTitle>
                  <p className="text-xs text-muted-foreground">Leads convertidos em clientes</p>
                </div>
                <Badge variant="warning" className="text-xs">Meta: 35%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={conversionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 40]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2.5}
                    dot={{ fill: '#F59E0B', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#F59E0B' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Agentes Mais Utilizados</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={agentPieData} cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={3} dataKey="value">
                    {agentPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {agentPieData.map(a => (
                  <div key={a.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
                    <span className="text-muted-foreground flex-1 truncate">{a.name}</span>
                    <span className="font-semibold">{a.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
