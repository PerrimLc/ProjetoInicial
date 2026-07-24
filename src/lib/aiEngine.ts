/**
 * aiEngine.ts — Motor de IA Humanizado v2.0
 * Respostas contextuais com técnicas reais de vendas (SPIN, BANT, objeções),
 * personalidade por agente, delay realista de 40–60 segundos.
 */
import type { Message } from '@/types'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type AgentStyle = 'aria' | 'max' | 'luna' | 'neo' | 'eva' | 'kai'

export interface AgentProfile {
  name: string
  role: string
  style: AgentStyle
  color: string
  personality: string
  emoji: boolean
}

export const agentProfiles: Record<string, AgentProfile> = {
  Aria: { name: 'Aria', role: 'Atendimento', style: 'aria', color: '#8B5CF6', personality: 'empática e acolhedora', emoji: true },
  Max:  { name: 'Max',  role: 'Vendas',      style: 'max',  color: '#06B6D4', personality: 'consultivo e estratégico', emoji: false },
  Luna: { name: 'Luna', role: 'SDR',          style: 'luna', color: '#F59E0B', personality: 'animada e curiosa', emoji: true },
  Neo:  { name: 'Neo',  role: 'Suporte',      style: 'neo',  color: '#10B981', personality: 'técnico e preciso', emoji: false },
  Eva:  { name: 'Eva',  role: 'Customer Success', style: 'eva', color: '#EC4899', personality: 'proativa e cuidadosa', emoji: true },
  Kai:  { name: 'Kai',  role: 'Marketing',    style: 'kai',  color: '#F97316', personality: 'criativo e entusiasmado', emoji: true },
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function firstName(name: string) { return name.split(' ')[0] }

function normalize(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
}

function hasKeyword(msg: string, keywords: string[]): boolean {
  const n = normalize(msg)
  return keywords.some(k => n.includes(normalize(k)))
}

// ─── Base de conhecimento do produto ─────────────────────────────────────────

const PRODUCT_KB = {
  planos: {
    starter: { preco: 'R$ 297/mês', usuarios: 3, agentes: 2, conversas: 1000 },
    pro:     { preco: 'R$ 997/mês', usuarios: 20, agentes: 10, conversas: 5000 },
    enterprise: { preco: 'sob consulta', usuarios: 'ilimitados', agentes: 'ilimitados', conversas: 'ilimitadas' },
  },
  diferenciais: [
    'Resposta automática em menos de 30 segundos, 24 horas por dia, 7 dias por semana',
    'Agentes treinados com a linguagem e cultura da sua empresa',
    'Integração nativa com WhatsApp Business, Salesforce e HubSpot',
    'Painel de analytics em tempo real com métricas de conversão',
    'CRM integrado com pipeline Kanban completo',
    'Base de conhecimento que aprende com cada interação',
    'Suporte prioritário com SLA de 4 horas',
  ],
  resultados: [
    'clientes que aumentaram a conversão em até 3x nos primeiros 60 dias',
    'redução de 70% no tempo médio de atendimento',
    'aumento de 45% na satisfação dos clientes (NPS)',
    'ROI médio de 380% nos primeiros 6 meses',
    'equipes que triplicaram a capacidade de atendimento sem contratar',
  ],
  objecoes: {
    caro: 'O investimento médio dos nossos clientes se paga em menos de 30 dias com o aumento de conversão. Posso te mostrar uma simulação com os números da sua operação?',
    complexo: 'A implementação leva em média 7 dias úteis e nossa equipe acompanha cada etapa. Muitos clientes ficam surpresos com a simplicidade do processo.',
    jatem: 'Entendo! Muitos dos nossos melhores clientes usavam outras ferramentas antes. O que costuma faltar nelas é a capacidade de personalização e o contexto real de vendas. Posso mostrar a diferença na prática?',
    naosei: 'Faz total sentido querer entender melhor antes de decidir. Posso te fazer algumas perguntas rápidas para montar uma demonstração focada exatamente no que você precisa?',
  },
}

// ─── Banco de respostas por intenção e agente ─────────────────────────────────

type IntentKey =
  | 'greeting' | 'price' | 'deadline' | 'integration' | 'demo'
  | 'cancel' | 'bug' | 'thanks' | 'team_size' | 'how_it_works'
  | 'roi' | 'objection_price' | 'objection_complex' | 'competition'
  | 'features' | 'security' | 'results' | 'closing' | 'followup'
  | 'need_discovery' | 'pain_response' | 'objection_already_have'

interface IntentMap {
  keywords: string[]
  replies: Partial<Record<AgentStyle, string[]>>
  default: string[]
}

const intentMap: Partial<Record<IntentKey, IntentMap>> = {

  // ── SAUDAÇÃO ────────────────────────────────────────────────────────────────
  greeting: {
    keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello', 'tudo bem', 'como vai', 'bom dia'],
    replies: {
      aria: [
        'Oi! Que bom falar com você hoje 😊 Sou a Aria, especialista em atendimento aqui da FoxIA. Antes de qualquer coisa — como você está? Em que posso te ajudar hoje?',
        'Olá! Fico muito feliz com o seu contato 💙 Sou a Aria e estou aqui para te ajudar no que precisar. Me conta, o que está buscando?',
      ],
      max: [
        'Olá! Aqui é o Max, consultor de soluções da FoxIA. Fico feliz com o seu contato. Para eu te ajudar da forma mais eficiente, me conta: você está buscando melhorar o atendimento, aumentar as vendas ou as duas coisas?',
        'Bom dia! Sou o Max, e trabalho com empresas que querem escalar resultados com IA. O que te trouxe até nós hoje?',
      ],
      luna: [
        'Oi oi! 😄 Aqui é a Luna! Fico muito animada com o seu contato — pode acreditar que você chegou no lugar certo! Me conta rapidinho: o que despertou seu interesse na FoxIA?',
        'Oiii! Que bom te ver por aqui! 🎉 Sou a Luna, SDR da FoxIA. Antes de tudo, me conta: você chegou até a gente por qual canal?',
      ],
      neo: [
        'Olá. Aqui é o Neo, do time de suporte técnico da FoxIA. Como posso ajudá-lo hoje?',
        'Bom dia. Sou o Neo, especialista técnico. Pode descrever o que precisa?',
      ],
      eva: [
        'Oi! Que prazer falar com você 💜 Sou a Eva, do time de Customer Success. Fico muito feliz em poder ajudar. Me conta, como estão as coisas por aí?',
        'Olá! Aqui é a Eva! Estou sempre de olho no sucesso dos nossos clientes 😊 O que posso fazer por você hoje?',
      ],
      kai: [
        'Oi! 🔥 Aqui é o Kai, especialista em crescimento e marketing da FoxIA! Que ótimo que você entrou em contato. O que está buscando?',
        'Oi! Kai aqui! 🚀 Sempre animado quando alguém quer escalar resultados. Me conta, o que te trouxe até a gente?',
      ],
    },
    default: ['Olá! Fico feliz com o seu contato. Em que posso te ajudar hoje?'],
  },

  // ── DESCOBERTA DE DOR / NECESSIDADE ─────────────────────────────────────────
  need_discovery: {
    keywords: ['vendas', 'atendimento', 'leads', 'clientes', 'conversão', 'resultados', 'crescer', 'escalar', 'melhorar', 'preciso', 'quero', 'busco', 'dificuldade', 'problema', 'desafio'],
    replies: {
      max: [
        'Entendo perfeitamente. Esse é exatamente o ponto em que ajudamos centenas de empresas.\n\nMe deixa fazer uma pergunta importante: hoje, quando um lead chega — seja pelo site, WhatsApp ou Instagram — quanto tempo em média a sua equipe leva para dar o primeiro retorno?\n\nPergunto porque a pesquisa da Harvard mostra que leads respondidos em menos de 5 minutos têm 21x mais chances de converter. Como está esse número na sua operação hoje?',
        'Faz todo sentido buscar isso agora. O mercado está cada vez mais exigente em velocidade e personalização.\n\nPara eu entender melhor o seu cenário: qual é a maior dificuldade que você enfrenta no processo comercial hoje — é a quantidade de leads, a qualidade do atendimento, o follow-up ou o fechamento?\n\nCada um desses pontos tem uma solução específica, e quero ter certeza de te mostrar o que é mais relevante para você.',
      ],
      luna: [
        'Que tema importante! 😊 Me conta mais... hoje, quando você pensa na sua operação de vendas/atendimento, qual é a parte que mais te dá dor de cabeça?\n\nÉ o volume de mensagens sem resposta? A equipe sobrecarregada? Ou talvez leads que somem sem dar retorno?\n\nQuero entender direitinho antes de te mostrar como podemos ajudar!',
        'Interessante! E me diz: você já tem alguma ferramenta de automação hoje, ou tudo ainda é feito manualmente pela equipe?\n\nPergunto porque a abordagem muda bastante dependendo do ponto em que você está — às vezes é uma questão de começar do zero, às vezes é complementar o que já existe.',
      ],
      aria: [
        'Entendo! Cada empresa tem um desafio específico, e quero ter certeza de te ajudar da forma mais personalizada possível 😊\n\nMe conta um pouco mais: no dia a dia, qual situação mais frustra você ou sua equipe? É a demora para responder clientes? Perder leads por falta de follow-up? Ou talvez a dificuldade de escalar sem aumentar a equipe?\n\nAssim consigo te mostrar exatamente como funciona para o seu caso.',
      ],
    },
    default: [
      'Para eu entender melhor e te ajudar de forma personalizada: qual é o principal desafio que você enfrenta hoje na sua operação?\n\nÉ o volume de atendimentos, a qualidade das respostas, a velocidade de retorno, ou o acompanhamento dos leads?',
    ],
  },

  // ── DOR EXPLÍCITA ────────────────────────────────────────────────────────────
  pain_response: {
    keywords: ['demora', 'lento', 'não dá conta', 'sobrecarregado', 'perdendo leads', 'sumindo', 'sem resposta', 'manual', 'trabalhoso', 'cansativo', 'muita coisa', 'equipe pequena'],
    replies: {
      max: [
        'Entendo muito bem essa situação. E posso te dizer: você não está sozinho nisso — é exatamente o que ouvimos de 90% das empresas que chegam até nós antes de implementar a solução.\n\nO problema principal é que cada hora de atraso na resposta faz o lead esfriar. Um lead que responderia "sim" às 10h da manhã, às 15h já está conversando com o concorrente.\n\nAgora me conta: qual é o impacto disso no seu negócio em termos de receita? Você já tentou estimar quantas oportunidades são perdidas por semana por causa disso?\n\nPergunto porque quando colocamos esse número na planilha, fica muito claro que o investimento na solução se paga rapidíssimo.',
        'Isso dói no bolso, literalmente. Cada lead não atendido a tempo é uma oportunidade que vai pro concorrente.\n\nTem um cliente nosso — empresa de médio porte, similar à sua — que antes de nos contratar perdia em média 40% dos leads por demora no primeiro contato. Em 60 dias com a plataforma, esse número caiu para menos de 5%.\n\nPosso te mostrar como eles chegaram nesse resultado? Acredito que o caminho deles é muito parecido com o seu.',
      ],
      aria: [
        'Que situação difícil! 😔 Equipe sobrecarregada é um dos problemas mais comuns que vejo, e o mais frustrante é que afeta direto a experiência do cliente.\n\nMe conta: quando você imagina uma solução ideal para isso, como você visualiza? Seria mais uma questão de automatizar as primeiras respostas, ou de ter alguém disponível fora do horário comercial também?\n\nQuero entender o que resolveria mesmo o problema pra te mostrar a abordagem certa 💙',
      ],
      luna: [
        'Ai, que situação! 😕 Mas boa notícia: você chegou exatamente no lugar certo para resolver isso!\n\nMe conta mais: esse problema de estar perdendo leads — você consegue ter uma ideia de quantos por semana? Mesmo que seja uma estimativa.\n\nPergunto porque quando a gente coloca um número nisso, fica muito mais fácil ver o retorno da solução. E spoiler: geralmente surpreende! 😄',
      ],
    },
    default: [
      'Entendo completamente essa situação. É um dos principais desafios que as empresas enfrentam hoje.\n\nMe conta: qual é o impacto direto disso no seu negócio? Você consegue estimar quantas oportunidades são perdidas por semana por causa disso?\n\nAssim consigo te mostrar uma solução mais precisa para o seu caso.',
    ],
  },

  // ── PREÇO ────────────────────────────────────────────────────────────────────
  price: {
    keywords: ['preço', 'valor', 'custo', 'quanto custa', 'quanto é', 'mensalidade', 'plano', 'planos', 'starter', 'pro', 'enterprise', 'cobrado', 'pagar', 'investimento', 'orçamento', 'tabela'],
    replies: {
      max: [
        'Ótima pergunta — e vou te responder de forma transparente.\n\nTemos 3 planos:\n• Starter: R$ 297/mês — ideal para times pequenos começando com IA\n• Pro: R$ 997/mês — o mais escolhido, para operações em crescimento\n• Enterprise: personalizado — para grandes volumes e necessidades específicas\n\nMas antes de te indicar qual faz mais sentido para você, me deixa fazer uma pergunta importante: qual é o volume mensal de leads ou atendimentos que vocês recebem hoje?\n\nCom esse número consigo te mostrar o ROI real — na maioria dos casos o investimento se paga em menos de 30 dias.',
        'Claro! Mas quero ter certeza de te passar o número certo, não só o mais barato.\n\nNosso plano mais contratado é o Pro (R$ 997/mês), e o motivo é simples: clientes nesse plano recuperam o investimento em média em 3 semanas com o aumento de conversão.\n\nAntes de eu te dar uma recomendação mais precisa: quantas pessoas na sua equipe precisariam usar a plataforma? E qual é a estimativa de mensagens/leads por mês?\n\nCom isso consigo dimensionar exatamente o que você precisa.',
      ],
      luna: [
        'Boa pergunta! 💰 Temos opções a partir de R$ 297/mês!\n\nMas olha... antes de falar de preço de cabeça, eu quero muito entender o seu cenário pra ter certeza de que estou te indicando o plano certo — não o mais barato nem o mais caro, mas o que realmente faz sentido para o seu momento.\n\nMe conta: quantas pessoas no time e mais ou menos quantos atendimentos/leads por mês? Prometo que com isso consigo te dar uma resposta muito mais útil do que só jogar um número! 😊',
      ],
      aria: [
        'Que boa pergunta! Nossos planos foram pensados para diferentes momentos de crescimento 😊\n\n💎 Starter: R$ 297/mês — perfeito para começar\n💎 Pro: R$ 997/mês — o favorito dos nossos clientes\n💎 Enterprise: personalizado para grandes operações\n\nPara eu te indicar o ideal, me conta: qual é o tamanho da sua equipe e a estimativa de atendimentos por mês?\n\nPrometo que com esses dados consigo te dar uma recomendação muito mais precisa — e talvez até encontrar a melhor condição para o seu caso!',
      ],
    },
    default: [
      'Temos 3 planos: Starter (R$ 297/mês), Pro (R$ 997/mês) e Enterprise (sob consulta).\n\nO plano ideal depende do seu volume de atendimentos e tamanho da equipe. Me conta um pouco mais sobre a sua operação para eu te recomendar a melhor opção?',
    ],
  },

  // ── OBJEÇÃO: MUITO CARO ───────────────────────────────────────────────────────
  objection_price: {
    keywords: ['caro', 'salgado', 'não cabe', 'acima do orçamento', 'muito', 'não tenho verba', 'sem budget', 'barato', 'desconto', 'abaixar', 'negociar', 'condição'],
    replies: {
      max: [
        'Entendo perfeitamente, e respeito muito essa colocação. Preço é uma conversa importante e quero ser honesto com você.\n\nVamos pensar juntos: se a plataforma te ajudasse a converter apenas 3 ou 4 leads a mais por mês que você hoje perde por demora ou falta de follow-up — quanto isso representa em receita para o seu negócio?\n\nPergunto porque na maioria dos casos, quando fazemos essa conta, o plano Pro de R$ 997 se paga com o primeiro lead adicional fechado. Posso te ajudar a fazer essa simulação?',
        'Faz sentido questionar o investimento — toda decisão financeira precisa de justificativa.\n\nVou ser direto: não queremos que você pague sem ter certeza do retorno. Por isso temos um período de teste de 14 dias com suporte completo.\n\nNesse período você consegue ver na prática o impacto na sua operação antes de qualquer compromisso financeiro de longo prazo. Faz sentido experimentar assim?',
      ],
      aria: [
        'Entendo sua preocupação com o investimento 😊 É uma dúvida muito legítima.\n\nMe conta uma coisa: hoje, quando você perde um lead por demora ou falta de follow-up, qual é o valor médio dessa oportunidade?\n\nPergunto porque quando a gente junta esse número com a quantidade de leads que saem do funil por mês, geralmente fica muito claro que o custo de não ter a solução é bem maior do que o investimento na plataforma. Posso te ajudar a fazer esse cálculo?',
      ],
      luna: [
        'Hmm, entendo! 😊 Mas me deixa te fazer uma pergunta antes de a gente encerrar essa conversa sobre preço...\n\nHoje, você consegue estimar quantos leads vocês perdem por mês por não conseguir responder rápido o suficiente? Mesmo que seja uma estimativa!\n\nJá vi vários clientes que tinham exatamente essa objeção e quando fizeram essa conta ficaram assustados com o quanto estavam deixando na mesa. Vale a pena checar antes de decidir, não acha?',
      ],
    },
    default: [
      'Entendo a preocupação com o investimento. Vamos pensar juntos?\n\nSe a plataforma te ajudasse a converter apenas 2-3 leads a mais por mês que hoje são perdidos por demora — quanto isso representa em receita?\n\nNa maioria dos casos o investimento se paga com o primeiro mês. Posso te ajudar a fazer essa simulação com os seus números?',
    ],
  },

  // ── OBJEÇÃO: JÁ TENHO SOLUÇÃO ────────────────────────────────────────────────
  objection_already_have: {
    keywords: ['já tenho', 'já uso', 'já temos', 'já funciona', 'temos algo', 'não preciso', 'satisfeito', 'funcionando'],
    replies: {
      max: [
        'Que ótimo saber que você já tem algo no lugar! Respeito muito isso.\n\nMe permite uma pergunta por curiosidade: com a solução atual, qual é o tempo médio de resposta para um lead que chega fora do horário comercial — à noite ou no fim de semana?\n\nPergunto porque esse é geralmente o ponto onde encontramos mais oportunidade de melhoria. Muitas empresas têm boas ferramentas durante o horário comercial, mas perdem muito no período noturno e nos finais de semana.',
      ],
      luna: [
        'Que legal que você já tem algo! 🙌 Então você já está na frente de muita gente.\n\nSó por curiosidade: o que você usa hoje consegue fazer o follow-up automático quando um lead some por alguns dias? E como funciona a qualificação automática — tem isso?\n\nPergunto porque às vezes o que parece que está funcionando tem uns buraquinhos que a gente só descobre quando compara. Não precisa trocar, mas vale ver se tem alguma oportunidade que está passando batida!',
      ],
    },
    default: [
      'Que ótimo que você já tem uma estrutura em funcionamento!\n\nMe conta: com o que você usa hoje, como está o atendimento fora do horário comercial? E o follow-up automático para leads que não responderam?\n\nPergunto porque geralmente esses são os pontos onde encontramos mais oportunidade, mesmo em empresas que já têm outras ferramentas.',
    ],
  },

  // ── OBJEÇÃO: COMPLEXIDADE ────────────────────────────────────────────────────
  objection_complex: {
    keywords: ['complicado', 'complexo', 'difícil', 'não sei usar', 'não entendo', 'técnico demais', 'minha equipe não', 'sem tecnologia'],
    replies: {
      max: [
        'Entendo essa preocupação — e posso te dizer que é a mais comum que ouvimos antes da demo.\n\nA realidade é que o setup completo leva em média 7 dias, e nosso time de implantação faz tudo junto com você. Não é uma documentação para ler sozinho — é uma mão no ombro do começo ao fim.\n\nUm dos nossos clientes mais satisfeitos hoje tinha zero experiência com tecnologia quando contratou. Em 2 semanas a equipe dele já usava com total autonomia.\n\nPosso te mostrar como funciona o processo de onboarding na prática? Você decide depois.',
      ],
      aria: [
        'Entendo totalmente essa preocupação 😊 E posso te garantir: fizemos questão de criar uma plataforma que qualquer pessoa consiga usar, sem precisar de conhecimento técnico.\n\nA interface foi pensada para ser intuitiva — tipo um WhatsApp, mas com superpoderes. E durante os primeiros 30 dias você tem o nosso time disponível para ajudar com qualquer dúvida.\n\nQue tal você me dizer qual parte pareceu mais complexa para você? Aí consigo mostrar especificamente como funciona esse pedaço.',
      ],
    },
    default: [
      'Entendo essa preocupação. Mas posso te contar uma coisa?\n\nNossa plataforma foi desenvolvida pensando em pessoas que não são técnicas. A configuração inicial leva em média 7 dias, e nosso time acompanha cada etapa.\n\nPosso te mostrar uma prévia de como funciona a interface? Acredito que vai mudar sua percepção.',
    ],
  },

  // ── SEGURANÇA / LGPD ─────────────────────────────────────────────────────────
  security: {
    keywords: ['segurança', 'seguranca', 'lgpd', 'privacidade', 'dados pessoais', 'compliance', 'criptografia', 'vazamento', 'onde ficam os dados', 'proteção de dados'],
    replies: {
      max: [
        'Ótima pergunta, e é algo que levamos muito a sério — especialmente falando com um público que exige esse nível de cuidado.\n\nToda a operação é criptografada em trânsito e em repouso, seguimos a LGPD integralmente, e você tem controle total sobre exportação e exclusão de dados a qualquer momento.\n\nQuer que eu te envie o resumo técnico de segurança para sua equipe de compliance avaliar?',
      ],
      neo: [
        'Boa pergunta técnica. Usamos criptografia em trânsito e em repouso, autenticação com controle de acesso por papel, e somos aderentes à LGPD — incluindo direito de exportação e exclusão de dados sob demanda.\n\nPosso te passar a documentação técnica de segurança, se for útil para sua equipe.',
      ],
    },
    default: [
      'Levamos segurança muito a sério: criptografia em trânsito e em repouso, controle de acesso e total aderência à LGPD, incluindo exportação e exclusão de dados quando quiser.\n\nPosso te enviar o resumo de segurança para sua análise?',
    ],
  },

  // ── CONCORRÊNCIA ──────────────────────────────────────────────────────────────
  competition: {
    keywords: ['concorrente', 'concorrência', 'outra empresa', 'comparar com', 'diferença para', 'melhor que', 'versus', ' vs '],
    replies: {
      max: [
        'Respeito muito quem está comparando opções — é sinal de que você está levando a decisão a sério.\n\nNão gosto de falar mal de concorrente, prefiro te mostrar onde entregamos mais valor: personalização real por agente, integração nativa com WhatsApp/CRM sem gambiarra, e um time de implantação que acompanha do início ao fim — não é só um software solto.\n\nSe quiser, me conta o que mais pesa pra você na comparação e eu te mostro exatamente como nos posicionamos nesse ponto.',
      ],
      kai: [
        'Adoro esse tipo de pergunta! 🔥 Comparar é sempre saudável.\n\nO que mais ouvimos de quem migrou de outras soluções é que a diferença aparece no dia a dia: agentes que realmente soam humanos, setup rápido e suporte que responde de verdade.\n\nMe conta quais soluções você está olhando? Assim consigo te mostrar os pontos que mais importam pro seu caso.',
      ],
    },
    default: [
      'Entendo que você esteja comparando opções, faz todo sentido. Prefiro não falar de concorrente diretamente, mas posso te mostrar exatamente onde entregamos mais valor no seu cenário específico.\n\nO que mais pesa pra você nessa comparação?',
    ],
  },

  // ── FECHAMENTO ─────────────────────────────────────────────────────────────────
  closing: {
    keywords: ['fechar', 'contratar', 'assinar', 'como começar', 'vamos fechar', 'quero contratar', 'proposta', 'contrato', 'quero assinar', 'bora fechar'],
    replies: {
      max: [
        'Excelente! Fico muito feliz em ouvir isso. 🎉\n\nO próximo passo é simples: eu te envio a proposta com os valores já ajustados pro seu volume, e assim que confirmar, nosso time de implantação entra em contato em até 24h para iniciar o setup.\n\nPosso já te mandar a proposta agora?',
        'Perfeito, vamos fechar então! Só preciso confirmar dois detalhes rápidos: qual plano faz mais sentido pro seu volume, e qual o melhor e-mail para eu enviar o contrato.',
      ],
      luna: [
        'Aaah que ótima notícia! 🎉 Fico muito feliz em fechar com você!\n\nDeixa eu já preparar tudo: me confirma o plano que combinamos e o e-mail pra onde mando o contrato, que eu já adianto tudo por aqui!',
      ],
    },
    default: [
      'Que ótimo que você quer seguir em frente! Para eu preparar a proposta, me confirma o plano ideal pro seu volume e o melhor e-mail para envio do contrato.',
    ],
  },

  // ── FOLLOW-UP / AINDA VOU PENSAR ────────────────────────────────────────────────
  followup: {
    keywords: ['vou pensar', 'preciso pensar', 'ainda não decidi', 'depois te falo', 'me chama depois', 'retomar depois', 'vou avaliar', 'preciso alinhar'],
    replies: {
      eva: [
        'Sem problema nenhum, decisão importante merece tempo! 💜\n\nPosso te deixar um material resumido para você compartilhar com quem mais precisa decidir junto? E se fizer sentido, te chamo daqui uns dias só para saber se surgiu alguma dúvida — sem pressão nenhuma.',
      ],
      max: [
        'Faz todo sentido dar esse tempo. Só para eu não perder o timing certo: quando seria um bom momento para eu retomar o contato — essa semana, ou prefere que eu aguarde mais?',
      ],
    },
    default: [
      'Sem problema, decisão importante merece tempo. Posso te chamar novamente em alguns dias só para saber se ficou alguma dúvida, ou prefere que eu aguarde você me chamar?',
    ],
  },

  // ── DEMONSTRAÇÃO / TESTE ────────────────────────────────────────────────────────
  demo: {
    keywords: ['demo', 'demonstração', 'quero testar', 'período de teste', 'trial', 'ver funcionando', 'agendar uma demo'],
    replies: {
      max: [
        'Com certeza! Temos um período de teste de 14 dias com suporte completo, sem compromisso.\n\nPosso agendar uma demonstração ao vivo com nosso time também, se preferir ver funcionando antes de decidir. Qual dia da semana funciona melhor pra você?',
      ],
      luna: [
        'Sim! 😄 Adoro quando alguém quer ver na prática!\n\nTemos 14 dias de teste completo, e também posso agendar uma demo ao vivo pra te mostrar tudo funcionando. Prefere já começar o teste ou ver a demo primeiro?',
      ],
    },
    default: [
      'Sim, temos um período de teste de 14 dias com suporte completo. Também posso agendar uma demonstração ao vivo se preferir ver tudo funcionando antes. O que prefere?',
    ],
  },

  // ── PRAZO DE IMPLEMENTAÇÃO ──────────────────────────────────────────────────────
  deadline: {
    keywords: ['prazo', 'quanto tempo leva', 'quando fica pronto', 'tempo de implementação', 'implantação', 'quanto tempo demora'],
    replies: {
      neo: [
        'A implementação completa leva em média 7 dias úteis: configuração dos agentes, integração com WhatsApp/CRM e treinamento com a base de conhecimento da sua empresa.\n\nNosso time acompanha cada etapa tecnicamente, então não fica por sua conta.',
      ],
    },
    default: [
      'A implementação leva em média 7 dias úteis, com nosso time acompanhando cada etapa junto com você — desde a configuração até o treinamento dos agentes com o conteúdo da sua empresa.',
    ],
  },

  // ── ROI ────────────────────────────────────────────────────────────────────────
  roi: {
    keywords: ['roi', 'retorno do investimento', 'payback', 'vale a pena', 'se paga', 'quanto tempo pra ter retorno'],
    replies: {
      max: [
        'Ótima pergunta, e gosto de responder com números reais: o ROI médio dos nossos clientes é de 380% nos primeiros 6 meses, com payback geralmente em menos de 30 dias.\n\nQuer que eu monte uma simulação com os números da sua operação, pra ficar mais concreto?',
      ],
    },
    default: [
      'O ROI médio dos nossos clientes fica em torno de 380% nos primeiros 6 meses, com o investimento se pagando geralmente em menos de 30 dias. Posso simular com os números da sua operação?',
    ],
  },

  // ── CANCELAMENTO ───────────────────────────────────────────────────────────────
  cancel: {
    keywords: ['cancelar', 'cancelamento', 'sair do plano', 'encerrar contrato', 'tem multa', 'fidelidade'],
    replies: {
      eva: [
        'Entendo a preocupação! Somos bem transparentes nisso: não trabalhamos com fidelidade obrigatória nem multa de cancelamento — você pode encerrar quando quiser, sem burocracia.\n\nPosso te contar o que costuma motivar essa dúvida? Às vezes dá pra resolver sem precisar chegar no cancelamento.',
      ],
    },
    default: [
      'Não trabalhamos com fidelidade obrigatória nem multa — você pode cancelar quando quiser. Posso saber o que está motivando essa dúvida? Talvez eu consiga ajudar antes disso.',
    ],
  },

  // ── SUPORTE TÉCNICO / BUG ───────────────────────────────────────────────────────
  bug: {
    keywords: ['bug', 'erro', 'não está funcionando', 'travou', 'quebrado', 'problema técnico', 'deu erro', 'não carrega'],
    replies: {
      neo: [
        'Poxa, vamos resolver isso rápido. Pode me detalhar o que exatamente aconteceu — em qual tela, e se apareceu alguma mensagem de erro específica?\n\nCom esses detalhes já consigo direcionar pro time técnico com prioridade.',
      ],
    },
    default: [
      'Vamos resolver isso o quanto antes. Pode me detalhar em qual parte aconteceu o problema e se apareceu alguma mensagem de erro? Assim já encaminho para o time técnico.',
    ],
  },

  // ── TAMANHO DA EQUIPE ────────────────────────────────────────────────────────────
  team_size: {
    keywords: ['pessoas na equipe', 'tamanho da equipe', 'quantos usuários', 'nossa equipe tem', 'somos uma equipe de'],
    replies: {
      max: [
        'Perfeito, com essa informação já consigo te indicar o plano certo — sem te empurrar pra um maior do que precisa nem deixar faltando espaço pra crescer. Me confirma também o volume aproximado de atendimentos por mês?',
      ],
    },
    default: [
      'Perfeito, com esse tamanho de equipe já consigo indicar o plano ideal. Me confirma também a estimativa de atendimentos por mês para eu fechar a recomendação certa?',
    ],
  },

  // ── COMO FUNCIONA NA PRÁTICA ─────────────────────────────────────────────────────
  how_it_works: {
    keywords: ['como funciona', 'como é o processo', 'como funciona na prática', 'me explica o funcionamento', 'como vocês fazem isso'],
    replies: {
      neo: [
        'Na prática funciona assim: o agente de IA recebe as conversas por WhatsApp (ou outro canal integrado), identifica a intenção da pessoa usando o contexto da sua empresa, responde de forma personalizada e, quando o lead está pronto, transfere pra um humano ou já agenda o próximo passo automaticamente.\n\nQuer que eu te mostre isso rodando em uma demonstração?',
      ],
    },
    default: [
      'O agente de IA recebe as mensagens pelo canal integrado (como WhatsApp), entende a intenção com base no contexto da sua empresa, responde de forma personalizada e avança o lead automaticamente até o próximo passo. Posso te mostrar isso numa demonstração?',
    ],
  },
}

// ─── Respostas genéricas de fallback (quando nenhuma intenção bate) ──────────

const fallbackReplies: Record<AgentStyle, string[]> = {
  aria: [
    'Que interessante! 😊 Me conta um pouco mais sobre o que você precisa, assim consigo te ajudar da melhor forma.',
    'Entendi! Para eu te dar a resposta certa, você pode detalhar um pouco mais o que está buscando? 💙',
  ],
  max: [
    'Entendido. Para eu te orientar com precisão, pode me dar mais contexto sobre o que você está buscando?',
    'Certo. Me conta um pouco mais sobre o seu cenário para eu conseguir te ajudar de forma mais direta.',
  ],
  luna: [
    'Ah, legal! 😄 Me conta mais sobre isso, quero entender direitinho pra te ajudar!',
    'Entendi! E me diz uma coisa: o que mais está pesando nessa decisão pra você?',
  ],
  neo: [
    'Compreendido. Pode detalhar melhor o que você precisa?',
    'Certo. Preciso de mais informações para te ajudar com precisão.',
  ],
  eva: [
    'Entendi! 💜 Me conta mais sobre isso para eu poder te ajudar da melhor forma.',
    'Claro! Só para eu entender melhor: pode detalhar um pouco mais o que você precisa?',
  ],
  kai: [
    'Boa! 🔥 Me conta mais sobre isso, quero entender melhor o seu cenário.',
    'Entendi! E qual é o principal objetivo que você quer alcançar com isso?',
  ],
}

// ─── Reações curtas (sim, obrigado, não agora...) ────────────────────────────
// Mensagens curtas merecem uma reação curta e natural, não o discurso padrão
// de descoberta/objeção — é isso que mais entrega a sensação de "resposta pronta".

const shortThanksReplies = [
  'Disponha! Fico por aqui se precisar de mais alguma coisa 😊',
  'Imagina! Qualquer dúvida é só chamar.',
  'Sempre às ordens! Bora seguir então?',
]

const shortAffirmativeReplies = [
  'Perfeito, vamos em frente então! 🙌',
  'Show! Bora seguir com isso.',
  'Ótimo, gostei! Deixa eu te passar o próximo passo.',
  'Combinado! Seguindo então.',
]

const shortNegativeReplies = [
  'Sem problema nenhum! Fico à disposição para quando fizer sentido pra você.',
  'Tranquilo, respeito o momento. Posso te deixar um material pra olhar com calma?',
  'Entendido, sem pressão. Se quiser retomar depois é só me chamar por aqui.',
]

// ─── Camada de humanização ────────────────────────────────────────────────────
// O banco de respostas continua sendo texto fixo (decisão consciente para não
// depender de API paga), mas variamos conectores comuns a cada chamada para
// reduzir a sensação de "resposta decorada" quando o mesmo trecho aparece
// em conversas diferentes.

const phraseVariants: [RegExp, string[]][] = [
  [/Pergunto porque/g, ['Pergunto porque', 'Isso porque', 'Digo isso porque', 'O motivo da pergunta é que']],
  [/Me conta/g, ['Me conta', 'Me diz', 'Conta pra mim', 'Queria entender']],
  [/Faz sentido/g, ['Faz sentido', 'Faz todo sentido', 'Entendo bem isso']],
  [/Entendo/g, ['Entendo', 'Entendi', 'Saquei', 'Compreendo']],
  [/Que ótimo/g, ['Que ótimo', 'Que bacana', 'Adorei saber']],
  [/^Claro!/g, ['Claro!', 'Com certeza!', 'Perfeito!']],
  [/Boa pergunta/g, ['Boa pergunta', 'Ótima pergunta', 'Gostei da pergunta']],
]

function varyPhrasing(text: string): string {
  let out = text
  for (const [regex, options] of phraseVariants) {
    out = out.replace(regex, () => pick(options))
  }
  return out
}

function isShortMessage(normalized: string, samples: string[]): boolean {
  return samples.some(s => {
    const n = normalize(s)
    return normalized === n || normalized.startsWith(n + ' ') || normalized.startsWith(n + ',')
  })
}

// ─── Motor principal ──────────────────────────────────────────────────────────

/**
 * Analisa a mensagem do usuário, identifica a intenção por palavras-chave
 * e retorna uma resposta contextual no estilo do agente responsável pela conversa.
 * Evita repetir literalmente uma resposta já enviada nessa mesma conversa e
 * varia trechos comuns para soar menos "decorado".
 */
export function generateAIResponse(
  content: string,
  agentName: string | undefined,
  contactName: string,
  history: Message[]
): string {
  const profile = Object.values(agentProfiles).find(a => a.name === agentName) ?? agentProfiles.Aria
  const style = profile.style
  const name = firstName(contactName || '')
  const normalized = normalize(content).trim()

  let pool: string[] | null = null

  // Mensagens curtas (sim, obrigado, não agora...) merecem reação curta, não o roteiro padrão
  if (normalized.length > 0 && normalized.length <= 20) {
    if (isShortMessage(normalized, ['obrigado', 'obrigada', 'valeu', 'vlw', 'brigadão', 'thanks'])) {
      pool = shortThanksReplies
    } else if (isShortMessage(normalized, ['sim', 'quero', 'quero sim', 'ok', 'okay', 'certo', 'beleza', 'fechado', 'pode ser', 'bora', 'vamos', 'aceito', 'com certeza', 'manda'])) {
      pool = shortAffirmativeReplies
    } else if (isShortMessage(normalized, ['nao', 'não', 'agora nao', 'depois', 'talvez depois', 'nao obrigado'])) {
      pool = shortNegativeReplies
    }
  }

  // Intenções por palavra-chave
  if (!pool) {
    const matchedEntry = (Object.entries(intentMap) as [IntentKey, IntentMap][])
      .find(([, intent]) => hasKeyword(content, intent.keywords))
    pool = matchedEntry ? (matchedEntry[1].replies[style] ?? matchedEntry[1].default) : null
  }

  // Categorias cobertas pela base de conhecimento do produto, mas que ainda
  // não tinham nenhuma resposta dedicada no intentMap
  if (!pool) {
    if (hasKeyword(content, ['integração', 'integra', 'whatsapp', 'salesforce', 'hubspot', 'api'])) {
      pool = [
        `Temos integração nativa com WhatsApp Business, Salesforce e HubSpot — sem precisar de desenvolvedor para configurar. ${pick(PRODUCT_KB.diferenciais)}. Quer que eu te mostre como funciona na prática?`,
      ]
    } else if (hasKeyword(content, ['funcionalidade', 'recurso', 'o que faz', 'faz o que', 'diferencial'])) {
      pool = [
        `Um dos nossos principais diferenciais é: ${pick(PRODUCT_KB.diferenciais)}. Quer que eu aprofunde em algum ponto específico?`,
      ]
    } else if (hasKeyword(content, ['resultado', 'case', 'cases', 'prova', 'quem usa', 'funciona mesmo'])) {
      pool = [
        `Temos ${pick(PRODUCT_KB.resultados)}. Posso te mostrar um case parecido com o seu cenário?`,
      ]
    }
  }

  const basePool = pool ?? fallbackReplies[style]

  // Evita repetir literalmente uma resposta já enviada nessa conversa
  const unused = basePool.filter(r => !history.some(m => m.sender === 'ai' && m.content === r))
  let reply = pick(unused.length > 0 ? unused : basePool)

  reply = varyPhrasing(reply)

  // Usa o nome do contato organicamente, sem forçar em toda mensagem
  if (name && Math.random() < 0.35 && !reply.startsWith(name)) {
    reply = `${name}, ${reply.charAt(0).toLowerCase()}${reply.slice(1)}`
  }

  return reply
}

/**
 * Calcula um delay de "digitando..." proporcional ao tamanho da resposta,
 * para simular um tempo de resposta humano/realista sem travar a demo.
 * Faixa: ~1.2s a 4.5s.
 */
export function getTypingDelay(reply: string): number {
  const base = 1200
  const perChar = 12
  const jitter = Math.random() * 800
  return Math.min(base + reply.length * perChar * 0.05 + jitter, 4500)
}
