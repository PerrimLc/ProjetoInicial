import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, MessageSquare, Users, BarChart3, Settings,
  User, ChevronLeft, ChevronRight, Zap, LogOut,
  BookOpen, BarChart2, UserCheck, Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusDot } from '@/components/ui/status-dot'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissao } from '@/hooks/usePermissao'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { membro, logout } = useAuth()
  const permissao = usePermissao()

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/', show: true },
    { icon: MessageSquare, label: 'Atendimento', to: '/atendimento', show: true },
    { icon: Users, label: 'Contatos', to: '/contatos', show: true },
    { icon: BarChart2, label: 'CRM', to: '/crm', show: true },
    { icon: Calendar, label: 'Agenda', to: '/agenda', show: true },
    { icon: BookOpen, label: 'Respostas Rápidas', to: '/respostas-rapidas', show: true },
    {
      icon: BarChart3,
      label: 'Relatórios',
      to: '/relatorios',
      show: permissao.podeVisualizarRelatorios(),
    },
    {
      icon: UserCheck,
      label: 'Equipe',
      to: '/equipe',
      show: permissao.podeVisualizarRelatorios(), // supervisors and admins
    },
    {
      icon: Settings,
      label: 'Configurações',
      to: '/configuracoes',
      show: permissao.podeGerenciarConfiguracoes(),
    },
  ].filter((item) => item.show)

  const bottomItems = [
    { icon: User, label: 'Perfil', to: '/profile' },
  ]

  const nome = membro?.nome ?? ''
  const papel = membro?.papel ?? ''
  const papelLabel: Record<string, string> = {
    administrador: 'Administrador',
    supervisor: 'Supervisor',
    atendente: 'Atendente',
  }

  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase() || 'AN'

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-card border-r border-border overflow-hidden shrink-0 z-30"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <span className="font-bold text-sm gradient-text">AgentAI</span>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Platform</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
          return (
            <NavLink key={item.to} to={item.to}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
                  />
                )}
                <div className="relative shrink-0">
                  <item.icon className={cn('w-4 h-4', isActive && 'text-primary')} />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium truncate flex-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-2 border-t border-border space-y-0.5">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <NavLink key={item.to} to={item.to}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </NavLink>
          )
        })}

        {/* User card */}
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-2 mt-1 rounded-lg bg-accent/50',
            collapsed && 'justify-center px-0'
          )}
        >
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
            <StatusDot status="active" className="absolute -bottom-0.5 -right-0.5" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0 flex-1"
              >
                <p className="text-xs font-semibold truncate">{nome || 'Usuário'}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {papelLabel[papel] ?? papel}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={() => logout()}
              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors shadow-md"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </motion.aside>
  )
}
