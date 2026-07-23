/**
 * Utilitário de seed para ambiente de desenvolvimento.
 * Cria dados de exemplo no Firestore para facilitar testes e demonstrações.
 *
 * ATENÇÃO: Esta função só pode ser executada em ambiente de desenvolvimento
 * (import.meta.env.DEV === true).
 */

import { criarSetor } from '@/services/empresas/setorService'
import { criarEtiqueta } from '@/services/contatos/etiquetaService'
import { criarContato } from '@/services/contatos/contatoService'
import { listarEtapas } from '@/services/crm/etapaFunilService'
import { criarNegocio } from '@/services/crm/negocioService'
import { criarConversa } from '@/services/atendimento/conversaService'
import { enviarMensagem } from '@/services/atendimento/mensagemService'
import { criarRespostaRapida } from '@/services/atendimento/respostaRapidaService'

// ─── Dados de seed ────────────────────────────────────────────────────────────

const SETORES_SEED = [
  { nome: 'Vendas', descricao: 'Equipe responsável por prospecção e fechamento de negócios' },
  { nome: 'Suporte', descricao: 'Atendimento ao cliente pós-venda e resolução de problemas' },
]

const ETIQUETAS_SEED = [
  { nome: 'VIP', cor: '#8B5CF6' },
  { nome: 'Urgente', cor: '#EF4444' },
  { nome: 'Aguardando retorno', cor: '#F59E0B' },
  { nome: 'Novo lead', cor: '#10B981' },
  { nome: 'Inativo', cor: '#6B7280' },
]

const CONTATOS_SEED = [
  { nome: 'Ana Paula Silva', telefone: '11999990001', email: 'ana.silva@email.com', empresa: 'Tech Solutions Ltda', origem: 'site' },
  { nome: 'Bruno Oliveira', telefone: '11999990002', email: 'bruno.oliveira@empresa.com.br', empresa: 'Oliveira & Associados', origem: 'indicacao' },
  { nome: 'Carla Mendes', telefone: '11999990003', email: 'carla.mendes@gmail.com', empresa: 'Grupo Mendes', origem: 'whatsapp' },
  { nome: 'Diego Ferreira', telefone: '11999990004', email: 'diego.ferreira@startup.io', empresa: 'StartupIO', origem: 'anuncio' },
  { nome: 'Elena Costa', telefone: '11999990005', email: 'elena.costa@comercial.net', empresa: 'Comercial Costa', origem: 'site' },
  { nome: 'Felipe Souza', telefone: '11999990006', email: 'felipe.souza@outlook.com', empresa: 'Souza Importados', origem: 'indicacao' },
  { nome: 'Gabriela Lima', telefone: '11999990007', email: 'gabriela.lima@agencia.com', empresa: 'Agência Lima', origem: 'whatsapp' },
  { nome: 'Henrique Rocha', telefone: '11999990008', email: 'henrique.rocha@construtora.com', empresa: 'Construtora Rocha', origem: 'anuncio' },
  { nome: 'Isabel Martins', telefone: '11999990009', email: 'isabel.martins@saude.med.br', empresa: 'Clínica Saúde+', origem: 'site' },
  { nome: 'João Alves', telefone: '11999990010', email: 'joao.alves@financas.com.br', empresa: 'Finanças Alves', origem: 'indicacao' },
]

const RESPOSTAS_RAPIDAS_SEED = [
  {
    titulo: 'Boas-vindas',
    atalho: '/bv',
    mensagem: 'Olá! Bem-vindo(a) ao nosso atendimento. Como posso ajudá-lo(a) hoje?',
    ativa: true,
  },
  {
    titulo: 'Aguarde um momento',
    atalho: '/aguarde',
    mensagem: 'Por favor, aguarde um momento enquanto verifico as informações para você. 😊',
    ativa: true,
  },
  {
    titulo: 'Envio de proposta',
    atalho: '/proposta',
    mensagem: 'Vou preparar uma proposta personalizada e enviar em breve para seu e-mail. Alguma dúvida adicional?',
    ativa: true,
  },
  {
    titulo: 'Encerramento',
    atalho: '/enc',
    mensagem: 'Obrigado pelo contato! Caso precise de mais ajuda, estaremos aqui. Tenha um ótimo dia! 🌟',
    ativa: true,
  },
]

