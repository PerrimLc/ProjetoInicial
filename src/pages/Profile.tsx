import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, MapPin, Building, Mail, Phone, Globe, Star, Clock, Monitor, Moon, Bell, Shield, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/components/ui/toast'

const accesses = [
  { device: 'Chrome — Windows 11', location: 'São Paulo, BR', time: 'Agora', current: true },
  { device: 'Safari — iPhone 15 Pro', location: 'São Paulo, BR', time: '2h atrás', current: false },
  { device: 'Chrome — MacBook Pro', location: 'Campinas, BR', time: '1 dia atrás', current: false },
]

export function Profile() {
  const { profile, updateProfile, theme, toggleTheme } = useApp()
  const { success } = useToast()
  const [saving, setSaving] = useState(false)
  const [local, setLocal] = useState({ ...profile })
  const [avatarHover, setAvatarHover] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    updateProfile(local)
    setSaving(false)
    success('Perfil atualizado!', 'Suas informações foram salvas.')
  }

  const initials = `${local.name?.[0] ?? 'A'}${local.lastName?.[0] ?? 'N'}`.toUpperCase()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Profile Card ── */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 text-center relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-violet-600/20 to-blue-600/20 pointer-events-none" />

            <div className="relative mt-4">
              <div
                className="relative inline-block cursor-pointer"
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white mx-auto shadow-xl shadow-violet-500/30">
                  {initials}
                </div>
                {avatarHover && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center shadow">
                  <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>

              <h2 className="text-lg font-bold mt-3">{local.name} {local.lastName}</h2>
              <p className="text-sm text-muted-foreground">{local.role}</p>

              <div className="flex items-center justify-center gap-2 mt-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">São Paulo, Brasil</span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{local.company}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Badge variant="default" className="text-xs px-3 py-1 gap-1">
                  <Star className="w-3 h-3" /> Plano {local.plan}
                </Badge>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Atividade da Conta</h3>
            {[
              { label: 'Conversas gerenciadas', value: '2.847', pct: 85 },
              { label: 'Leads convertidos', value: '384', pct: 72 },
              { label: 'Agentes configurados', value: '6', pct: 60 },
            ].map(stat => (
              <div key={stat.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className="font-medium">{stat.value}</span>
                </div>
                <Progress value={stat.pct} className="h-1" />
              </div>
            ))}
          </div>

          {/* Last Accesses */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Últimos Acessos
            </h3>
            {accesses.map((access, i) => (
              <div key={i} className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{access.device}</p>
                  <p className="text-[10px] text-muted-foreground">{access.location} · {access.time}</p>
                </div>
                {access.current && <Badge variant="success" className="text-[10px] shrink-0">Atual</Badge>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Edit Form ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Personal data */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4">Dados Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome</label>
                <Input value={local.name} onChange={e => setLocal(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Sobrenome</label>
                <Input value={local.lastName} onChange={e => setLocal(p => ({ ...p, lastName: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={local.email} onChange={e => setLocal(p => ({ ...p, email: e.target.value }))} className="h-9 text-sm pl-9" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={local.phone} onChange={e => setLocal(p => ({ ...p, phone: e.target.value }))} className="h-9 text-sm pl-9" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Cargo</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={local.role} onChange={e => setLocal(p => ({ ...p, role: e.target.value }))} className="h-9 text-sm pl-9" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={local.website} onChange={e => setLocal(p => ({ ...p, website: e.target.value }))} className="h-9 text-sm pl-9" />
                </div>
              </div>
            </div>
            <Button variant="gradient" size="sm" className="mt-4 gap-1.5" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</> : <><Save className="w-3.5 h-3.5" /> Salvar Alterações</>}
            </Button>
          </div>

          {/* Preferences */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4">Preferências</h3>
            <div className="space-y-3">
              {[
                {
                  icon: Moon, label: 'Tema',
                  value: theme === 'dark' ? 'Dark Mode' : 'Light Mode',
                  action: <Button variant="outline" size="sm" className="text-xs h-7" onClick={toggleTheme}>Alternar</Button>,
                },
                {
                  icon: Bell, label: 'Notificações',
                  value: 'Push e E-mail ativados',
                  action: <Button variant="outline" size="sm" className="text-xs h-7">Gerenciar</Button>,
                },
                {
                  icon: Shield, label: 'Autenticação 2FA',
                  value: 'Ativada',
                  action: <Badge variant="success" className="text-xs">Ativada</Badge>,
                },
              ].map(pref => (
                <div key={pref.label} className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <pref.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">{pref.value}</p>
                    </div>
                  </div>
                  {pref.action}
                </div>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4">Segurança</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Senha Atual</label>
                <Input type="password" defaultValue="••••••••••" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nova Senha</label>
                <Input type="password" placeholder="Mínimo 6 caracteres" className="h-9 text-sm" />
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={() => success('Senha alterada!', 'Sua senha foi atualizada com segurança.')}>
              Alterar Senha
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
