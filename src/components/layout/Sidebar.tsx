import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, MessageSquare, Users, Bot, Workflow,
  BarChart3, Settings, User, ChevronLeft, ChevronRight,
  Calendar, BookOpen, CreditCard, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusDot } from '@/components/ui/status-dot'
import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import logoIcon from '@/assets/logo-icon.png'
import logoFull from '@/assets/logo-white.png'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { conversations, profile, logout } = useApp()

  const unreadConversations = conversations.filter(c => c.unread > 0).length

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: MessageSquare, label: 'Conversas', to: '/conversations', badge: unreadConversations || undefined },
    { icon: Users, label: 'Leads', to: '/leads' },
    { icon: Bot, label: 'Agentes IA', to: '/agents' },
    { icon: Workflow, label: 'Fluxos', to: '/flows' },
    { icon: CreditCard, label: 'CRM', to: '/crm' },
    { icon: Calendar, label: 'Agenda', to: '/agenda' },
    { icon: BookOpen, label: 'Base de Conhecimento', to: '/knowledge' },
    { icon: BarChart3, label: 'Analytics', to: '/analytics' },
  ]

  const bottomItems = [
    { icon: Settings, label: 'Configurações', to: '/settings' },
    { icon: User, label: 'Perfil', to: '/profile' },
  ]

  const initials = `${profile.name?.[0] ?? 'A'}${profile.lastName?.[0] ?? 'N'}`.toUpperCase()

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-card border-r border-border overflow-hidden shrink-0 z-30"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30 p-1.5">
            <img src={logoIcon} alt="AgentAI" className="w-full h-full object-contain" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <img src={logoFull} alt="AgentAI Platform" className="h-6 w-auto" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
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
                  {collapsed && item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
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
                {!collapsed && item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
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
              <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}>
                <item.icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </NavLink>
          )
        })}

        {/* User card */}
        <div className={cn('flex items-center gap-2 px-2 py-2 mt-1 rounded-lg bg-accent/50', collapsed && 'justify-center px-0')}>
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
            <StatusDot status="active" className="absolute -bottom-0.5 -right-0.5" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{profile.name} {profile.lastName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{profile.role || 'Admin'}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={logout}
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
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
          : <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        }
      </button>
    </motion.aside>
  )
}