const MENSAGENS_SIMULADAS: Record<number, { texto: string; direcao: 'entrada' | 'saida' }[]> = {
  0: [
    { texto: 'Olá, gostaria de saber mais sobre seus serviços.', direcao: 'entrada' },
    { texto: 'Olá! Bem-vindo(a) ao nosso atendimento. Como posso ajudá-lo(a) hoje?', direcao: 'saida' },
    { texto: 'Tenho interesse no plano empresarial.', direcao: 'entrada' },
    { texto: 'Claro! Vou preparar uma proposta e enviar em instantes.', direcao: 'saida' },
  ],
  1: [
    { texto: 'Boa tarde! Preciso de suporte com minha conta.', direcao: 'entrada' },
    { texto: 'Boa tarde! Qual é o problema que está enfrentando?', direcao: 'saida' },
    { texto: 'Não consigo acessar o painel administrativo.', direcao: 'entrada' },
    { texto: 'Entendido. Vou verificar sua conta agora.', direcao: 'saida' },
    { texto: 'Obrigado pela rapidez!', direcao: 'entrada' },
  ],
  2: [
    { texto: 'Olá, vi o anúncio e fiquei interessado.', direcao: 'entrada' },
    { texto: 'Que ótimo! Posso te explicar mais detalhes sobre o produto?', direcao: 'saida' },
    { texto: 'Sim, por favor!', direcao: 'entrada' },
  ],
  3: [
    { texto: 'Quero cancelar meu pedido.', direcao: 'entrada' },
    { texto: 'Lamento ouvir isso. Pode me dizer o motivo?', direcao: 'saida' },
    { texto: 'Encontrei um preço melhor em outro lugar.', direcao: 'entrada' },
    { texto: 'Entendo. Posso verificar se conseguimos igualar a oferta.', direcao: 'saida' },
  ],
  4: [
    { texto: 'Preciso de uma nota fiscal atualizada.', direcao: 'entrada' },
    { texto: 'Claro! Pode me informar o número do pedido?', direcao: 'saida' },
    { texto: 'Pedido #12345', direcao: 'entrada' },
    { texto: 'Perfeito, estou gerando a nota agora.', direcao: 'saida' },
    { texto: 'Obrigado!', direcao: 'entrada' },
    { texto: 'Pronto! A nota foi enviada para seu e-mail. 📄', direcao: 'saida' },
  ],
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Executa o seed de dados de desenvolvimento no Firestore.
 *
 * Cria os seguintes dados para a empresa informada:
 * - 2 setores
 * - 5 etiquetas
 * - 10 contatos
 * - 8 negócios distribuídos nas etapas do funil
 * - 5 conversas com mensagens simuladas
 * - 4 respostas rápidas
 *
 * @param empresaId - ID da empresa destino no Firestore
 * @param adminUid  - UID do usuário administrador (usado como responsável nos dados)
 *
 * @throws Error se chamado fora do ambiente de desenvolvimento
 */
export async function runSeed(empresaId: string, adminUid: string): Promise<void> {
  if (!import.meta.env.DEV) {
    throw new Error(
      '[seed] runSeed() só pode ser executada em ambiente de desenvolvimento (import.meta.env.DEV).'
    )
  }

  console.group('[seed] Iniciando seed de dados de desenvolvimento...')
  console.log(`[seed] Empresa: ${empresaId}`)
  console.log(`[seed] Admin:   ${adminUid}`)

  try {
    // ── 1. Setores ─────────────────────────────────────────────────────────
    console.log('[seed] Criando setores...')
    const setorIds: string[] = []
    for (const setor of SETORES_SEED) {
      const id = await criarSetor(empresaId, setor)
      setorIds.push(id)
      console.log(`[seed]   Setor criado: "${setor.nome}" (${id})`)
    }

    // ── 2. Etiquetas ───────────────────────────────────────────────────────
    console.log('[seed] Criando etiquetas...')
    const etiquetaIds: string[] = []
    for (const etiqueta of ETIQUETAS_SEED) {
      const id = await criarEtiqueta(empresaId, etiqueta)
      etiquetaIds.push(id)
      console.log(`[seed]   Etiqueta criada: "${etiqueta.nome}" (${id})`)
    }

    // ── 3. Contatos ────────────────────────────────────────────────────────
    console.log('[seed] Criando contatos...')
    const contatoIds: string[] = []
    for (let i = 0; i < CONTATOS_SEED.length; i++) {
      const contato = CONTATOS_SEED[i]
      // Atribuir 1-2 etiquetas aleatórias a cada contato
      const etiquetasSelecionadas = etiquetaIds.slice(i % etiquetaIds.length, (i % etiquetaIds.length) + 2)
      const id = await criarContato(empresaId, {
        ...contato,
        etiquetaIds: etiquetasSelecionadas,
        responsavelId: adminUid,
        ativo: true,
      })
      contatoIds.push(id)
      console.log(`[seed]   Contato criado: "${contato.nome}" (${id})`)
    }

    // ── 4. Negócios distribuídos nas etapas ────────────────────────────────
    console.log('[seed] Buscando etapas do funil...')
    const etapas = await listarEtapas(empresaId)
    if (etapas.length === 0) {
      console.warn('[seed]   Nenhuma etapa encontrada. Pule a criação de negócios ou crie as etapas padrão primeiro.')
    } else {
      console.log(`[seed]   ${etapas.length} etapas encontradas.`)
      console.log('[seed] Criando negócios...')

      const NEGOCIOS_SEED = [
        { titulo: 'Implementação ERP', contatoIdx: 0, valor: 15000, prioridade: 'alta' as const, origem: 'site' },
        { titulo: 'Consultoria mensal', contatoIdx: 1, valor: 5000, prioridade: 'media' as const, origem: 'indicacao' },
        { titulo: 'Licença software anual', contatoIdx: 2, valor: 8500, prioridade: 'alta' as const, origem: 'anuncio' },
        { titulo: 'Suporte técnico trimestral', contatoIdx: 3, valor: 3600, prioridade: 'baixa' as const, origem: 'site' },
        { titulo: 'Treinamento equipe', contatoIdx: 4, valor: 4200, prioridade: 'media' as const, origem: 'indicacao' },
        { titulo: 'Migração de dados', contatoIdx: 5, valor: 6800, prioridade: 'alta' as const, origem: 'site' },
        { titulo: 'Auditoria de segurança', contatoIdx: 6, valor: 9500, prioridade: 'alta' as const, origem: 'anuncio' },
        { titulo: 'Integração API', contatoIdx: 7, valor: 7200, prioridade: 'media' as const, origem: 'site' },
      ]

      for (let i = 0; i < NEGOCIOS_SEED.length; i++) {
        const neg = NEGOCIOS_SEED[i]
        // Distribuir negócios uniformemente entre as etapas ativas
        const etapasAtivas = etapas.filter((e) => e.ativo)
        const etapa = etapasAtivas[i % etapasAtivas.length]
        const contatoId = contatoIds[neg.contatoIdx]
        const contato = CONTATOS_SEED[neg.contatoIdx]

        const id = await criarNegocio(empresaId, {
          titulo: neg.titulo,
          contatoId,
          contatoNome: contato.nome,
          etapaId: etapa.id,
          responsavelId: adminUid,
          valor: neg.valor,
          prioridade: neg.prioridade,
          status: 'aberto',
          origem: neg.origem,
          observacoes: `Negócio criado via seed de desenvolvimento.`,
        })
        console.log(`[seed]   Negócio criado: "${neg.titulo}" na etapa "${etapa.nome}" (${id})`)
      }
    }

    // ── 5. Conversas com mensagens simuladas ───────────────────────────────
    console.log('[seed] Criando conversas e mensagens...')
    const statusConversas: Array<'aguardando' | 'em_atendimento' | 'finalizada'> = [
      'aguardando',
      'em_atendimento',
      'aguardando',
      'em_atendimento',
      'finalizada',
    ]

    for (let i = 0; i < 5; i++) {
      const contato = CONTATOS_SEED[i]
      const contatoId = contatoIds[i]
      const status = statusConversas[i]
      const mensagensDoGrupo = MENSAGENS_SIMULADAS[i] ?? []
      const ultimaMensagem = mensagensDoGrupo.length > 0
        ? mensagensDoGrupo[mensagensDoGrupo.length - 1].texto
        : 'Conversa iniciada.'

      const conversaId = await criarConversa(empresaId, {
        contatoId,
        contatoNome: contato.nome,
        telefone: contato.telefone,
        atendenteId: status === 'em_atendimento' ? adminUid : undefined,
        setorId: setorIds[i % setorIds.length],
        status,
        ultimaMensagem,
        ultimaMensagemEm: new Date(),
        mensagensNaoLidas: status === 'aguardando' ? mensagensDoGrupo.filter((m) => m.direcao === 'entrada').length : 0,
        etiquetaIds: etiquetaIds.slice(i % 2, (i % 2) + 1),
        origem: 'simulacao',
      })
      console.log(`[seed]   Conversa criada: "${contato.nome}" status="${status}" (${conversaId})`)

      // Criar mensagens da conversa
      for (const msg of mensagensDoGrupo) {
        await enviarMensagem(empresaId, conversaId, {
          conversaId,
          texto: msg.texto,
          tipo: 'texto',
          direcao: msg.direcao,
          remetenteId: msg.direcao === 'saida' ? adminUid : undefined,
          status: 'lida',
        })
      }
      console.log(`[seed]     ${mensagensDoGrupo.length} mensagens criadas.`)
    }

    // ── 6. Respostas rápidas ───────────────────────────────────────────────
    console.log('[seed] Criando respostas rápidas...')
    for (const rr of RESPOSTAS_RAPIDAS_SEED) {
      const id = await criarRespostaRapida(empresaId, {
        ...rr,
        setorId: undefined,
      })
      console.log(`[seed]   Resposta rápida criada: "${rr.titulo}" (atalho: ${rr.atalho}) (${id})`)
    }

    console.log('[seed] ✅ Seed concluído com sucesso!')
  } catch (error) {
    console.error('[seed] ❌ Erro durante o seed:', error)
    throw error
  } finally {
    console.groupEnd()
  }
}
