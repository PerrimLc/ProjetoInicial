import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { Empresa } from '@/types'

export async function criarEmpresa(dados: { nome: string; criadaPor: string }): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'empresas'), {
      nome: dados.nome,
      criadaPor: dados.criadaPor,
      ativa: true,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    })
    return ref.id
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function buscarEmpresa(empresaId: string): Promise<Empresa | null> {
  try {
    const snap = await getDoc(doc(db, 'empresas', empresaId))
    if (!snap.exists()) return null
    return converterTimestamps<Empresa>({ id: snap.id, ...snap.data() })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function atualizarEmpresa(empresaId: string, dados: Partial<Empresa>): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId), {
      ...dados,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function buscarConfiguracoes(empresaId: string): Promise<Record<string, unknown>> {
  try {
    const snap = await getDoc(doc(db, 'empresas', empresaId, 'configuracoes', 'principal'))
    if (!snap.exists()) return {}
    return snap.data() as Record<string, unknown>
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function salvarConfiguracoes(
  empresaId: string,
  dados: Record<string, unknown>
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'empresas', empresaId, 'configuracoes', 'principal'),
      { ...dados, atualizadoEm: serverTimestamp() },
      { merge: true }
    )
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}
