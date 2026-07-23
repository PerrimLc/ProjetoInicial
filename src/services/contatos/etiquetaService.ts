import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { Etiqueta } from '@/types'

export async function listarEtiquetas(empresaId: string): Promise<Etiqueta[]> {
  try {
    const snap = await getDocs(collection(db, 'empresas', empresaId, 'etiquetas'))
    return snap.docs.map((d) =>
      converterTimestamps<Etiqueta>({ id: d.id, ...d.data() })
    )
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function criarEtiqueta(
  empresaId: string,
  dados: { nome: string; cor: string }
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'empresas', empresaId, 'etiquetas'), {
      nome: dados.nome,
      cor: dados.cor,
      criadoEm: serverTimestamp(),
    })
    return ref.id
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function excluirEtiqueta(empresaId: string, etiquetaId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'empresas', empresaId, 'etiquetas', etiquetaId))
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}
