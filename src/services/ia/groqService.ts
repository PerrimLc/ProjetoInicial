/**
 * Groq AI Service
 * Chama a API da Groq diretamente do frontend (para testes).
 * Em produção, mover para Cloud Function para proteger a chave.
 *
 * Modelos disponíveis (gratuitos):
 * - llama-3.3-70b-versatile  ← recomendado (mais capaz)
 * - llama-3.1-8b-instant     ← mais rápido
 * - mixtral-8x7b-32768       ← contexto longo
 */

export interface MensagemGroq {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ConfiguracaoIA {
  ativa: boolean
  modelo: string
  systemPrompt: string
  temperatura: number
  maxTokens: number
  pausarQuandoAtendente: boolean
}

export const CONFIG_IA_PADRAO: ConfiguracaoIA = {
  ativa: false,
  modelo: 'llama-3.3-70b-versatile',
  systemPrompt: `Você é um assistente virtual de atendimento ao cliente de um escritório de advocacia.
Seja sempre educado, prestativo e objetivo.
Responda em português brasileiro.

Sua função principal é marcar consultas de atendimento jurídico.
Cada consulta custa R$ 300,00 e o pagamento é aceito apenas em dinheiro ou PIX.

Fluxo de agendamento:
1. Quando o cliente quiser agendar, informe os horários disponíveis que você buscará na agenda.
2. Após o cliente escolher, confirme o dia e horário escolhido e peça confirmação.
3. Após confirmação, registre o agendamento e informe que está marcado.
4. Pergunte se pode ajudar em mais alguma coisa.

Se não souber a resposta sobre questões jurídicas específicas, diga educadamente que o advogado responderá durante a consulta.`,
  temperatura: 0.7,
  maxTokens: 600,
  pausarQuandoAtendente: true,
}

export async function chamarGroq(
  apiKey: string,
  mensagens: MensagemGroq[],
  config: Partial<ConfiguracaoIA> = {}
): Promise<string> {
  const modelo = config.modelo ?? CONFIG_IA_PADRAO.modelo
  const temperatura = config.temperatura ?? CONFIG_IA_PADRAO.temperatura
  const maxTokens = config.maxTokens ?? CONFIG_IA_PADRAO.maxTokens

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelo,
      messages: mensagens,
      temperature: temperatura,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}))
    throw new Error(
      (erro as { error?: { message?: string } }).error?.message
      ?? `Groq API error: ${response.status}`
    )
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[]
  }

  return data.choices[0]?.message?.content ?? ''
}

/**
 * Monta o histórico de mensagens no formato que a Groq espera,
 * incluindo o system prompt de treinamento da IA.
 */
export function montarHistoricoGroq(
  systemPrompt: string,
  mensagens: { texto: string; direcao: 'entrada' | 'saida' }[]
): MensagemGroq[] {
  const historico: MensagemGroq[] = [
    { role: 'system', content: systemPrompt },
  ]

  for (const msg of mensagens) {
    historico.push({
      role: msg.direcao === 'entrada' ? 'user' : 'assistant',
      content: msg.texto,
    })
  }

  return historico
}
