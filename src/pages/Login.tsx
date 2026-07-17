import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2, User, Mail, Lock, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/components/ui/toast'
import logoIcon from '@/assets/logo-icon.png'
import logoFull from '@/assets/logo-white.png'

type Mode = 'login' | 'register'

const stats = [
  { value: '3x', label: 'Mais conversões' },
  { value: '24/7', label: 'Sempre ativos' },
  { value: '+15h', label: 'Poupadas por mês' },
]

const features = [
  '✦  Atende seus clientes direto no seu WhatsApp',
  '✦  Responde, agenda e qualifica sem você tocar no celular',
  '✦  Organiza tudo num painel só, sem planilha',
  '✦  Analytics em tempo real pra acompanhar o resultado',
]

export function Login() {
  const { login, register } = useApp()
  const { success, error } = useToast()
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('demo@agentai.com.br')
  const [loginPassword, setLoginPassword] = useState('demo1234')

  // Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regCompany, setRegCompany] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) { error('Preencha todos os campos'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    login(loginEmail, loginPassword)
    success('Bem-vindo de volta!', 'Redirecionando...')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName || !regEmail || !regPassword) { error('Preencha os campos obrigatórios'); return }
    if (regPassword !== regConfirm) { error('As senhas não coincidem'); return }
    if (regPassword.length < 6) { error('Senha muito curta', 'Mínimo 6 caracteres'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    register(regName, regEmail, regPassword)
    success('Conta criada!', 'Bem-vindo à plataforma AgentAI.')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-violet-600/20 via-background to-blue-600/10 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-md w-full"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-500/30 p-3">
            <img src={logoIcon} alt="AgentAI" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-3xl font-bold mb-3 gradient-text">Seu WhatsApp, atendido por você.<br />Sem você precisar tocar nele.</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Seu agente de IA entra direto no seu WhatsApp e conversa com seus clientes por você — respondendo, qualificando e agendando, enquanto você foca no que só você pode fazer.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {stats.map(s => (
              <div key={s.label} className="bg-card/60 border border-border rounded-xl p-4 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-left">
            {features.map(f => (
              <p key={f} className="text-sm text-muted-foreground">{f}</p>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={logoFull} alt="AgentAI Platform" className="h-7 w-auto" />
          </div>

          {/* Tab switcher */}
          <div className="flex items-center bg-accent/60 rounded-xl p-1 mb-6">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setLoading(false) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <h1 className="text-2xl font-bold mb-1">Bem-vindo de volta</h1>
                  <p className="text-sm text-muted-foreground">Use qualquer e-mail e senha para acessar o demo.</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com" className="h-10 pl-9"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Senha</label>
                    <button type="button" className="text-xs text-primary hover:underline">Esqueci a senha</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPass ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••" className="h-10 pl-9 pr-10"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="rounded accent-violet-500" />
                  Lembrar acesso por 30 dias
                </label>

                <Button type="submit" variant="gradient" className="w-full h-10 gap-2" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : <>Entrar <ArrowRight className="w-4 h-4" /></>}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Não tem conta?{' '}
                  <button type="button" onClick={() => setMode('register')} className="text-primary hover:underline">
                    Criar conta grátis
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div>
                  <h1 className="text-2xl font-bold mb-1">Criar sua conta</h1>
                  <p className="text-sm text-muted-foreground">Comece agora. Sem cartão, sem compromisso.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome completo *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Seu nome" className="h-10 pl-9" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">E-mail corporativo *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="voce@empresa.com" className="h-10 pl-9" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Empresa</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={regCompany} onChange={e => setRegCompany(e.target.value)} placeholder="Nome da empresa" className="h-10 pl-9" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Senha *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPass ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)}
                        placeholder="Min. 6 caracteres" className="h-10 pl-9 pr-10"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Confirmar senha *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPass ? 'text' : 'password'} value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                        placeholder="Repita a senha" className="h-10 pl-9"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Ao criar uma conta você concorda com os{' '}
                  <button type="button" className="text-primary hover:underline">Termos de Uso</button>{' '}e a{' '}
                  <button type="button" className="text-primary hover:underline">Política de Privacidade</button>.
                </p>

                <Button type="submit" variant="gradient" className="w-full h-10 gap-2" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</> : <>Criar conta grátis <ArrowRight className="w-4 h-4" /></>}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Já tem conta?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline">
                    Entrar agora
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
