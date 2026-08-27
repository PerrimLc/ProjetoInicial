import { useEffect, useState } from 'react'
import { MessageCircle, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWhatsAppConfig, type ConfiguracaoWhatsApp } from '@/hooks/useWhatsAppConfig'
import { useToast } from '@/components/ui/toast'

export function AbaWhatsApp() {
  const { config, carregando, salvarConfig } = useWhatsAppConfig()
  const { success, error: toastError } = useToast()

  const [form, setForm] = useState<ConfiguracaoWhatsApp>(config)
  const [mostrarToken, setMostrarToken] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => { setForm(config) }, [config])

  const urlWebhook = `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/whatsappWebhook`

  const handleCopiar = () => {
    navigator.clipboard.writeText(urlWebhook)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  const handleSalvar = async () => {
    if (!form.phoneNumberId || !form.accessToken) {
      toastError('Preencha ao menos o Phone Number ID e o Access Token')
      return
    }
    setSalvando(true)
    try {
      await salvarConfig(form)
      success('Configurações do WhatsApp salvas!')
    } catch (e) {
      toastError('Erro ao salvar', (e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <div className="text-sm text-muted-foreground">Carregando...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" /> WhatsApp Business
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Conecte o número de WhatsApp desta empresa via WhatsApp Business Cloud API (Meta)
        </p>
      </div>

      {/* URL do webhook */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">
          URL do Webhook <span className="font-normal">(cole no painel Meta for Developers)</span>
        </label>
        <div className="flex gap-2">
          <Input value={urlWebhook} readOnly className="h-9 text-sm font-mono" />
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleCopiar}>
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Phone Number ID */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">Phone Number ID</label>
        <Input value={form.phoneNumberId}
          onChange={e => setForm(p => ({ ...p, phoneNumberId: e.target.value }))}
          placeholder="Ex: 1208734662333799" className="h-9 text-sm font-mono" />
        <p className="text-[11px] text-muted-foreground">
          WhatsApp Manager → Contas do WhatsApp → seu WABA → Phone numbers
        </p>
      </div>

      {/* Access Token */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">Access Token</label>
        <div className="relative">
          <Input
            type={mostrarToken ? 'text' : 'password'}
            value={form.accessToken}
            onChange={e => setForm(p => ({ ...p, accessToken: e.target.value }))}
            placeholder="Token do Usuário do Sistema"
            className="h-9 text-sm pr-10 font-mono" />
          <button onClick={() => setMostrarToken(!mostrarToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {mostrarToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Gerado a partir de um Usuário do Sistema com acesso total ao app e ao WABA (não o token temporário de 24h)
        </p>
      </div>

      {/* Verify Token */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">Verify Token</label>
        <Input value={form.verifyToken}
          onChange={e => setForm(p => ({ ...p, verifyToken: e.target.value }))}
          placeholder="Uma string qualquer definida por você" className="h-9 text-sm font-mono" />
        <p className="text-[11px] text-muted-foreground">
          Precisa ser o mesmo valor configurado no secret <code>WHATSAPP_VERIFY_TOKEN</code> da Cloud Function
        </p>
      </div>

      <div className="pt-2">
        <Button variant="gradient" size="sm" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}
