/**
 * IA com integração de Agenda + CRM (Kanban)
 *
 * Estratégia: tokens especiais no final da mensagem da IA.
 * A IA é instruída a incluir um token quando realizar uma ação real:
 *   [[AGENDAR:N]]              → cria um agendamento no slot de índice N
 *   [[NEGOCIO_ETAPA:Nome]]     → cria/move a oportunidade do contato para a etapa "Nome"
 *   [[NEGOCIO_GANHO]]          → marca a oportunidade do contato como ganha
 *   [[NEGOCIO_PERDIDO]]        → marca a oportunidade do contato como perdida
 *
 * Isso é 100% confiável — não depende de parsing de texto livre nem de
 * segunda chamada à API para "decidir" a ação.
 */

import {
  listarAgendamentosIntervalo,
  buscarHorariosDisponiveis,
  calcularSlotsLivres,
  criarAgendamento,
} from '@/services/agenda/agendaService'
import { listarEtapas } from '@/services/crm/etapaFunilService'
import {
  listarNegocios,
  criarNegocio,
  moverNegocio,
  marcarGanho,
  marcarPerdido,
} from '@/services/crm/negocioService'
import { type MensagemGroq, type ConfiguracaoIA } from '@/services/ia/groqService'
import type { EtapaFunil, Negocio } from '@/types'

const DIAS_PT = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MESES_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

function formatarSlot(data: Date): string {
  const dia = DIAS_PT[data.getDay()]
  const d = data.getDate()
  const m = MESES_PT[data.getMonth()]
  const h = data.getHours().toString().padStart(2, '0')
  const min = data.getMinutes().toString().padStart(2, '0')
  return `${dia}, ${d} de ${m} às ${h}:${min}`
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
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

async function buscarNegocioAbertoDoContato(
  empresaId: string,
  contatoId: string
): Promise<Negocio | null> {
  const negocios = await listarNegocios(empresaId, { contatoId, status: 'aberto' })
  return negocios[0] ?? null
}

/**
 * Extrai todos os tokens de ação reconhecidos na resposta da IA de uma vez só,
 * e devolve o texto já limpo (sem nenhum token visível ao usuário final).
 */
function extrairAcoes(resposta: string): {
  textoLimpo: string
  indiceSlot: number | null
  etapaNome: string | null
  ganho: boolean
  perdido: boolean
} {
  const agendarMatch = resposta.match(/\[\[AGENDAR:(\d+)\]\]/i)
  const etapaMatch = resposta.match(/\[\[NEGOCIO_ETAPA:([^\]]+)\]\]/i)
  const ganho = /\[\[NEGOCIO_GANHO\]\]/i.test(resposta)
  const perdido = /\[\[NEGOCIO_PERDIDO\]\]/i.test(resposta)

  const textoLimpo = resposta
    .replace(/\[\[AGENDAR:\d+\]\]/gi, '')
    .replace(/\[\[NEGOCIO_ETAPA:[^\]]+\]\]/gi, '')
    .replace(/\[\[NEGOCIO_GANHO\]\]/gi, '')
    .replace(/\[\[NEGOCIO_PERDIDO\]\]/gi, '')
    .trim()

  return {
    textoLimpo,
    indiceSlot: agendarMatch ? parseInt(agendarMatch[1], 10) : null,
    etapaNome: etapaMatch ? etapaMatch[1].trim() : null,
    ganho,
    perdido,
  }
}

export interface RespostaIAComAcoes {
  texto: string
  agendamentoCriado?: { data: Date; label: string }
  negocioAtualizado?: { etapaNome?: string; resultado?: 'ganho' | 'perdido' }
}

