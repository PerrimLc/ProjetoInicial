import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { db } from './lib/firestore'
import { enviarMensagemTexto, type WhatsAppConfig } from './lib/whatsapp'

/**
 * Dispara sempre que uma mensagem de saída é criada em QUALQUER conversa —
 * seja escrita pela IA (fluxo de webhook.ts) ou por um atendente humano
 * digitando no painel de Atendimento (que só escreve no Firestore, sem
 * saber nada de WhatsApp). Esse gatilho é o único lugar que efetivamente
 * envia pro cliente via Graph API, evitando duplicar a lógica de envio.
 */
export const onMensagemSaidaCriada = onDocumentCreated(
  'empresas/{empresaId}/conversas/{conversaId}/mensagens/{mensagemId}',
  async (event) => {
    const snap = event.data
    if (!snap) return

    const dados = snap.data()
    if (dados.direcao !== 'saida') return
    if (dados.whatsappMessageId) return // já foi enviada (ex.: reprocessamento)
    if (dados.tipo !== 'texto') return

    const { empresaId, conversaId } = event.params

    const conversaSnap = await db.doc(`empresas/${empresaId}/conversas/${conversaId}`).get()
    const conversa = conversaSnap.data()
    if (!conversa || conversa.origem !== 'whatsapp') return

    const configSnap = await db.doc(`empresas/${empresaId}/configuracoes/principal`).get()
    const whatsapp = configSnap.data()?.whatsapp as WhatsAppConfig | undefined
    if (!whatsapp?.phoneNumberId || !whatsapp?.accessToken) {
      console.error(`[enviarWhatsapp] Empresa ${empresaId} sem config de WhatsApp — não foi possível enviar.`)
      await snap.ref.update({ status: 'erro' })
      return
    }

    try {
      const resultado = await enviarMensagemTexto(whatsapp, conversa.telefone as string, dados.texto as string)
      if (resultado.success) {
        await snap.ref.update({
          status: 'enviada',
          whatsappMessageId: resultado.messageId ?? null,
        })
      } else {
        console.error(`[enviarWhatsapp] Falha ao enviar (empresa ${empresaId}):`, resultado.raw)
        await snap.ref.update({ status: 'erro' })
      }
    } catch (e) {
      console.error(`[enviarWhatsapp] Erro enviando mensagem (empresa ${empresaId}):`, e)
      await snap.ref.update({ status: 'erro' })
    }
  }
)
