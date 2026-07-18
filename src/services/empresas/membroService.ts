import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { MembroEmpresa, PapelUsuario } from '@/types'

export async function buscarMembro(
  empresaId: string,
  uid: string
): Promise<MembroEmpresa | null> {
  try {
    const snap = await getDoc(doc(db, 'empresas', empresaId, 'membros', uid))
    if (!snap.exists()) return null
    // Inclui o uid como usuarioId pois o doc id é o uid do usuário
    return converterTimestamps<MembroEmpresa>({
      usuarioId: uid,
      ...snap.data() as Record<string, unknown>,
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function listarMembros(empresaId: string): Promise<MembroEmpresa[]> {
  try {
    const snap = await getDocs(collection(db, 'empresas', empresaId, 'membros'))
    return snap.docs.map((d) =>
      converterTimestamps<MembroEmpresa>({
        usuarioId: d.id,
        ...d.data() as Record<string, unknown>,
      })
    )
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function criarMembro(
  empresaId: string,
  membro: Omit<MembroEmpresa, 'criadoEm'>
): Promise<void> {
  try {
    await setDoc(doc(db, 'empresas', empresaId, 'membros', membro.usuarioId), {
      ...membro,
      criadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function atualizarPapel(
  empresaId: string,
  uid: string,
  papel: PapelUsuario
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'membros', uid), { papel })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function inativarMembro(empresaId: string, uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'membros', uid), { ativo: false })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}
