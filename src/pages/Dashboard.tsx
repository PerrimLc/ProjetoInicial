import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare, Users, TrendingUp, Clock, DollarSign, Bot,
  ArrowUpRight, ArrowDownRight, ExternalLink, MoreHorizontal
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusDot } from '@/components/ui/status-dot'
import { Progress } from '@/components/ui/progress'
import { useApp } from '@/contexts/AppContext'
import { conversationChartData, conversionChartData } from '@/data/mock'
import { formatCurrency, formatNumber, getRelativeTime } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.stroke }}>
            {p.value > 1000 ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function Dashboard() {
  const { conversations, leads, agents, kanbanColumns } = useApp()
  const navigate = useNavigate()

  // ─── Computed KPIs ───────────────────────────────────────
  const kpis = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayConversations = conversations.filter(c => new Date(c.lastMessageTime) >= today).length
    const totalLeads = leads.length
    const closedLeads = leads.filter(l => l.status === 'closed').length
    const convRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0
    const totalRevenue = kanbanColumns.find(c => c.id === 'closed')?.cards.reduce((s, c) => s + c.value, 0) ?? 0
    const activeAgents = agents.filter(a => a.status === 'active').length

    return [
      { title: 'Conversas Hoje', value: String(todayConversations || conversations.length), change: '+18.2%', positive: true, icon: MessageSquare, color: 'from-violet-600 to-violet-400', bg: 'bg-violet-500/10' },
      { title: 'Leads Capturados', value: String(totalLeads), change: '+12.5%', positive: true, icon: Users, color: 'from-blue-600 to-blue-400', bg: 'bg-blue-500/10' },
      { title: 'Taxa de Conversão', value: `${convRate.toFixed(1)}%`, change: '+6.8%', positive: true, icon: TrendingUp, color: 'from-emerald-600 to-emerald-400', bg: 'bg-emerald-500/10' },
      { title: 'Tempo Médio', value: '1m 42s', change: '-8.3%', positive: true, icon: Clock, color: 'from-amber-600 to-amber-400', bg: 'bg-amber-500/10' },
      { title: 'Vendas Realizadas', value: formatCurrency(totalRevenue || 142000), change: '+31.2%', positive: true, icon: DollarSign, color: 'from-pink-600 to-pink-400', bg: 'bg-pink-500/10' },
      { title: 'Agentes Ativos', value: String(activeAgents), change: '+1 novo', positive: true, icon: Bot, color: 'from-cyan-600 to-cyan-400', bg: 'bg-cyan-500/10' },
    ]
  }, [conversations, leads, agents, kanbanColumns])

  // ─── Agent usage for pie ─────────────────────────────────
  const agentUsage = useMemo(() => {
    const total = agents.reduce((s, a) => s + a.conversations, 0) || 1
    return agents.slice(0, 5).map(a => ({
      name: a.name.split(' ')[0],
      value: Math.round((a.conversations / total) * 100),
      color: a.color,
    }))
  }, [agents])

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto"
    >
      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg hover:shadow-black/20 transition-all duration-300 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className="w-4 h-4 text-foreground/80" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-bold tracking-tight truncate">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{stat.title}</p>
              <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.random() * 40 + 50}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div variants={item} className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-sm">Evolução de Conversas</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Últimos 7 dias</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" />Total</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Resolvidas</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={conversationChartData}>
                  <defs>
                    <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#cg1)" />
                  <Area type="monotone" dataKey="value2" stroke="#3B82F6" strokeWidth={2} fill="url(#cg2)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Uso por Agente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={agentUsage} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                      {agentUsage.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {agentUsage.map(agent => (
                  <div key={agent.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: agent.color }} />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{agent.name}</span>
                    <Progress value={agent.value} className="flex-1 h-1" />
                    <span className="text-xs font-medium w-8 text-right">{agent.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Conversations */}
        <motion.div variants={item} className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Últimas Conversas</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate('/conversations')}>
                  Ver todas <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {conversations.slice(0, 5).map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => navigate('/conversations')}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-xs font-semibold">
                        {conv.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{conv.contact.name}</p>
                        <span className="text-xs text-muted-foreground hidden sm:block">{conv.contact.company}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || '—'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-[10px] text-muted-foreground">{getRelativeTime(new Date(conv.lastMessageTime))}</p>
                      <Badge variant={conv.status === 'new' ? 'info' : conv.status === 'active' ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {conv.status === 'new' ? 'Novo' : conv.status === 'active' ? 'Ativo' : 'Finalizado'}
                      </Badge>
                    </div>
                    {conv.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Agent Status */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Status dos Agentes</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/agents')}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {agents.slice(0, 6).map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/agents')}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: agent.color }}>
                    {agent.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{agent.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-muted-foreground">{formatNumber(agent.conversations)} conv.</p>
                  </div>
                  <StatusDot status={agent.status} showLabel />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue chart */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm">Taxa de Conversão Mensal</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Leads convertidos em clientes — 2024</p>
              </div>
              <Badge variant="success" className="text-xs">+9.1% vs mês anterior</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={conversionChartData}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
