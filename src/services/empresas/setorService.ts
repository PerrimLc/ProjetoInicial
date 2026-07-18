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
import { Setor } from '@/types'

export async function listarSetores(empresaId: string): Promise<Setor[]> {
  try {
    const snap = await getDocs(collection(db, 'empresas', empresaId, 'setores'))
    return snap.docs.map((d) =>
      converterTimestamps<Setor>({ id: d.id, ...d.data() })
    )
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function criarSetor(
  empresaId: string,
  dados: { nome: string; descricao?: string }
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'empresas', empresaId, 'setores'), {
      nome: dados.nome,
      descricao: dados.descricao ?? null,
      ativo: true,
      criadoEm: serverTimestamp(),
    })
    return ref.id
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function atualizarSetor(
  empresaId: string,
  setorId: string,
  dados: Partial<Setor>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'setores', setorId), { ...dados })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function inativarSetor(empresaId: string, setorId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'setores', setorId), { ativo: false })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}
