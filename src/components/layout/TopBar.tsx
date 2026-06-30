import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, Plus, Command, X, Sun, Moon, Bot, Users, MessageSquare, Workflow, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useApp } from '@/contexts/AppContext'
import { getRelativeTime } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  title: string
  subtitle?: string
}

const searchTypeIcons = {
  lead: Users,
  conversation: MessageSquare,
  agent: Bot,
  flow: Workflow,
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const {
    notifications, markNotificationRead, markAllNotificationsRead,
    unreadCount, theme, toggleTheme, globalSearch, logout, profile,
  } = useApp()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const searchResults = globalSearch(searchQuery)
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true) }
      if (e.key === 'Escape') { setShowSearch(false); setSearchQuery('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const notifTypeColor: Record<string, string> = {
    info: 'bg-blue-500', success: 'bg-emerald-500', warning: 'bg-amber-500', error: 'bg-red-500',
  }

  const initials = `${profile.name[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-6 gap-3 shrink-0 sticky top-0 z-40">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Search trigger */}
      <button
        onClick={() => setShowSearch(true)}
        className="flex items-center gap-2 px-3 h-8 rounded-lg bg-accent/50 border border-border hover:bg-accent transition-colors text-muted-foreground text-xs"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:block">Pesquisar</span>
        <span className="hidden sm:flex items-center gap-0.5 ml-1 opacity-60">
          <Command className="w-3 h-3" /><span>K</span>
        </span>
      </button>

      {/* Theme toggle */}
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sun className="w-4 h-4 text-muted-foreground" />
            </motion.span>
          ) : (
            <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Moon className="w-4 h-4 text-muted-foreground" />
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full">
              <span className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notificações</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && <Badge variant="default">{unreadCount}</Badge>}
                    <button onClick={markAllNotificationsRead} className="text-xs text-primary hover:underline">Marcar todas</button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.slice(0, 8).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-4 border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notifTypeColor[notif.type]}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{getRelativeTime(new Date(notif.time))}</p>
                        </div>
                        {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* User avatar */}
      <div className="relative">
        <Avatar className="w-8 h-8 cursor-pointer" onClick={() => setShowUserMenu(!showUserMenu)}>
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-500 text-white text-xs font-bold">
            {initials || 'AN'}
          </AvatarFallback>
        </Avatar>
        <AnimatePresence>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-semibold">{profile.name} {profile.lastName}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <div className="p-1">
                  <button onClick={() => { navigate('/profile'); setShowUserMenu(false) }} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors">Meu Perfil</button>
                  <button onClick={() => { navigate('/settings'); setShowUserMenu(false) }} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors">Configurações</button>
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-400 transition-colors flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5" /> Sair
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* New Agent button */}
      <Button size="sm" variant="gradient" className="hidden md:flex gap-1.5 text-xs" onClick={() => navigate('/agents')}>
        <Plus className="w-3.5 h-3.5" /> Novo Agente
      </Button>

      {/* Global Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowSearch(false); setSearchQuery('') }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 pointer-events-none">
              <motion.div
                ref={searchRef}
                initial={{ opacity: 0, y: -20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar leads, conversas, agentes, fluxos..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  )}
                </div>
                {searchQuery.length > 0 && (
                  <div className="max-h-72 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">Nenhum resultado encontrado</p>
                    ) : (
                      searchResults.map(r => {
                        const Icon = searchTypeIcons[r.type]
                        return (
                          <button
                            key={r.id}
                            onClick={() => { navigate(r.route); setShowSearch(false); setSearchQuery('') }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/60 transition-colors text-left"
                          >
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{r.title}</p>
                              <p className="text-xs text-muted-foreground">{r.subtitle}</p>
                            </div>
                            <Badge variant="secondary" className="ml-auto text-[10px] capitalize">{r.type}</Badge>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
                {!searchQuery && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Digite para pesquisar em todo o sistema
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