export async function chamarIAComAgenda(
  apiKey: string,
  empresaId: string,
  systemPrompt: string,
  historico: MensagemGroq[],
  config: Partial<ConfiguracaoIA>,
  contatoNome: string,
  contatoId?: string
): Promise<RespostaIAComAcoes> {
  const modelo = config.modelo ?? 'llama-3.3-70b-versatile'

  // 1. Slots de agenda livres
  const slots = await buscarProximosSlotsLivres(empresaId)

  // 2. Etapas do funil + oportunidade atual do contato (para o CRM/Kanban)
  let etapas: EtapaFunil[] = []
  let negocioAtual: Negocio | null = null
  if (contatoId) {
    try {
      etapas = await listarEtapas(empresaId)
      negocioAtual = await buscarNegocioAbertoDoContato(empresaId, contatoId)
    } catch (e) {
      console.error('[IA Ações] Erro ao buscar etapas/negócio do contato:', e)
    }
  }

  // 3. Montar contexto dinâmico de agenda
  let contextoAgenda: string
  if (slots.length > 0) {
    contextoAgenda = `

[SISTEMA DE AGENDA - LEIA COM ATENÇÃO]
Horários disponíveis:
${slots.map((s, i) => `${i}: ${s.label}`).join('\n')}

REGRA OBRIGATÓRIA: quando o cliente confirmar um horário e você disser que ficou agendado/marcado/confirmado, termine sua mensagem com este token (sem espaço antes):
[[AGENDAR:N]]
Onde N é o índice do horário escolhido acima (0, 1, 2, etc.)
Nunca inclua este token se o cliente ainda não confirmou.`
  } else {
    contextoAgenda = `

[SISTEMA DE AGENDA]
Não há horários disponíveis nos próximos 14 dias. Informe o cliente gentilmente que a agenda está cheia e que a equipe entrará em contato.`
  }

  // 3b. Montar contexto dinâmico de CRM/Kanban (só se houver contato vinculado)
  let contextoKanban = ''
  if (contatoId && etapas.length > 0) {
    const etapaAtualNome = negocioAtual
      ? etapas.find(e => e.id === negocioAtual!.etapaId)?.nome
      : null

    contextoKanban = `

[SISTEMA DE CRM/KANBAN - LEIA COM ATENÇÃO]
Etapas existentes no funil de vendas: ${etapas.map(e => e.nome).join(', ')}.
${negocioAtual
      ? `Este contato já tem uma oportunidade aberta, atualmente na etapa "${etapaAtualNome}".`
      : 'Este contato ainda não tem nenhuma oportunidade aberta no funil.'}

REGRAS OBRIGATÓRIAS:
- Quando a conversa avançar claramente de etapa (ex: cliente pediu uma proposta, começou a negociar valores/condições), termine sua mensagem com:
[[NEGOCIO_ETAPA:Nome Exato Da Etapa]]
usando exatamente um dos nomes de etapa listados acima.
- Quando o cliente confirmar que vai fechar negócio/comprar, termine com:
[[NEGOCIO_GANHO]]
- Quando o cliente disser claramente que não tem mais interesse ou desistiu, termine com:
[[NEGOCIO_PERDIDO]]
- Use no máximo um desses tokens por resposta, apenas quando fizer sentido real. Não force uma mudança de etapa a cada mensagem.`
  }

  const systemComContexto: MensagemGroq = {
    role: 'system',
    content: systemPrompt + contextoAgenda + contextoKanban,
  }

  // 4. Montar mensagens — filtra system duplicado se existir
  const mensagensParaGroq: MensagemGroq[] = [
    systemComContexto,
    ...historico.filter(m => m.role !== 'system'),
  ]

  // 5. Chamada à Groq
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelo,
      messages: mensagensParaGroq,
      temperature: config.temperatura ?? 0.7,
      max_tokens: config.maxTokens ?? 700,
    }),
  })

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}))
    throw new Error(
      (erro as { error?: { message?: string } }).error?.message ??
      `Groq API error: ${response.status}`
    )
  }

  const data = await response.json() as { choices: { message: { content: string } }[] }
  const textoResposta = data.choices[0]?.message?.content ?? ''

  // 6. Extrair todas as ações de uma vez e limpar o texto exibido ao usuário
  const acoes = extrairAcoes(textoResposta)
  const resultado: RespostaIAComAcoes = { texto: acoes.textoLimpo }

  // 6a. Executar agendamento, se houver
  if (acoes.indiceSlot !== null && acoes.indiceSlot >= 0 && acoes.indiceSlot < slots.length) {
    const slotEscolhido = slots[acoes.indiceSlot]
    try {
      await criarAgendamento(empresaId, {
        titulo: `Atendimento — ${contatoNome}`,
        tipo: 'reuniao',
        ...(contatoId ? { contatoId } : {}),
        contatoNome,
        data: slotEscolhido.slot,
        duracaoMin: 60,
        status: 'agendado',
        observacoes: 'Agendado automaticamente pela IA de atendimento via WhatsApp.',
      })
      resultado.agendamentoCriado = { data: slotEscolhido.slot, label: slotEscolhido.label }
    } catch (e) {
      console.error('[IA Ações] Erro ao criar agendamento:', e)
    }
  }

  // 6b. Executar mudança de etapa no Kanban, se houver e se houver contato vinculado
  if (acoes.etapaNome && contatoId) {
    try {
      const etapaAlvo = etapas.find(e => normalizar(e.nome) === normalizar(acoes.etapaNome!))
      if (etapaAlvo) {
        if (negocioAtual) {
          await moverNegocio(empresaId, negocioAtual.id, etapaAlvo.id)
        } else {
          await criarNegocio(empresaId, {
            titulo: `Oportunidade — ${contatoNome}`,
            contatoId,
            contatoNome,
            etapaId: etapaAlvo.id,
            prioridade: 'media',
            status: 'aberto',
            origem: 'ia',
          })
        }
        resultado.negocioAtualizado = { etapaNome: etapaAlvo.nome }
      } else {
        console.warn('[IA Ações] Etapa não encontrada:', acoes.etapaNome)
      }
    } catch (e) {
      console.error('[IA Ações] Erro ao atualizar etapa do negócio:', e)
    }
  }

  // 6c. Marcar ganho/perdido, se houver e se houver contato vinculado
  if ((acoes.ganho || acoes.perdido) && contatoId) {
    try {
      const alvo = negocioAtual ?? await buscarNegocioAbertoDoContato(empresaId, contatoId)
      if (alvo) {
        if (acoes.ganho) {
          await marcarGanho(empresaId, alvo.id)
          resultado.negocioAtualizado = { resultado: 'ganho' }
        } else {
          await marcarPerdido(empresaId, alvo.id)
          resultado.negocioAtualizado = { resultado: 'perdido' }
        }
      }
    } catch (e) {
      console.error('[IA Ações] Erro ao marcar resultado do negócio:', e)
    }
  }

  return resultado
}
