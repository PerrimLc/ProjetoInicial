import { useState, useEffect, useCallback } from 'react'
import { DocumentSnapshot } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import {
  listarContatos,
  criarContato,
  atualizarContato,
  inativarContato,
} from '@/services/contatos/contatoService'
import type { Contato } from '@/types'

const PAGE_SIZE = 20

export function useContatos() {
  const { empresa } = useAuth()
  const empresaId = empresa?.id ?? null

  const [contatos, setContatos] = useState<Contato[]>([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ultimoDoc, setUltimoDoc] = useState<DocumentSnapshot | null>(null)
  const [temMais, setTemMais] = useState(false)
  const [busca, setBusca] = useState('')

  const carregarContatos = useCallback(async () => {
    if (!empresaId) {
      setContatos([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const { contatos: data, ultimo } = await listarContatos(empresaId, {
        limite: PAGE_SIZE,
        busca,
      })
      setContatos(data)
      setUltimoDoc(ultimo)
      setTemMais(data.length === PAGE_SIZE)
    } catch (e) {
      console.error('[useContatos] Erro ao carregar:', e)
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [empresaId, busca])

  useEffect(() => {
    carregarContatos()
  }, [carregarContatos])

  const carregarMais = useCallback(async () => {
    if (!empresaId || !ultimoDoc || carregandoMais) return
    setCarregandoMais(true)
    try {
      const { contatos: data, ultimo } = await listarContatos(empresaId, {
        limite: PAGE_SIZE,
        ultimo: ultimoDoc,
        busca,
      })
      setContatos((prev) => [...prev, ...data])
      setUltimoDoc(ultimo)
      setTemMais(data.length === PAGE_SIZE)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregandoMais(false)
    }
  }, [empresaId, ultimoDoc, carregandoMais, busca])

  const novoContato = useCallback(
    async (dados: Omit<Contato, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
      if (!empresaId) return
      await criarContato(empresaId, dados)
      await carregarContatos()
    },
    [empresaId, carregarContatos]
  )

  const editarContato = useCallback(
    async (contatoId: string, dados: Partial<Contato>) => {
      if (!empresaId) return
      await atualizarContato(empresaId, contatoId, dados)
      await carregarContatos()
    },
    [empresaId, carregarContatos]
  )

  const desativarContato = useCallback(
    async (contatoId: string) => {
      if (!empresaId) return
      await inativarContato(empresaId, contatoId)
      await carregarContatos()
    },
    [empresaId, carregarContatos]
  )

  return {
    contatos,
    carregando,
    carregandoMais,
    erro,
    temMais,
    busca,
    setBusca,
    carregarMais,
    criarContato: novoContato,
    atualizarContato: editarContato,
    inativarContato: desativarContato,
    recarregar: carregarContatos,
  }
}
