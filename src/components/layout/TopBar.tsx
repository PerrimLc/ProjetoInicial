import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, Command, X, Sun, Moon, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'

interface TopBarProps {
  title: string
  subtitle?: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { usuario, membro, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const nome = membro?.nome ?? usuario?.nome ?? ''
  const email = membro?.email ?? usuario?.email ?? ''

  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase() || 'AN'

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

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
          <Command className="w-3 h-3" />
          <span>K</span>
        </span>
      </button>

      {/* Theme toggle */}
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.span
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sun className="w-4 h-4 text-muted-foreground" />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Moon className="w-4 h-4 text-muted-foreground" />
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Notifications placeholder */}
      <button className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
        <Bell className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* User avatar */}
      <div className="relative">
        <Avatar
          className="w-8 h-8 cursor-pointer"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-500 text-white text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <AnimatePresence>
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-semibold truncate">{nome || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { navigate('/profile'); setShowUserMenu(false) }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                  >
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => { navigate('/configuracoes'); setShowUserMenu(false) }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                  >
                    Configurações
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-400 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sair
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar contatos, conversas, negócios..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {!searchQuery && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Digite para pesquisar em todo o sistema
                  </div>
                )}
                {searchQuery.length > 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground py-8">
                    Nenhum resultado encontrado
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
