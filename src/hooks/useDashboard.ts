import { useState, useEffect, useCallback } from 'react'
import { getDocs, query, collection, orderBy, limit } from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { useAuth } from '@/hooks/useAuth'
import { buscarMetricas, inicializarMetricas } from '@/services/dashboard/dashboardService'
import { converterTimestamps } from '@/services/firebase/converters'
import type { MetricasPrincipal, Contato, Negocio } from '@/types'

export function useDashboard() {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [metricas, setMetricas] = useState<MetricasPrincipal | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [ultimosContatos, setUltimosContatos] = useState<Contato[]>([])
  const [ultimosNegocios, setUltimosNegocios] = useState<Negocio[]>([])

  const carregarDashboard = useCallback(async () => {
    if (!empresaId) {
      setMetricas(null)
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      // 1. Buscar métricas; inicializar se não existir
      let dados = await buscarMetricas(empresaId)
      if (!dados) {
        await inicializarMetricas(empresaId)
        dados = await buscarMetricas(empresaId)
      }
      setMetricas(dados)

      // 2. Últimos 5 contatos
      const qContatos = query(
        collection(db, 'empresas', empresaId, 'contatos'),
        orderBy('criadoEm', 'desc'),
        limit(5)
      )
      const snapContatos = await getDocs(qContatos)
      setUltimosContatos(
        snapContatos.docs.map((d) =>
          converterTimestamps<Contato>({ id: d.id, ...d.data() })
        )
      )

      // 3. Últimos 5 negócios
      const qNegocios = query(
        collection(db, 'empresas', empresaId, 'negocios'),
        orderBy('criadoEm', 'desc'),
        limit(5)
      )
      const snapNegocios = await getDocs(qNegocios)
      setUltimosNegocios(
        snapNegocios.docs.map((d) =>
          converterTimestamps<Negocio>({ id: d.id, ...d.data() })
        )
      )
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [empresaId])

  useEffect(() => {
    carregarDashboard()
  }, [carregarDashboard])

  return {
    metricas,
    carregando,
    erro,
    recarregar: carregarDashboard,
    ultimosContatos,
    ultimosNegocios,
  }
}
