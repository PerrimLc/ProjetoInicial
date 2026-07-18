import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { Conversa, StatusConversa } from '@/types'

export async function criarConversa(
  empresaId: string,
  dados: Omit<Conversa, 'id' | 'criadoEm' | 'atualizadoEm'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'empresas', empresaId, 'conversas'), {
      ...dados,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    })
    return ref.id
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function atualizarConversa(
  empresaId: string,
  conversaId: string,
  dados: Partial<Conversa>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'conversas', conversaId), {
      ...dados,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function assumirAtendimento(
  empresaId: string,
  conversaId: string,
  atendenteId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'conversas', conversaId), {
      atendenteId,
      status: 'em_atendimento' as StatusConversa,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function finalizarAtendimento(
  empresaId: string,
  conversaId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'conversas', conversaId), {
      status: 'finalizada' as StatusConversa,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function reabrirAtendimento(
  empresaId: string,
  conversaId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'conversas', conversaId), {
      status: 'aguardando' as StatusConversa,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function transferirConversa(
  empresaId: string,
  conversaId: string,
  params: { atendenteId?: string; setorId?: string }
): Promise<void> {
  try {
    const updates: Record<string, unknown> = { atualizadoEm: serverTimestamp() }
    if (params.atendenteId !== undefined) updates.atendenteId = params.atendenteId
    if (params.setorId !== undefined) updates.setorId = params.setorId
    await updateDoc(doc(db, 'empresas', empresaId, 'conversas', conversaId), updates)
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function zerarNaoLidas(empresaId: string, conversaId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'conversas', conversaId), {
      mensagensNaoLidas: 0,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export function escutarConversas(
  empresaId: string,
  callback: (conversas: Conversa[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'empresas', empresaId, 'conversas'),
    orderBy('ultimaMensagemEm', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const conversas = snap.docs.map((d) =>
      converterTimestamps<Conversa>({ id: d.id, ...d.data() })
    )
    callback(conversas)
  })
}
