import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import { traduzirErroFirebase } from '@/utils/errors'
import { MetricasPrincipal } from '@/types'

export async function buscarMetricas(empresaId: string): Promise<MetricasPrincipal | null> {
  try {
    const snap = await getDoc(doc(db, 'empresas', empresaId, 'metricas', 'principal'))
    if (!snap.exists()) return null
    return converterTimestamps<MetricasPrincipal>(snap.data() as Record<string, unknown>)
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function inicializarMetricas(empresaId: string): Promise<void> {
  try {
    await setDoc(doc(db, 'empresas', empresaId, 'metricas', 'principal'), {
      contatosAtivos: 0,
      negociosAbertos: 0,
      valorTotalAbertos: 0,
      negociosGanhos: 0,
      negociosPerdidos: 0,
      conversasAguardando: 0,
      conversasEmAtendimento: 0,
      conversasFinalizadas: 0,
      atendentesAtivos: 0,
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function incrementarMetrica(
  empresaId: string,
  campo: keyof MetricasPrincipal,
  valor: number = 1
): Promise<void> {
  try {
    await updateDoc(doc(db, 'empresas', empresaId, 'metricas', 'principal'), {
      [campo]: increment(valor),
      atualizadoEm: serverTimestamp(),
    })
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}
