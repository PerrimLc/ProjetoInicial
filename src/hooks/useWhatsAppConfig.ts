import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { buscarConfiguracoes, salvarConfiguracoes } from '@/services/empresas/empresaService'

const CHAVE_DOC = 'whatsapp'

export interface ConfiguracaoWhatsApp {
  phoneNumberId: string
  accessToken: string
  verifyToken: string
}

export const CONFIG_WHATSAPP_PADRAO: ConfiguracaoWhatsApp = {
  phoneNumberId: '',
  accessToken: '',
  verifyToken: '',
}

export function useWhatsAppConfig() {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [config, setConfig] = useState<ConfiguracaoWhatsApp>(CONFIG_WHATSAPP_PADRAO)
  const [carregando, setCarregando] = useState(true)

  const carregarConfig = useCallback(async () => {
    if (!empresaId) { setCarregando(false); return }
    setCarregando(true)
    try {
      const dados = await buscarConfiguracoes(empresaId)
      const whatsappConfig = dados[CHAVE_DOC] as Partial<ConfiguracaoWhatsApp> | undefined
      setConfig({ ...CONFIG_WHATSAPP_PADRAO, ...whatsappConfig })
    } finally {
      setCarregando(false)
    }
  }, [empresaId])

  useEffect(() => {
    carregarConfig()
  }, [carregarConfig])

  const salvarConfig = useCallback(async (novaConfig: ConfiguracaoWhatsApp) => {
    if (!empresaId) return
    await salvarConfiguracoes(empresaId, { [CHAVE_DOC]: novaConfig })
    setConfig(novaConfig)
  }, [empresaId])

  return { config, carregando, salvarConfig, recarregar: carregarConfig }
}
