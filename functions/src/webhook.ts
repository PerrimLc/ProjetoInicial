import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { parseWebhookPayload, verificarWebhook } from './lib/whatsapp'
import { buscarEmpresaPorPhoneNumberId } from './lib/empresaWhatsapp'
import {
  buscarOuCriarConversaWhatsApp,
  salvarMensagem,
  buscarHistoricoMensagens,
  buscarConfiguracaoIA,
} from './lib/conversas'
import { montarHistoricoGroq, CONFIG_IA_PADRAO, type ConfiguracaoIA } from './lib/groq'
import { chamarIAComAgenda } from './lib/iaAgenda'

// Verify token único do App da Meta (não é por empresa — a Meta chama uma
// única URL de webhook por App). Configurado via `firebase functions:secrets:set`.
const WHATSAPP_VERIFY_TOKEN = defineSecret('WHATSAPP_VERIFY_TOKEN')

export const whatsappWebhook = onRequest(
  { secrets: [WHATSAPP_VERIFY_TOKEN], cors: false },
  async (req, res) => {
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'] as string | undefined
      const token = req.query['hub.verify_token'] as string | undefined
      const challenge = req.query['hub.challenge'] as string | undefined

      const ok = verificarWebhook({ verifyToken: WHATSAPP_VERIFY_TOKEN.value() }, mode, token)
      if (ok && challenge) {
        res.status(200).send(challenge)
      } else {
        res.status(403).send('Forbidden')
      }
      return
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    // Sempre responde 200 rápido pra Meta não ficar reentregando — o
    // processamento em si roda antes de responder, mas erros aqui não devem
    // virar retry infinito de payload malformado.
    try {
      const grupos = parseWebhookPayload(req.body)

      for (const grupo of grupos) {
        const empresaConfig = await buscarEmpresaPorPhoneNumberId(grupo.metadata.phoneNumberId)
        if (!empresaConfig) {
          console.warn('[webhook] Nenhuma empresa configurada para phone_number_id', grupo.metadata.phoneNumberId)
          continue
        }

        for (const msg of grupo.mensagens) {
          await processarMensagemRecebida(empresaConfig.empresaId, msg)
        }
      }

      res.status(200).send('OK')
    } catch (e) {
      console.error('[webhook] Erro processando payload:', e)
      // Ainda assim 200 — erro de processamento não deve virar retry storm da Meta.
      res.status(200).send('OK')
    }
  }
)

async function processarMensagemRecebida(
  empresaId: string,
  msg: { whatsappMessageId: string; from: string; type: string; textoBody?: string }
): Promise<void> {
  if (msg.type !== 'text' || !msg.textoBody) {
    console.log(`[webhook] Ignorando mensagem tipo "${msg.type}" (só texto é suportado por enquanto)`)
    return
  }

  const { conversaId, contatoNome } = await buscarOuCriarConversaWhatsApp(empresaId, msg.from)

  const { jaExistia } = await salvarMensagem(empresaId, conversaId, {
    texto: msg.textoBody,
    tipo: 'texto',
    direcao: 'entrada',
    status: 'lida',
    whatsappMessageId: msg.whatsappMessageId,
  })

  // Reentrega da Meta do mesmo webhook — já processamos essa mensagem.
  if (jaExistia) return

  const iaConfigDados = await buscarConfiguracaoIA(empresaId)
  const iaConfig: ConfiguracaoIA = { ...CONFIG_IA_PADRAO, ...(iaConfigDados ?? {}) }
  const groqApiKey = (iaConfigDados?.groqApiKey as string | undefined) ?? process.env.GROQ_API_KEY

  if (!iaConfig.ativa || !groqApiKey) {
    console.log(`[webhook] IA desativada ou sem chave para empresa ${empresaId} — mensagem fica aguardando atendente.`)
    return
  }

  const historicoBruto = await buscarHistoricoMensagens(empresaId, conversaId)
  const historico = montarHistoricoGroq(iaConfig.systemPrompt, historicoBruto)

  try {
    const resultado = await chamarIAComAgenda(
      groqApiKey,
      empresaId,
      iaConfig.systemPrompt,
      historico,
      iaConfig,
      contatoNome
    )

    if (resultado.texto) {
      await salvarMensagem(empresaId, conversaId, {
        texto: resultado.texto,
        tipo: 'texto',
        direcao: 'saida',
        remetenteId: 'ia',
        status: 'enviada',
        // Sem whatsappMessageId aqui de propósito: o envio real pro cliente
        // acontece no gatilho onMensagemSaidaCriada, que preenche esse campo
        // depois que a Graph API confirmar o envio.
      })
    }
  } catch (e) {
    console.error(`[webhook] Erro chamando IA para empresa ${empresaId}:`, e)
  }
}
