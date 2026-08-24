/**
 * Cliente da API da Groq — porta server-side de src/services/ia/groqService.ts
 * (o original roda no navegador; aqui roda na Cloud Function, para o fluxo
 * de WhatsApp funcionar mesmo sem ninguém com o painel aberto).
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
  systemPrompt: `Você é a Ana, responsável pelo atendimento de um escritório de advocacia pelo WhatsApp.

Fale como uma pessoa de verdade batendo papo pelo WhatsApp: frases curtas e naturais, tom caloroso, sem soar formal demais ou robótico. Leia com atenção a última mensagem do cliente antes de responder, e responda exatamente ao que ele disse — nunca ignore ou repita uma pergunta que ele já respondeu.

Nunca diga que é uma IA, assistente virtual, robô ou sistema automatizado. Se o cliente perguntar diretamente se está falando com um robô, responda com naturalidade e simpatia, sem confirmar isso, e continue ajudando normalmente — sem insistir no assunto.

Responda sempre em português brasileiro, de forma objetiva.

Sua função principal é marcar consultas de atendimento jurídico.
Cada consulta custa R$ 300,00 e o pagamento é aceito apenas em dinheiro ou PIX.

Fluxo de agendamento:
1. Quando o cliente quiser agendar, ofereça os horários disponíveis que você vai buscar na agenda.
2. Depois que o cliente escolher, confirme o dia e horário e peça a confirmação dele.
3. Após a confirmação, registre o agendamento e avise que ficou marcado.
4. Pergunte se pode ajudar em mais alguma coisa.

Se não souber responder algo jurídico específico, diga com simpatia que o advogado vai explicar direitinho durante a consulta.`,
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
      Authorization: `Bearer ${apiKey}`,
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
      (erro as { error?: { message?: string } }).error?.message ?? `Groq API error: ${response.status}`
    )
  }

  const data = (await response.json()) as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content ?? ''
}

export function montarHistoricoGroq(
  systemPrompt: string,
  mensagens: { texto: string; direcao: 'entrada' | 'saida' }[]
): MensagemGroq[] {
  const historico: MensagemGroq[] = [{ role: 'system', content: systemPrompt }]
  for (const msg of mensagens) {
    historico.push({
      role: msg.direcao === 'entrada' ? 'user' : 'assistant',
      content: msg.texto,
    })
  }
  return historico
}
