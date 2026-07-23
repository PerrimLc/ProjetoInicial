import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { Mensagem } from '@/types'

export async function enviarMensagem(
  empresaId: string,
  conversaId: string,
  dados: Omit<Mensagem, 'id' | 'enviadaEm'>
): Promise<string> {
  try {
    const ref = await addDoc(
      collection(db, 'empresas', empresaId, 'conversas', conversaId, 'mensagens'),
      {
        ...dados,
        enviadaEm: serverTimestamp(),
      }
    )
    return ref.id
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function simularResposta(
  empresaId: string,
  conversaId: string,
  texto: string
): Promise<void> {
  const delay = 1000 + Math.random() * 2000
  await new Promise((resolve) => setTimeout(resolve, delay))
  try {
    await addDoc(
      collection(db, 'empresas', empresaId, 'conversas', conversaId, 'mensagens'),
      {
        conversaId,
        texto,
        tipo: 'texto',
        direcao: 'entrada',
        status: 'lida',
        enviadaEm: serverTimestamp(),
      }
    )
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export function escutarMensagens(
  empresaId: string,
  conversaId: string,
  callback: (mensagens: Mensagem[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'empresas', empresaId, 'conversas', conversaId, 'mensagens'),
    orderBy('enviadaEm')
  )
  return onSnapshot(q, (snap) => {
    const mensagens = snap.docs.map((d) =>
      converterTimestamps<Mensagem>({ id: d.id, ...d.data() })
    )
    callback(mensagens)
  })
}
