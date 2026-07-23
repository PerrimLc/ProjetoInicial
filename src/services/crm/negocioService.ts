import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { Negocio, StatusNegocio, PrioridadeNegocio } from '@/types'

export async function listarNegocios(
  empresaId: string,
  filtros?: {
    etapaId?: string
    responsavelId?: string
    status?: StatusNegocio
    prioridade?: PrioridadeNegocio
  }
): Promise<Negocio[]> {
  try {
    const col = collection(db, 'empresas', empresaId, 'negocios')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const constraints: QueryConstraint[] = []
    if (filtros?.etapaId) constraints.push(where('etapaId', '==', filtros.etapaId))
    if (filtros?.responsavelId) constraints.push(where('responsavelId', '==', filtros.responsavelId))
    if (filtros?.status) constraints.push(where('status', '==', filtros.status))
    if (filtros?.prioridade) constraints.push(where('prioridade', '==', filtros.prioridade))
    const q = constraints.length > 0 ? query(col, ...constraints) : query(col)
    const snap = await getDocs(q)
    return snap.docs.map((d) =>
      converterTimestamps<Negocio>({ id: d.id, ...d.data() })
    )
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function criarNegocio(
  empresaId: string,
  dados: Omit<Negocio, 'id' | 'criadoEm' | 'atualizadoEm'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'empresas', empresaId, 'negocios'), {
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

export async function atualizarNegocio(
  empresaId: string,
  negocioId: string,
  dados: Partial<Negocio>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'negocios', negocioId), {
      ...dados,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function moverNegocio(
  empresaId: string,
  negocioId: string,
  novaEtapaId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'negocios', negocioId), {
      etapaId: novaEtapaId,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function marcarGanho(empresaId: string, negocioId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'negocios', negocioId), {
      status: 'ganho' as StatusNegocio,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function marcarPerdido(empresaId: string, negocioId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'negocios', negocioId), {
      status: 'perdido' as StatusNegocio,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function arquivarNegocio(empresaId: string, negocioId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'negocios', negocioId), {
      status: 'arquivado' as StatusNegocio,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function excluirNegocio(empresaId: string, negocioId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'empresas', empresaId, 'negocios', negocioId))
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}
