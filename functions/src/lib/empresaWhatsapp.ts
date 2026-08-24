import { db } from './firestore'
import type { WhatsAppConfig } from './whatsapp'

export interface EmpresaWhatsAppConfig extends WhatsAppConfig {
  empresaId: string
}

/**
 * Descobre a qual empresa pertence um determinado phone_number_id da Meta.
 * Cada empresa guarda sua config em empresas/{empresaId}/configuracoes/principal
 * no campo "whatsapp" (mesmo padrão já usado pra "ia").
 */
export async function buscarEmpresaPorPhoneNumberId(
  phoneNumberId: string
): Promise<EmpresaWhatsAppConfig | null> {
  const snap = await db
    .collectionGroup('configuracoes')
    .where('whatsapp.phoneNumberId', '==', phoneNumberId)
    .limit(1)
    .get()

  if (snap.empty) return null

  const doc = snap.docs[0]
  const dados = doc.data().whatsapp as { phoneNumberId: string; accessToken: string; verifyToken?: string }
  // doc.ref.path é algo como "empresas/{empresaId}/configuracoes/principal"
  const empresaId = doc.ref.path.split('/')[1]

  return {
    empresaId,
    phoneNumberId: dados.phoneNumberId,
    accessToken: dados.accessToken,
    verifyToken: dados.verifyToken,
  }
}
