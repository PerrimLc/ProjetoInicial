import type {
  Agent, Conversation, Lead, KanbanColumn, AppNotification,
  ChartDataPoint, KnowledgeFile, Flow, AppSettings, UserProfile
} from '@/types'

export const mockAgents: Agent[] = [
  { id: '1', name: 'Aria', description: 'Especialista em atendimento ao cliente, resolve dúvidas e suporte técnico com empatia.', model: 'GPT-4o', temperature: 0.7, status: 'active', conversations: 1284, createdAt: '2024-01-15', color: '#8B5CF6', prompt: 'Você é Aria, uma assistente de atendimento...' },
  { id: '2', name: 'Max', description: 'Agente focado em conversão de leads, qualificação e fechamento de negócios.', model: 'GPT-4o', temperature: 0.8, status: 'active', conversations: 956, createdAt: '2024-02-10', color: '#06B6D4', prompt: 'Você é Max, especialista em vendas...' },
  { id: '3', name: 'Luna', description: 'Prospecção ativa, qualificação de leads e agendamento de reuniões comerciais.', model: 'Claude 3.5 Sonnet', temperature: 0.6, status: 'active', conversations: 742, createdAt: '2024-03-05', color: '#F59E0B', prompt: 'Você é Luna, SDR especialista...' },
  { id: '4', name: 'Neo', description: 'Suporte técnico especializado, análise de problemas e escalonamento de tickets.', model: 'GPT-4o Mini', temperature: 0.4, status: 'training', conversations: 128, createdAt: '2024-06-01', color: '#10B981', prompt: 'Você é Neo, suporte técnico...' },
  { id: '5', name: 'Eva', description: 'Customer Success proativa, onboarding, retenção e upsell de clientes.', model: 'Claude 3.5 Sonnet', temperature: 0.75, status: 'active', conversations: 534, createdAt: '2024-04-20', color: '#EC4899', prompt: 'Você é Eva, customer success...' },
  { id: '6', name: 'Kai', description: 'Qualificação de leads vindos de campanhas de marketing e nutrição automática.', model: 'GPT-4o Mini', temperature: 0.9, status: 'inactive', conversations: 87, createdAt: '2024-05-15', color: '#F97316', prompt: 'Você é Kai, especialista em marketing...' },
]

