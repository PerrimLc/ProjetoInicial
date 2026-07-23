import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { RespostaRapida } from '@/types'

export async function listarRespostasRapidas(empresaId: string): Promise<RespostaRapida[]> {
  try {
    const snap = await getDocs(collection(db, 'empresas', empresaId, 'respostasRapidas'))
    return snap.docs.map((d) =>
      converterTimestamps<RespostaRapida>({ id: d.id, ...d.data() })
    )
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function criarRespostaRapida(
  empresaId: string,
  dados: Omit<RespostaRapida, 'id' | 'criadoEm' | 'atualizadoEm'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'empresas', empresaId, 'respostasRapidas'), {
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

export async function atualizarRespostaRapida(
  empresaId: string,
  respostaId: string,
  dados: Partial<RespostaRapida>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'respostasRapidas', respostaId), {
      ...dados,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}
