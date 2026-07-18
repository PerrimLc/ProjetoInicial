import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { EtapaFunil } from '@/types'

const ETAPAS_PADRAO = [
  { nome: 'Novo lead', ordem: 1 },
  { nome: 'Contato realizado', ordem: 2 },
  { nome: 'Proposta enviada', ordem: 3 },
  { nome: 'Negociação', ordem: 4 },
  { nome: 'Ganho', ordem: 5 },
  { nome: 'Perdido', ordem: 6 },
]

export async function listarEtapas(empresaId: string): Promise<EtapaFunil[]> {
  try {
    const q = query(
      collection(db, 'empresas', empresaId, 'etapasFunil'),
      orderBy('ordem')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) =>
      converterTimestamps<EtapaFunil>({ id: d.id, ...d.data() })
    )
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function criarEtapa(
  empresaId: string,
  dados: { nome: string; ordem: number }
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'empresas', empresaId, 'etapasFunil'), {
      nome: dados.nome,
      ordem: dados.ordem,
      ativo: true,
      criadoEm: serverTimestamp(),
    })
    return ref.id
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function atualizarEtapa(
  empresaId: string,
  etapaId: string,
  dados: Partial<EtapaFunil>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'etapasFunil', etapaId), { ...dados })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function reordenarEtapas(
  empresaId: string,
  etapas: { id: string; ordem: number }[]
): Promise<void> {
  try {
    const batch = writeBatch(db)
    for (const etapa of etapas) {
      batch.update(doc(db, 'empresas', empresaId, 'etapasFunil', etapa.id), {
        ordem: etapa.ordem,
      })
    }
    await batch.commit()
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function desativarEtapa(empresaId: string, etapaId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'etapasFunil', etapaId), { ativo: false })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function criarEtapasPadrao(empresaId: string): Promise<void> {
  try {
    const batch = writeBatch(db)
    const col = collection(db, 'empresas', empresaId, 'etapasFunil')
    for (const etapa of ETAPAS_PADRAO) {
      const ref = doc(col)
      batch.set(ref, {
        nome: etapa.nome,
        ordem: etapa.ordem,
        ativo: true,
        criadoEm: serverTimestamp(),
      })
    }
    await batch.commit()
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}
