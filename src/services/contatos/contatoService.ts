import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  DocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { Contato } from '@/types'

export async function listarContatos(
  empresaId: string,
  opts: { limite: number; ultimo?: DocumentSnapshot; busca?: string }
): Promise<{ contatos: Contato[]; ultimo: DocumentSnapshot | null }> {
  try {
    const col = collection(db, 'empresas', empresaId, 'contatos')
    // Ordenar apenas por nome — sem where('ativo') para evitar índice composto
    const constraints: QueryConstraint[] = [
      orderBy('nome'),
      limit(opts.limite),
    ]
    if (opts.ultimo) {
      constraints.push(startAfter(opts.ultimo))
    }
    const q = query(col, ...constraints)
    const snap = await getDocs(q)
    let contatos = snap.docs.map((d) =>
      converterTimestamps<Contato>({ id: d.id, ...d.data() })
    )
    // Filtrar busca no cliente
    if (opts.busca) {
      const busca = opts.busca.toLowerCase()
      contatos = contatos.filter(
        (c) =>
          c.nome.toLowerCase().includes(busca) ||
          c.telefone.includes(busca) ||
          (c.email ?? '').toLowerCase().includes(busca)
      )
    }
    const ultimo = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
    return { contatos, ultimo }
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function buscarContato(
  empresaId: string,
  contatoId: string
): Promise<Contato | null> {
  try {
    const snap = await getDoc(doc(db, 'empresas', empresaId, 'contatos', contatoId))
    if (!snap.exists()) return null
    return converterTimestamps<Contato>({ id: snap.id, ...snap.data() })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function criarContato(
  empresaId: string,
  dados: Omit<Contato, 'id' | 'criadoEm' | 'atualizadoEm'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'empresas', empresaId, 'contatos'), {
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

export async function atualizarContato(
  empresaId: string,
  contatoId: string,
  dados: Partial<Contato>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'contatos', contatoId), {
      ...dados,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function inativarContato(empresaId: string, contatoId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'contatos', contatoId), {
      ativo: false,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}
