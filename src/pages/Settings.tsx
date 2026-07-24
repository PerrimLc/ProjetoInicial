import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building, MessageSquare, Bot, Users, Shield, Puzzle,
  CreditCard, ChevronRight, Check, Save, Eye, EyeOff,
  Sun, Moon, Globe, Bell, Lock, Plus, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/components/ui/toast'

const tabs = [
  { id: 'company', label: 'Empresa', icon: Building },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'openai', label: 'OpenAI / IA', icon: Bot },
  { id: 'team', label: 'Equipe', icon: Users },
  { id: 'permissions', label: 'Permissões', icon: Shield },
  { id: 'integrations', label: 'Integrações', icon: Puzzle },
  { id: 'billing', label: 'Pagamento', icon: CreditCard },
]

const integrations = [
  { name: 'WhatsApp Business', description: 'Conecte sua conta oficial', color: '#25D366' },
  { name: 'Salesforce CRM', description: 'Sincronize leads e negócios', color: '#00A1E0' },
  { name: 'HubSpot', description: 'Integração de marketing', color: '#FF7A59' },
  { name: 'Slack', description: 'Notificações em tempo real', color: '#4A154B' },
  { name: 'Google Calendar', description: 'Agendar reuniões automáticas', color: '#4285F4' },
  { name: 'Zapier', description: 'Automações customizadas', color: '#FF4A00' },
]

const teamMembers = [
  { name: 'Arthur Neves', email: 'arthur@foxia.com.br', role: 'Admin', status: 'active' as const },
  { name: 'Ana Lima', email: 'ana@foxia.com.br', role: 'Vendedor', status: 'active' as const },
  { name: 'Carlos Rocha', email: 'carlos@foxia.com.br', role: 'Vendedor', status: 'active' as const },
  { name: 'Pedro Matos', email: 'pedro@foxia.com.br', role: 'Supervisor', status: 'inactive' as const },
]

