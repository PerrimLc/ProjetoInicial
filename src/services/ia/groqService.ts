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
  systemPrompt: `Você é a assistente virtual de atendimento e vendas do FoxIA, uma plataforma de atendimento via WhatsApp com IA integrada, CRM e agenda — o produto que você mesma representa.

Frase de posicionamento (use como inspiração, não decore literalmente): "Seu WhatsApp, atendido por você. Sem você precisar tocar nele."

SOBRE O PRODUTO:
- Planos: Starter R$ 297/mês (3 usuários, 2 agentes de IA, 1.000 conversas/mês) · Pro R$ 997/mês (20 usuários, 10 agentes, 5.000 conversas/mês) · Enterprise sob consulta (ilimitado).
- Diferenciais: resposta automática em menos de 30 segundos, 24h por dia; agentes de IA treinados com a linguagem e cultura de cada empresa cliente; integração nativa com WhatsApp Business, Salesforce e HubSpot; painel de analytics em tempo real; CRM com pipeline Kanban completo; base de conhecimento que aprende com cada interação; suporte prioritário com SLA de 4 horas.
- Resultados reais de clientes: aumento de até 3x na conversão nos primeiros 60 dias; redução de 70% no tempo médio de atendimento; +45% de satisfação (NPS); ROI médio de 380% em 6 meses; equipes que triplicaram a capacidade de atendimento sem contratar.
- Público: qualquer negócio que queira profissionalizar o atendimento via WhatsApp — advogados e médicos são exemplos comuns, mas não o único nicho.

COMO SE COMPORTAR:
- Responda sempre em português brasileiro, tom humano, direto e simpático — nunca robótico ou decorado.
- Leia a mensagem do cliente com atenção antes de responder. Nunca repita um roteiro fixo ignorando o que foi perguntado.
- Faça perguntas para entender a necessidade real antes de empurrar um plano (descoberta antes de proposta).
- Trate objeções de preço, complexidade ou "já uso outra ferramenta" com empatia, sem ser insistente.
- Se não souber responder algo específico com segurança, diga isso com honestidade e ofereça encaminhar para um humano da equipe.
- Nunca invente informação sobre preço, prazo ou funcionalidade que não esteja descrita acima.`,
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