export const mockConversations: Conversation[] = [
  {
    id: '1', contact: { id: '1', name: 'Rafael Mendes', phone: '+55 11 99234-5678', company: 'TechCorp' },
    lastMessage: 'Perfeito! Vou aguardar o retorno.', lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(),
    unread: 2, status: 'active', agentName: 'Aria',
    messages: [
      { id: 'm1', content: 'Olá! Gostaria de saber mais sobre os planos.', sender: 'user', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: 'm2', content: 'Olá Rafael! Fico feliz em ajudar 😊 Temos 3 planos: Starter, Pro e Enterprise. Qual o tamanho da sua equipe?', sender: 'ai', timestamp: new Date(Date.now() - 24 * 60000).toISOString() },
      { id: 'm3', content: 'Somos uma equipe de 15 pessoas no comercial.', sender: 'user', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: 'm4', content: 'Para 15 pessoas, o plano Pro é ideal! Ele inclui até 20 usuários, todos os agentes de IA, CRM integrado e relatórios avançados por R$ 997/mês. Posso agendar uma demo?', sender: 'ai', timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
      { id: 'm5', content: 'Sim, pode ser quinta-feira às 14h?', sender: 'user', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: 'm6', content: 'Perfeito! Agendei a demo para quinta-feira às 14h. Você receberá um e-mail de confirmação. Alguma dúvida?', sender: 'ai', timestamp: new Date(Date.now() - 8 * 60000).toISOString() },
      { id: 'm7', content: 'Perfeito! Vou aguardar o retorno.', sender: 'user', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    ],
  },
  {
    id: '2', contact: { id: '2', name: 'Carolina Silva', phone: '+55 21 98765-4321', company: 'Inova Solutions' },
    lastMessage: 'Qual o prazo de implementação?', lastMessageTime: new Date(Date.now() - 12 * 60000).toISOString(),
    unread: 1, status: 'active', agentName: 'Max',
    messages: [
      { id: 'm1', content: 'Boa tarde! Vi vocês no LinkedIn e fiquei interessada.', sender: 'user', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
      { id: 'm2', content: 'Boa tarde, Carolina! Que ótimo! Qual é o principal desafio que você enfrenta hoje no atendimento?', sender: 'ai', timestamp: new Date(Date.now() - 44 * 60000).toISOString() },
      { id: 'm3', content: 'Temos muitos leads sem resposta rápida.', sender: 'user', timestamp: new Date(Date.now() - 40 * 60000).toISOString() },
      { id: 'm4', content: 'Exatamente o que resolvemos! Com nossa IA, o lead recebe resposta em menos de 30 segundos, 24/7. Aumentamos a conversão em até 3x.', sender: 'ai', timestamp: new Date(Date.now() - 35 * 60000).toISOString() },
      { id: 'm5', content: 'Qual o prazo de implementação?', sender: 'user', timestamp: new Date(Date.now() - 12 * 60000).toISOString() },
    ],
  },
  {
    id: '3', contact: { id: '3', name: 'Bruno Alves', phone: '+55 31 97654-3210', company: 'Alpha Vendas' },
    lastMessage: 'Obrigado pelo suporte!', lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    unread: 0, status: 'closed', agentName: 'Aria',
    messages: [
      { id: 'm1', content: 'Estou com problema no login.', sender: 'user', timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
      { id: 'm2', content: 'Olá Bruno! Vou te ajudar agora. Você está recebendo alguma mensagem de erro?', sender: 'ai', timestamp: new Date(Date.now() - 3 * 3600000 + 60000).toISOString() },
      { id: 'm3', content: 'Diz credenciais inválidas, mas tenho certeza da senha.', sender: 'user', timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString() },
      { id: 'm4', content: 'Tente limpar os cookies ou usar aba anônima. Se não funcionar, posso resetar sua senha.', sender: 'ai', timestamp: new Date(Date.now() - 2.4 * 3600000).toISOString() },
      { id: 'm5', content: 'Funcionou com a aba anônima!', sender: 'user', timestamp: new Date(Date.now() - 2.1 * 3600000).toISOString() },
      { id: 'm6', content: 'Ótimo! Limpe o cache e o problema não voltará. Posso ajudar com mais alguma coisa?', sender: 'ai', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'm7', content: 'Obrigado pelo suporte!', sender: 'user', timestamp: new Date(Date.now() - 2 * 3600000 + 120000).toISOString() },
    ],
  },
  {
    id: '4', contact: { id: '4', name: 'Mariana Costa', phone: '+55 11 96543-2109', company: 'NextGen' },
    lastMessage: 'Quero conhecer a solução enterprise.', lastMessageTime: new Date(Date.now() - 30 * 60000).toISOString(),
    unread: 3, status: 'new', agentName: 'Luna',
    messages: [
      { id: 'm1', content: 'Olá, recebi indicação de vocês.', sender: 'user', timestamp: new Date(Date.now() - 35 * 60000).toISOString() },
      { id: 'm2', content: 'Que ótimo! Em que posso ajudar?', sender: 'ai', timestamp: new Date(Date.now() - 34 * 60000).toISOString() },
      { id: 'm3', content: 'Quero conhecer a solução enterprise.', sender: 'user', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
    ],
  },
  {
    id: '5', contact: { id: '5', name: 'Pedro Rodrigues', phone: '+55 85 95432-1098', company: 'Fortis Tech' },
    lastMessage: 'Quanto custa a integração com o Salesforce?', lastMessageTime: new Date(Date.now() - 60 * 60000).toISOString(),
    unread: 0, status: 'active', agentName: 'Max',
    messages: [
      { id: 'm1', content: 'Quanto custa a integração com o Salesforce?', sender: 'user', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
      { id: 'm2', content: 'A integração com Salesforce está incluída nos planos Pro e Enterprise sem custo adicional! Posso te mostrar como funciona?', sender: 'ai', timestamp: new Date(Date.now() - 58 * 60000).toISOString() },
    ],
  },
]

export const mockLeads: Lead[] = [
  { id: '1', name: 'Rafael Mendes', company: 'TechCorp SA', phone: '+55 11 99234-5678', email: 'rafael@techcorp.com', source: 'LinkedIn', status: 'negotiation', value: 48000, responsible: 'Ana Lima', createdAt: '2024-06-15', score: 92 },
  { id: '2', name: 'Carolina Silva', company: 'Inova Solutions', phone: '+55 21 98765-4321', email: 'carolina@inova.com.br', source: 'Site', status: 'proposal', value: 24000, responsible: 'Carlos Rocha', createdAt: '2024-06-18', score: 78 },
  { id: '3', name: 'Bruno Alves', company: 'Alpha Vendas', phone: '+55 31 97654-3210', email: 'bruno@alphavendas.com', source: 'Indicação', status: 'qualified', value: 36000, responsible: 'Ana Lima', createdAt: '2024-06-20', score: 85 },
  { id: '4', name: 'Mariana Costa', company: 'NextGen Sistemas', phone: '+55 11 96543-2109', email: 'mariana@nextgen.io', source: 'Google Ads', status: 'new', value: 96000, responsible: 'Pedro Matos', createdAt: '2024-06-22', score: 65 },
  { id: '5', name: 'Pedro Rodrigues', company: 'Fortis Technology', phone: '+55 85 95432-1098', email: 'pedro@fortis.tech', source: 'LinkedIn', status: 'closed', value: 72000, responsible: 'Carlos Rocha', createdAt: '2024-06-10', score: 98 },
  { id: '6', name: 'Beatriz Ferreira', company: 'Pulse Digital', phone: '+55 11 94321-0987', email: 'beatriz@pulse.digital', source: 'Webinar', status: 'qualified', value: 18000, responsible: 'Ana Lima', createdAt: '2024-06-21', score: 72 },
  { id: '7', name: 'Lucas Oliveira', company: 'Apex Corp', phone: '+55 41 93210-9876', email: 'lucas@apex.corp', source: 'Site', status: 'proposal', value: 54000, responsible: 'Pedro Matos', createdAt: '2024-06-19', score: 81 },
  { id: '8', name: 'Fernanda Lima', company: 'Sigma Startups', phone: '+55 11 92109-8765', email: 'fernanda@sigma.vc', source: 'Cold Outreach', status: 'new', value: 120000, responsible: 'Carlos Rocha', createdAt: '2024-06-23', score: 58 },
]

export const mockKanbanColumns: KanbanColumn[] = [
  { id: 'new', title: 'Novo Lead', color: '#6366F1', cards: [
    { id: 'k1', title: 'Mariana Costa', company: 'NextGen Sistemas', value: 96000, responsible: 'PM', daysInStage: 1, priority: 'high', email: 'mariana@nextgen.io', phone: '+55 11 96543-2109' },
    { id: 'k2', title: 'Fernanda Lima', company: 'Sigma Startups', value: 120000, responsible: 'CR', daysInStage: 0, priority: 'medium', email: 'fernanda@sigma.vc' },
    { id: 'k3', title: 'Thiago Martins', company: 'CoreTech', value: 28000, responsible: 'AL', daysInStage: 2, priority: 'low' },
  ]},
  { id: 'qualified', title: 'Qualificado', color: '#8B5CF6', cards: [
    { id: 'k4', title: 'Bruno Alves', company: 'Alpha Vendas', value: 36000, responsible: 'AL', daysInStage: 3, priority: 'high' },
    { id: 'k5', title: 'Beatriz Ferreira', company: 'Pulse Digital', value: 18000, responsible: 'AL', daysInStage: 5, priority: 'medium' },
  ]},
  { id: 'proposal', title: 'Proposta', color: '#06B6D4', cards: [
    { id: 'k6', title: 'Carolina Silva', company: 'Inova Solutions', value: 24000, responsible: 'CR', daysInStage: 4, priority: 'high' },
    { id: 'k7', title: 'Lucas Oliveira', company: 'Apex Corp', value: 54000, responsible: 'PM', daysInStage: 2, priority: 'high' },
  ]},
  { id: 'negotiation', title: 'Negociação', color: '#F59E0B', cards: [
    { id: 'k8', title: 'Rafael Mendes', company: 'TechCorp SA', value: 48000, responsible: 'AL', daysInStage: 7, priority: 'high' },
  ]},
  { id: 'closed', title: 'Fechado', color: '#10B981', cards: [
    { id: 'k9', title: 'Pedro Rodrigues', company: 'Fortis Technology', value: 72000, responsible: 'CR', daysInStage: 0, priority: 'medium' },
  ]},
]

export const mockNotifications: AppNotification[] = [
  { id: '1', title: 'Novo lead capturado', message: 'Fernanda Lima da Sigma Startups entrou em contato.', type: 'info', time: new Date(Date.now() - 5 * 60000).toISOString(), read: false },
  { id: '2', title: 'Meta diária atingida', message: 'Parabéns! Você atingiu 100% da meta de conversão hoje.', type: 'success', time: new Date(Date.now() - 30 * 60000).toISOString(), read: false },
  { id: '3', title: 'Agente em treinamento', message: 'Neo completou 80% do treinamento.', type: 'warning', time: new Date(Date.now() - 2 * 3600000).toISOString(), read: false },
  { id: '4', title: 'Proposta visualizada', message: 'Rafael Mendes abriu a proposta enviada.', type: 'info', time: new Date(Date.now() - 3 * 3600000).toISOString(), read: true },
  { id: '5', title: 'Negócio fechado!', message: 'Pedro Rodrigues da Fortis Tech fechou R$ 72.000.', type: 'success', time: new Date(Date.now() - 86400000).toISOString(), read: true },
]

export const mockKnowledgeFiles: KnowledgeFile[] = [
  { id: '1', name: 'Manual do Produto v2.3.pdf', size: '4.2 MB', category: 'Produto', status: 'processed', chunks: 148, date: '22 Jun 2024' },
  { id: '2', name: 'Script de Vendas Q2.docx', size: '1.8 MB', category: 'Vendas', status: 'processed', chunks: 64, date: '20 Jun 2024' },
  { id: '3', name: 'Políticas de Suporte.pdf', size: '0.9 MB', category: 'Suporte', status: 'processed', chunks: 32, date: '18 Jun 2024' },
  { id: '4', name: 'Treinamento Onboarding.pptx', size: '12.4 MB', category: 'Treinamento', status: 'processed', chunks: 210, date: '15 Jun 2024' },
]

export const defaultFlowNodes = [
  { id: 'trigger', type: 'trigger' as const, label: 'Novo Lead', x: 80, y: 160, color: '#8B5CF6' },
  { id: 'msg1', type: 'message' as const, label: 'Boas-vindas', x: 280, y: 80, color: '#06B6D4' },
  { id: 'wait1', type: 'wait' as const, label: 'Aguardar 2min', x: 280, y: 240, color: '#F59E0B' },
  { id: 'condition', type: 'condition' as const, label: 'Respondeu?', x: 480, y: 160, color: '#10B981' },
  { id: 'msg2', type: 'message' as const, label: 'Follow-up IA', x: 680, y: 80, color: '#06B6D4' },
  { id: 'agent', type: 'agent' as const, label: 'Transferir Agente', x: 680, y: 240, color: '#EC4899' },
  { id: 'end1', type: 'end' as const, label: 'Finalizado', x: 880, y: 80, color: '#10B981' },
  { id: 'end2', type: 'end' as const, label: 'Finalizado', x: 880, y: 240, color: '#10B981' },
]

export const mockFlows: Flow[] = [
  { id: '1', name: 'Qualificação de Lead Inbound', status: 'active', runs: 1284, conversion: '34.2%', lastRun: '2 min atrás', nodes: defaultFlowNodes },
  { id: '2', name: 'Follow-up Pós Proposta', status: 'active', runs: 456, conversion: '28.7%', lastRun: '15 min atrás', nodes: [] },
  { id: '3', name: 'Onboarding Novo Cliente', status: 'inactive', runs: 89, conversion: '92.1%', lastRun: '3h atrás', nodes: [] },
  { id: '4', name: 'Reativação de Leads Frios', status: 'active', runs: 234, conversion: '12.4%', lastRun: '1h atrás', nodes: [] },
]

export const defaultSettings: AppSettings = {
  companyName: 'AgentAI Ltda.',
  companyEmail: 'contato@agentai.com.br',
  companyPhone: '+55 11 3000-0000',
  companyWebsite: 'https://agentai.com.br',
  whatsappConnected: true,
  openaiKey: 'sk-••••••••••••••••••••••••••••••',
  defaultModel: 'GPT-4o',
  defaultTemperature: 0.7,
  defaultPrompt: 'Você é um assistente de vendas especializado...',
  theme: 'dark',
  language: 'pt-BR',
  notificationsEnabled: true,
  twoFactor: true,
}

export const defaultProfile: UserProfile = {
  name: 'Arthur',
  lastName: 'Neves',
  email: 'arthur@agentai.com.br',
  phone: '+55 11 99999-8888',
  role: 'Diretor Comercial',
  company: 'AgentAI Ltda.',
  website: 'https://arthurneves.com.br',
  plan: 'Pro',
  avatar: '',
}

export const conversationChartData: ChartDataPoint[] = [
  { name: 'Seg', value: 124, value2: 98 },
  { name: 'Ter', value: 168, value2: 132 },
  { name: 'Qua', value: 143, value2: 115 },
  { name: 'Qui', value: 195, value2: 156 },
  { name: 'Sex', value: 221, value2: 178 },
  { name: 'Sab', value: 87, value2: 65 },
  { name: 'Dom', value: 52, value2: 40 },
]

export const conversionChartData: ChartDataPoint[] = [
  { name: 'Jan', value: 18.2 },
  { name: 'Fev', value: 22.4 },
  { name: 'Mar', value: 19.8 },
  { name: 'Abr', value: 26.1 },
  { name: 'Mai', value: 24.7 },
  { name: 'Jun', value: 31.5 },
]

export const revenueChartData: ChartDataPoint[] = [
  { name: 'Jan', value: 84000 },
  { name: 'Fev', value: 92000 },
  { name: 'Mar', value: 78000 },
  { name: 'Abr', value: 115000 },
  { name: 'Mai', value: 108000 },
  { name: 'Jun', value: 142000 },
]

export const agentUsageData = [
  { name: 'Aria', value: 35, color: '#8B5CF6' },
  { name: 'Max', value: 28, color: '#06B6D4' },
  { name: 'Luna', value: 18, color: '#F59E0B' },
  { name: 'Eva', value: 12, color: '#EC4899' },
  { name: 'Neo', value: 7, color: '#10B981' },
]

// Pool de respostas automáticas da IA por contexto
export const aiResponses = [
  'Entendido! Deixa eu verificar isso para você. Um momento... ✓',
  'Ótima pergunta! Com nossa plataforma você consegue automatizar esse processo completamente.',
  'Compreendo sua necessidade. Posso te mostrar como outros clientes resolveram exatamente isso.',
  'Perfeito! Vou encaminhar essas informações para nossa equipe especializada.',
  'Com certeza! Esse é um dos nossos diferenciais. Gostaria de agendar uma demonstração?',
  'Excelente! Para avançarmos, preciso de mais alguns detalhes sobre sua empresa.',
  'Nosso time técnico pode implementar essa solução em até 7 dias úteis.',
  'Que ótimo! Esse recurso está disponível no plano Pro e Enterprise.',
  'Posso te ajudar com isso agora mesmo. Qual é a sua maior dor hoje?',
  'Anotado! Vou criar uma proposta personalizada para o seu caso.',
]