export function Settings() {
  const { settings, updateSettings, theme, toggleTheme } = useApp()
  const { success } = useToast()
  const [activeTab, setActiveTab] = useState('company')
  const [showKey, setShowKey] = useState(false)
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>(['WhatsApp Business', 'Salesforce CRM', 'Slack'])
  const [local, setLocal] = useState({ ...settings })

  const handleSave = () => {
    updateSettings(local)
    success('Configurações salvas!', 'Todas as alterações foram persistidas.')
  }

  const toggleIntegration = (name: string) => {
    setConnectedIntegrations(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    )
    success(
      connectedIntegrations.includes(name) ? 'Integração desconectada' : 'Integração conectada!',
      name
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'company':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-4">Informações da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Nome da Empresa', key: 'companyName' as const },
                  { label: 'E-mail Corporativo', key: 'companyEmail' as const },
                  { label: 'Telefone', key: 'companyPhone' as const },
                  { label: 'Website', key: 'companyWebsite' as const },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">{f.label}</label>
                    <Input
                      value={local[f.key] as string}
                      onChange={e => setLocal(p => ({ ...p, [f.key]: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Preferências</h3>
              <div className="space-y-3">
                {/* Theme */}
                <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Tema</p>
                      <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={toggleTheme}>
                    {theme === 'dark' ? 'Mudar para Light' : 'Mudar para Dark'}
                  </Button>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Idioma</p>
                      <p className="text-xs text-muted-foreground">Português (Brasil)</p>
                    </div>
                  </div>
                  <select
                    value={local.language}
                    onChange={e => setLocal(p => ({ ...p, language: e.target.value }))}
                    className="h-7 text-xs bg-accent border border-border rounded-lg px-2 text-foreground focus:outline-none"
                  >
                    <option value="pt-BR">Português (BR)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Notificações</p>
                      <p className="text-xs text-muted-foreground">{local.notificationsEnabled ? 'Ativadas' : 'Desativadas'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLocal(p => ({ ...p, notificationsEnabled: !p.notificationsEnabled }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${local.notificationsEnabled ? 'bg-primary' : 'bg-accent'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${local.notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            <Button variant="gradient" size="sm" className="gap-1.5" onClick={handleSave}>
              <Save className="w-3.5 h-3.5" /> Salvar Configurações
            </Button>
          </div>
        )

      case 'whatsapp':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">WhatsApp Business API</p>
                <p className="text-xs text-muted-foreground">Conta conectada e funcionando</p>
              </div>
              <Badge variant="success" className="text-xs gap-1"><Check className="w-3 h-3" />Conectado</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Phone Number ID', value: '123456789012345' },
                { label: 'Business Account ID', value: '987654321098765' },
                { label: 'Access Token', value: 'EAAxxxxxxxxxxxxxxxxxxxxxx' },
                { label: 'Webhook URL', value: 'https://api.foxia.com.br/webhook' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">{f.label}</label>
                  <Input defaultValue={f.value} className="h-9 text-sm font-mono text-xs" />
                </div>
              ))}
            </div>
            <Button variant="gradient" size="sm" className="gap-1.5" onClick={handleSave}>
              <Save className="w-3.5 h-3.5" /> Salvar
            </Button>
          </div>
        )

      case 'openai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-4">Configurações de IA</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Chave da API OpenAI</label>
                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={local.openaiKey}
                      onChange={e => setLocal(p => ({ ...p, openaiKey: e.target.value }))}
                      className="h-9 text-sm pr-10 font-mono"
                    />
                    <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Modelo Padrão</label>
                  <select
                    value={local.defaultModel}
                    onChange={e => setLocal(p => ({ ...p, defaultModel: e.target.value }))}
                    className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {['GPT-4o', 'GPT-4o Mini', 'Claude 3.5 Sonnet', 'Claude 3 Haiku', 'Gemini Pro'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Temperatura Padrão: {local.defaultTemperature}
                  </label>
                  <input
                    type="range" min={0} max={1} step={0.1}
                    value={local.defaultTemperature}
                    onChange={e => setLocal(p => ({ ...p, defaultTemperature: Number(e.target.value) }))}
                    className="w-full accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Preciso</span><span>Criativo</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Prompt Base Padrão</label>
                  <textarea
                    value={local.defaultPrompt}
                    onChange={e => setLocal(p => ({ ...p, defaultPrompt: e.target.value }))}
                    rows={4}
                    className="w-full text-sm bg-transparent border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
              </div>
            </div>
            <Button variant="gradient" size="sm" className="gap-1.5" onClick={handleSave}>
              <Save className="w-3.5 h-3.5" /> Salvar
            </Button>
          </div>
        )

      case 'team':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Membros da Equipe</h3>
              <Button variant="gradient" size="sm" className="text-xs gap-1">
                <Plus className="w-3.5 h-3.5" /> Convidar
              </Button>
            </div>
            <div className="space-y-2">
              {teamMembers.map((member, i) => (
                <motion.div
                  key={member.email}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 p-3 bg-accent/30 rounded-xl"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/40 to-blue-500/40 flex items-center justify-center text-sm font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant={member.role === 'Admin' ? 'default' : member.role === 'Supervisor' ? 'warning' : 'secondary'} className="text-xs">
                    {member.role}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )

      case 'integrations':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Integrações Disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {integrations.map((integ, i) => {
                const isConnected = connectedIntegrations.includes(integ.name)
                return (
                  <motion.div
                    key={integ.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3 bg-accent/30 rounded-xl border border-border hover:border-border/80 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: integ.color + '20', border: `1px solid ${integ.color}40` }}>
                      <div className="w-3 h-3 rounded-sm" style={{ background: integ.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{integ.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{integ.description}</p>
                    </div>
                    {isConnected ? (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => toggleIntegration(integ.name)}>
                        <Check className="w-3 h-3 text-emerald-400" /> Conectado
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => toggleIntegration(integ.name)}>
                        Conectar
                      </Button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/30 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="default" className="mb-2">Plano Pro</Badge>
                  <h3 className="text-2xl font-bold">R$ 997 <span className="text-sm font-normal text-muted-foreground">/mês</span></h3>
                  <p className="text-xs text-muted-foreground mt-1">Renova em 15 de Julho de 2024</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">Fazer Upgrade</Button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[{ label: 'Agentes', used: 5, total: 10 }, { label: 'Conversas/mês', used: 2800, total: 5000 }, { label: 'Usuários', used: 4, total: 20 }].map(s => (
                  <div key={s.label} className="bg-black/20 rounded-lg p-2">
                    <p className="text-sm font-bold">{s.used}/{s.total}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-white/40 rounded-full" style={{ width: `${(s.used / s.total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Histórico de Pagamentos</h3>
              {[
                { date: 'Junho 2024', value: 'R$ 997,00', status: 'Pago' },
                { date: 'Maio 2024', value: 'R$ 997,00', status: 'Pago' },
                { date: 'Abril 2024', value: 'R$ 997,00', status: 'Pago' },
              ].map((inv, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border">
                  <span className="text-sm">{inv.date}</span>
                  <span className="text-sm font-medium">{inv.value}</span>
                  <Badge variant="success" className="text-xs">{inv.status}</Badge>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">Download</Button>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Lock className="w-10 h-10 opacity-20" />
            <p className="text-sm">Configurações em desenvolvimento</p>
          </div>
        )
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-[1200px] mx-auto">
      <div className="flex gap-6 flex-col md:flex-row">
        {/* Tabs */}
        <div className="w-full md:w-48 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:block">{tab.label}</span>
              {activeTab === tab.id && <ChevronRight className="w-3 h-3 ml-auto hidden md:block" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-card border border-border rounded-2xl p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
