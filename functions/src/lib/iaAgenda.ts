/**
 * Porta server-side de src/services/ia/iaAgendaService.ts — mesma estratégia
 * de token especial [[AGENDAR:N]] pra IA confirmar um agendamento.
 */
import type { MensagemGroq, ConfiguracaoIA } from './groq'
import {
  buscarHorariosDisponiveis,
  listarAgendamentosIntervalo,
  calcularSlotsLivres,
  criarAgendamento,
} from './agenda'

const DIAS_PT = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function formatarSlot(data: Date): string {
  const dia = DIAS_PT[data.getDay()]
  const d = data.getDate()
  const m = MESES_PT[data.getMonth()]
  const h = data.getHours().toString().padStart(2, '0')
  const min = data.getMinutes().toString().padStart(2, '0')
  return `${dia}, ${d} de ${m} às ${h}:${min}`
}

async function buscarProximosSlotsLivres(
  empresaId: string,
  maxDias = 14
): Promise<{ slot: Date; label: string }[]> {
  const horarios = await buscarHorariosDisponiveis(empresaId)
  const hoje = new Date()
  const fim = new Date(hoje)
  fim.setDate(fim.getDate() + maxDias)

  const agendamentosExistentes = await listarAgendamentosIntervalo(empresaId, hoje, fim)
  const slotsLivres: { slot: Date; label: string }[] = []

  for (let i = 1; i <= maxDias && slotsLivres.length < 10; i++) {
    const dia = new Date(hoje)
    dia.setDate(dia.getDate() + i)
    dia.setHours(0, 0, 0, 0)
    const slots = calcularSlotsLivres(dia, agendamentosExistentes, horarios)
    for (const slot of slots) {
      if (slotsLivres.length >= 10) break
      slotsLivres.push({ slot, label: formatarSlot(slot) })
    }
  }

  return slotsLivres
}

function extrairTokenAgendamento(resposta: string): { textoLimpo: string; indiceSlot: number } | null {
  const match = resposta.match(/\[\[AGENDAR:(\d+)\]\]/i)
  if (!match) return null
  const idx = parseInt(match[1], 10)
  const textoLimpo = resposta.replace(/\[\[AGENDAR:\d+\]\]/gi, '').trim()
  return { textoLimpo, indiceSlot: idx }
}

export interface RespostaIAComAgenda {
  texto: string
  agendamentoCriado?: { data: Date; label: string }
}

export async function chamarIAComAgenda(
  apiKey: string,
  empresaId: string,
  systemPrompt: string,
  historico: MensagemGroq[],
  config: Partial<ConfiguracaoIA>,
  contatoNome: string
): Promise<RespostaIAComAgenda> {
  const modelo = config.modelo ?? 'llama-3.3-70b-versatile'

  const slots = await buscarProximosSlotsLivres(empresaId)

  let contextoAgenda: string
  if (slots.length > 0) {
    contextoAgenda = `

[SISTEMA DE AGENDA - LEIA COM ATENÇÃO]
Horários disponíveis para consulta (R$ 300,00 — dinheiro ou PIX):
${slots.map((s, i) => `${i}: ${s.label}`).join('\n')}

REGRA OBRIGATÓRIA: Quando o cliente confirmar um horário e você disser que a consulta foi agendada/confirmada/marcada, você DEVE incluir exatamente este token no final da sua mensagem (sem espaço antes):
[[AGENDAR:N]]
Onde N é o número do índice do horário escolhido acima (0, 1, 2, etc.)

Exemplo: Se o cliente confirmou o horário de índice 2, termine com: [[AGENDAR:2]]
Nunca inclua este token se não houve confirmação do cliente.`
  } else {
    contextoAgenda = `

[SISTEMA DE AGENDA]
Não há horários disponíveis nos próximos 14 dias. Informe o cliente gentilmente que a agenda está lotada e que entrarão em contato.`
  }

  const systemComAgenda: MensagemGroq = { role: 'system', content: systemPrompt + contextoAgenda }
  const mensagensParaGroq: MensagemGroq[] = [systemComAgenda, ...historico.filter((m) => m.role !== 'system')]

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: modelo,
      messages: mensagensParaGroq,
      temperature: config.temperatura ?? 0.7,
      max_tokens: config.maxTokens ?? 700,
    }),
  })

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}))
    throw new Error((erro as { error?: { message?: string } }).error?.message ?? `Groq API error: ${response.status}`)
  }

  const data = (await response.json()) as { choices: { message: { content: string } }[] }
  const textoResposta = data.choices[0]?.message?.content ?? ''

  const tokenInfo = extrairTokenAgendamento(textoResposta)

  if (tokenInfo && tokenInfo.indiceSlot >= 0 && tokenInfo.indiceSlot < slots.length) {
    const slotEscolhido = slots[tokenInfo.indiceSlot]
    try {
      await criarAgendamento(empresaId, {
        titulo: `Consulta jurídica — ${contatoNome}`,
        tipo: 'reuniao',
        contatoNome,
        data: slotEscolhido.slot,
        duracaoMin: 60,
        status: 'agendado',
        observacoes: 'Agendado via assistente de IA. Valor: R$ 300,00 (dinheiro ou PIX)',
      })
      return {
        texto: tokenInfo.textoLimpo,
        agendamentoCriado: { data: slotEscolhido.slot, label: slotEscolhido.label },
      }
    } catch (e) {
      console.error('[IA Agenda] Erro ao criar agendamento:', e)
      return { texto: tokenInfo.textoLimpo }
    }
  }

  const textoFinal = textoResposta.replace(/\[\[AGENDAR:\d+\]\]/gi, '').trim()
  return { texto: textoFinal }
}
