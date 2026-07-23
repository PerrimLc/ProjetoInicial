import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { buscarConfiguracoes, salvarConfiguracoes } from '@/services/empresas/empresaService'
import { CONFIG_IA_PADRAO, type ConfiguracaoIA } from '@/services/ia/groqService'

const CHAVE_DOC = 'ia'

export function useIAConfig() {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [config, setConfig] = useState<ConfiguracaoIA>(CONFIG_IA_PADRAO)
  const [apiKey, setApiKey] = useState<string>('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarConfig = useCallback(async () => {
    if (!empresaId) { setCarregando(false); return }
    setCarregando(true)
    try {
      const dados = await buscarConfiguracoes(empresaId)
      const iaConfig = dados[CHAVE_DOC] as (ConfiguracaoIA & { groqApiKey?: string }) | undefined
      if (iaConfig) {
        // Separar a chave do resto da config
        const { groqApiKey, ...resto } = iaConfig
        setConfig({ ...CONFIG_IA_PADRAO, ...resto })
        // Prioridade: Firestore > .env
        setApiKey(groqApiKey ?? (import.meta.env.VITE_GROQ_API_KEY as string) ?? '')
      } else {
        // Fallback para .env
        setApiKey((import.meta.env.VITE_GROQ_API_KEY as string) ?? '')
      }
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [empresaId])

  useEffect(() => {
    carregarConfig()
  }, [carregarConfig])

  const salvarConfig = useCallback(async (novaConfig: ConfiguracaoIA, novaApiKey?: string) => {
    if (!empresaId) return
    const dadosParaSalvar: Record<string, unknown> = { ...novaConfig }
    if (novaApiKey !== undefined) {
      dadosParaSalvar.groqApiKey = novaApiKey
      setApiKey(novaApiKey)
    }
    await salvarConfiguracoes(empresaId, { [CHAVE_DOC]: dadosParaSalvar })
    setConfig(novaConfig)
  }, [empresaId])

  return {
    config,
    apiKey,
    carregando,
    erro,
    salvarConfig,
    recarregar: carregarConfig,
  }
}
