/**
 * Cliente da WhatsApp Business Cloud API (Meta / Graph API).
 * Porta em TypeScript do WhatsAppCloudApiService.cs original — vive aqui
 * porque o servidor de fato é o Firebase (Cloud Functions), não um backend
 * .NET separado.
 */

const API_VERSION = 'v25.0'

export interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
  verifyToken?: string
}

export interface WhatsAppSendResult {
  success: boolean
  statusCode: number
  raw: unknown
  messageId?: string
}

function baseUrl(config: WhatsAppConfig): string {
  return `https://graph.facebook.com/${API_VERSION}/${config.phoneNumberId}/messages`
}

export async function enviarMensagemTexto(
  config: WhatsAppConfig,
  paraTelefone: string,
  texto: string
): Promise<WhatsAppSendResult> {
  return postParaWhatsApp(config, {
    messaging_product: 'whatsapp',
    to: paraTelefone,
    type: 'text',
    text: { body: texto },
  })
}

export async function enviarMensagemTemplate(
  config: WhatsAppConfig,
  paraTelefone: string,
  templateName: string,
  languageCode = 'pt_BR',
  bodyParameters: string[] = []
): Promise<WhatsAppSendResult> {
  const components =
    bodyParameters.length > 0
      ? [
          {
            type: 'body',
            parameters: bodyParameters.map((p) => ({ type: 'text', text: p })),
          },
        ]
      : []

  return postParaWhatsApp(config, {
    messaging_product: 'whatsapp',
    to: paraTelefone,
    type: 'template',
    template: { name: templateName, language: { code: languageCode }, components },
  })
}

async function postParaWhatsApp(
  config: WhatsAppConfig,
  payload: unknown
): Promise<WhatsAppSendResult> {
  const response = await fetch(baseUrl(config), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  const raw = await response.json().catch(() => ({}))
  const messageId = (raw as { messages?: { id?: string }[] })?.messages?.[0]?.id

  return {
    success: response.ok,
    statusCode: response.status,
    raw,
    messageId,
  }
}

export function verificarWebhook(
  config: Pick<WhatsAppConfig, 'verifyToken'>,
  mode: string | undefined,
  token: string | undefined
): boolean {
  return mode === 'subscribe' && !!token && token === config.verifyToken
}

export interface MensagemRecebida {
  whatsappMessageId: string
  from: string
  type: string
  textoBody?: string
  timestamp?: string
}

export interface WebhookMetadata {
  phoneNumberId: string
  displayPhoneNumber?: string
}

export interface WebhookParseResult {
  metadata: WebhookMetadata
  mensagens: MensagemRecebida[]
}

/**
 * Faz o parsing do payload recebido via Webhook (POST), agrupando as
 * mensagens por número de telefone (metadata.phone_number_id) — é assim
 * que identificamos a qual empresa/cliente aquela mensagem pertence.
 */
export function parseWebhookPayload(body: unknown): WebhookParseResult[] {
  const resultados: WebhookParseResult[] = []

  const entries = (body as { entry?: unknown[] })?.entry ?? []
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes ?? []
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value
      if (!value) continue

      const metadataRaw = value.metadata as
        | { phone_number_id?: string; display_phone_number?: string }
        | undefined
      const phoneNumberId = metadataRaw?.phone_number_id
      if (!phoneNumberId) continue

      const msgArray = (value.messages as unknown[]) ?? []
      if (msgArray.length === 0) continue

      const mensagens: MensagemRecebida[] = []
      for (const msg of msgArray) {
        const m = msg as {
          id?: string
          from?: string
          type?: string
          timestamp?: string
          text?: { body?: string }
        }
        if (!m.id || !m.from) continue
        mensagens.push({
          whatsappMessageId: m.id,
          from: m.from,
          type: m.type ?? 'unknown',
          textoBody: m.type === 'text' ? m.text?.body : undefined,
          timestamp: m.timestamp,
        })
      }

      if (mensagens.length > 0) {
        resultados.push({
          metadata: { phoneNumberId, displayPhoneNumber: metadataRaw?.display_phone_number },
          mensagens,
        })
      }
    }
  }

  return resultados
}
