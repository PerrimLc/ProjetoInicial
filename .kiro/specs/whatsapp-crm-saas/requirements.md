# Requirements Document

## Introduction

Transformação de um template frontend React/TypeScript/Vite em um SaaS multiempresa de atendimento e CRM, com integração futura à API oficial do WhatsApp. Na primeira versão, conversas e mensagens funcionam de forma simulada via Cloud Firestore. O sistema roda no plano gratuito Firebase Spark (sem Cloud Functions, sem Firebase Storage).

O template existente possui: Sidebar colapsável com framer-motion, TopBar, tema dark/light, componentes UI prontos (Button, Card, Modal, Badge, Avatar, Input, Toast, Skeleton, Progress, ScrollArea, Separator, StatusDot), páginas Dashboard/Conversations/CRM/Leads/Agents/Flows/Analytics/Settings/Login/Profile, AppContext com localStorage, React Router v6, Tailwind CSS, recharts e lucide-react.

O objetivo e substituir os dados mock e o AppContext baseado em localStorage por Firebase Authentication e Cloud Firestore, preservando 100% do design visual existente.

## Glossary

- **Empresa**: Tenant do sistema. Todos os dados operacionais ficam isolados dentro de `empresas/{empresaId}`.
- **Membro**: Usuario vinculado a uma empresa com papel (administrador, supervisor, atendente).
- **Conversa simulada**: Conversa cujo `origem` e `"simulacao"`, gerenciada pelo Firestore sem API WhatsApp.
- **Metricas**: Documento `empresas/{empresaId}/metricas/principal` com contadores mantidos pelo frontend.
- **Listener**: Assinatura em tempo real do Firestore via `onSnapshot`.
- **Service**: Modulo TypeScript puro que encapsula queries ao Firestore, sem acesso a React.
- **Hook**: Custom hook React que chama services e gerencia estado (data, loading, error).

## Requirements

### Requirement 1: Base Firebase e Infraestrutura

**User Story:** Como desenvolvedor, quero uma configuracao Firebase robusta e bem estruturada, para que toda a aplicacao use Firestore e Authentication de forma segura e tipada.

#### Acceptance Criteria

1. WHEN o projeto e inicializado THEN o Firebase deve ser inicializado a partir de variaveis de ambiente `VITE_FIREBASE_*` sem nenhuma chave hardcoded no codigo.
2. WHEN o Firebase e configurado THEN o arquivo `src/services/firebase/firebase.ts` deve exportar `app`, `auth` e `db` (Firestore).
3. WHEN o arquivo `.env.example` e consultado THEN ele deve listar as seis variaveis: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
4. WHEN os types do dominio sao definidos THEN `src/types/index.ts` deve exportar interfaces para: `Usuario`, `Empresa`, `MembroEmpresa`, `Setor`, `Contato`, `Etiqueta`, `EtapaFunil`, `Negocio`, `Conversa`, `Mensagem`, `RespostaRapida` e tipos auxiliares `PapelUsuario`, `StatusConversa`, `StatusMensagem`, `DirecaoMensagem`, `PrioridadeNegocio`, `StatusNegocio`.
5. WHEN dados sao gravados no Firestore THEN campos de data devem usar `serverTimestamp()`.
6. WHEN dados sao lidos do Firestore THEN `Timestamp` do Firestore devem ser convertidos para `Date` nos services, nunca nos componentes.
7. WHEN qualquer service e chamado THEN ele deve capturar erros e relancar com mensagens em portugues.
8. WHEN o arquivo `firestore.rules` e avaliado THEN deve bloquear acesso a usuarios nao autenticados em todas as collections.
9. WHEN o arquivo `firestore.indexes.json` existe THEN deve conter apenas indices efetivamente usados pelas queries implementadas.
10. WHEN o ambiente de desenvolvimento e executado THEN deve existir `src/utils/seed.ts` com funcao `runSeed()` que cria: 1 empresa, 1 admin, 2 atendentes, 2 setores, 5 etiquetas, 6 etapas, 10 contatos, 8 negocios, 5 conversas com mensagens, 4 respostas rapidas.

---

### Requirement 2: Autenticacao

**User Story:** Como usuario, quero me cadastrar com e-mail e senha e fazer login com seguranca, para que minha sessao seja persistida e minhas rotas protegidas.

#### Acceptance Criteria

1. WHEN o usuario acessa `/login` THEN ele ve formulario com abas Entrar e Criar Conta, preservando o design visual existente.
2. WHEN o usuario faz login com credenciais validas no Firebase Auth THEN e redirecionado para `/`.
3. WHEN o usuario faz login com credenciais invalidas THEN ve mensagem de erro em portugues, por exemplo E-mail ou senha incorretos.
4. WHEN o usuario clica em Esqueci a senha THEN o Firebase envia e-mail de recuperacao e o usuario ve confirmacao em portugues.
5. WHEN o usuario se cadastra THEN o fluxo e: criar conta Firebase Auth, criar `usuarios/{uid}`, criar empresa, criar membro administrador, criar 6 etapas padrao, redirecionar para dashboard.
6. WHEN as etapas padrao sao criadas THEN sao: "Novo lead" (ordem 1), "Contato realizado" (2), "Proposta enviada" (3), "Negociacao" (4), "Ganho" (5), "Perdido" (6).
7. WHEN o usuario autenticado tenta acessar `/login` THEN e redirecionado para `/`.
8. WHEN o usuario nao autenticado tenta acessar rota protegida THEN e redirecionado para `/login`.
9. WHEN o usuario faz logout THEN a sessao Firebase e encerrada e e redirecionado para `/login`.
10. WHEN o `AuthContext` e acessado THEN expoe: `usuario`, `empresa`, `membro`, `carregando`, `login()`, `cadastrar()`, `logout()`, `recuperarSenha()`.
11. WHEN um membro tem `ativo: false` THEN ve mensagem "Sua conta foi desativada. Contate o administrador." e nao acessa o sistema.
12. WHEN o carregamento inicial da sessao esta em andamento THEN uma tela de loading e exibida sem flash de tela de login.

---

### Requirement 3: Sistema Multiempresa e Permissoes

**User Story:** Como administrador, quero que minha empresa tenha dados completamente isolados de outras empresas, e que cada membro tenha apenas as permissoes do seu papel.

#### Acceptance Criteria

1. WHEN o usuario se cadastra THEN cria empresa com `criadaPor: uid`, `ativa: true` em `empresas/{empresaId}`.
2. WHEN qualquer dado operacional e criado THEN deve estar sob `empresas/{empresaId}/...`, jamais na raiz.
3. WHEN o Firestore avalia leitura de `empresas/{empresaId}` THEN so permite se existir `empresas/{empresaId}/membros/{userId}` com `ativo: true`.
4. WHEN o papel e `administrador` THEN pode: gerenciar empresa, membros, setores, ver todos os contatos e conversas, acessar configuracoes e relatorios, gerenciar etapas do funil.
5. WHEN o papel e `supervisor` THEN pode: ver todas as conversas, transferir atendimentos, gerenciar filas, ver contatos e negocios, acessar relatorios operacionais, mas nao pode gerenciar membros nem configuracoes.
6. WHEN o papel e `atendente` THEN pode: ver conversas atribuidas ou do seu setor, assumir/responder/finalizar atendimentos, cadastrar e editar contatos e negocios, usar respostas rapidas, mas nao acessa configuracoes nem relatorios.
7. WHEN rota protegida por permissao e acessada por papel insuficiente THEN exibe "Voce nao tem permissao para acessar esta area." e redireciona para `/`.
8. WHEN `usePermissao()` e consultado THEN expoe: `podeGerenciarUsuarios()`, `podeVisualizarRelatorios()`, `podeTransferirConversa()`, `podeGerenciarEmpresa()`, `podeGerenciarConfiguracoes()`.
9. WHEN o Firestore avalia escrita em `empresas/{id}/membros` THEN so permite papel `administrador`.
10. WHEN o Firestore avalia escrita em `empresas/{id}/configuracoes` THEN so permite papel `administrador`.

---

### Requirement 4: Setores e Membros da Equipe

**User Story:** Como administrador, quero gerenciar setores de atendimento e os membros da equipe, para organizar quem atende o que.

#### Acceptance Criteria

1. WHEN o administrador acessa Configuracoes, secao Setores THEN ve lista de setores com nome, descricao e status.
2. WHEN um setor e criado THEN e salvo em `empresas/{empresaId}/setores/{setorId}` com `ativo: true`.
3. WHEN um setor e inativado THEN `ativo` e atualizado para `false` sem exclusao definitiva.
4. WHEN o administrador acessa Configuracoes, secao Equipe THEN ve lista de membros com nome, email, papel e status.
5. WHEN um membro e convidado THEN documento e criado em `empresas/{empresaId}/membros/{usuarioId}`.
6. WHEN o papel de um membro e alterado THEN apenas o campo `papel` e atualizado no Firestore.
7. WHEN um membro e inativado THEN `ativo: false` e gravado e o membro nao consegue mais acessar o sistema.
8. WHEN um membro tem `setorIds` preenchido THEN pode ser filtrado por setor na central de atendimento.

---

### Requirement 5: Modulo de Contatos

**User Story:** Como atendente ou administrador, quero gerenciar uma base de contatos centralizada, para ter historico e poder criar negocios e conversas a partir deles.

#### Acceptance Criteria

1. WHEN o usuario acessa `/contatos` THEN ve lista paginada de 20 contatos por pagina, ordenados por nome, com busca por nome e telefone.
2. WHEN a busca e aplicada THEN filtra com debounce de 300ms.
3. WHEN o usuario chega ao fim da lista e ha mais contatos THEN botao "Carregar mais" usa `startAfter(ultimoDoc)` para proxima pagina.
4. WHEN o usuario cadastra contato THEN campos obrigatorios sao `nome` e `telefone`; opcionais: `email`, `empresa`, `observacoes`, `etiquetaIds`, `origem`, `responsavelId`.
5. WHEN contato e salvo THEN `ativo: true`, `criadoEm: serverTimestamp()`, `atualizadoEm: serverTimestamp()` sao gravados automaticamente.
6. WHEN contato e editado THEN apenas campos alterados e `atualizadoEm` sao atualizados.
7. WHEN usuario clica em Inativar contato THEN modal de confirmacao e exibido antes de atualizar `ativo: false`.
8. WHEN filtro por etiqueta e aplicado THEN apenas contatos com aquela etiqueta aparecem.
9. WHEN usuario clica em Novo negocio em um contato THEN modal de negocio abre pre-preenchido com `contatoId` e `contatoNome`.
10. WHEN usuario clica em Nova conversa em um contato THEN conversa simulada e criada com `origem: "simulacao"` e usuario e redirecionado para `/atendimento`.
11. WHEN lista de contatos esta vazia THEN exibe: "Nenhum contato encontrado. Cadastre seu primeiro contato para comecar a organizar seus atendimentos." com botao Cadastrar contato.
12. WHEN contato esta inativo THEN aparece com indicacao visual de inativo e nao aparece em buscas de novas conversas.

---

### Requirement 6: Etiquetas

**User Story:** Como usuario, quero criar etiquetas coloridas para categorizar contatos e conversas, facilitando organizacao e filtragem.

#### Acceptance Criteria

1. WHEN o administrador acessa Configuracoes, secao Etiquetas THEN ve lista de etiquetas com nome e cor.
2. WHEN etiqueta e criada THEN salva em `empresas/{empresaId}/etiquetas/{etiquetaId}` com nome e cor obrigatorios.
3. WHEN etiqueta e removida THEN modal de confirmacao e exibido antes da exclusao.
4. WHEN etiquetas sao listadas em filtros THEN vem da subcollection da empresa logada.
5. WHEN etiqueta e atribuida a contato THEN array `etiquetaIds` do contato e atualizado.

---

### Requirement 7: Modulo CRM Funil Kanban

**User Story:** Como atendente ou supervisor, quero gerenciar negocios em um quadro Kanban com etapas configuaveis, para visualizar e avancar o funil de vendas.

#### Acceptance Criteria

1. WHEN o usuario acessa `/crm` THEN ve colunas Kanban baseadas em `empresas/{empresaId}/etapasFunil`, ordenadas por `ordem`.
2. WHEN negocio e movido entre colunas THEN apenas `etapaId` e `atualizadoEm` sao atualizados no Firestore.
3. WHEN negocio e criado THEN campos obrigatorios sao: `titulo`, `contatoId`, `contatoNome`, `etapaId`, `prioridade`.
4. WHEN negocio e marcado como Ganho THEN `status` muda para `"ganho"` com indicacao visual no card.
5. WHEN negocio e marcado como Perdido THEN `status` muda para `"perdido"` com modal de confirmacao.
6. WHEN filtros do CRM sao usados THEN usuario pode filtrar por: atendente, prioridade, status, origem e pesquisar por titulo ou nome do contato.
7. WHEN coluna esta vazia THEN exibe "Nenhum negocio nesta etapa" com botao adicionar.
8. WHEN administrador acessa Configuracoes, secao Etapas do Funil THEN pode criar, renomear, reordenar e desativar etapas.
9. WHEN etapa e desativada THEN negocios existentes permanecem, mas etapa nao aparece para novos negocios.
10. WHEN cabecalho da coluna e exibido THEN mostra: nome, quantidade de negocios e soma dos valores.

---

### Requirement 8: Central de Atendimento Conversas Simuladas

**User Story:** Como atendente, quero uma central de conversas com lista a esquerda e chat no centro, para atender clientes em tempo real via Firestore simulado.

#### Acceptance Criteria

1. WHEN o usuario acessa `/atendimento` THEN ve: lista de conversas a esquerda, area de chat central, painel de informacoes do contato a direita colapsavel.
2. WHEN a pagina e montada THEN listener e aberto para `empresas/{empresaId}/conversas`, filtrado por permissao.
3. WHEN usuario seleciona conversa THEN listener anterior de mensagens e cancelado e novo e aberto para `empresas/{empresaId}/conversas/{conversaId}/mensagens` ordenado por `enviadaEm`.
4. WHEN usuario navega para fora de `/atendimento` THEN ambos os listeners sao cancelados.
5. WHEN usuario envia mensagem THEN salva com `direcao: "saida"`, `tipo: "texto"`, `status: "enviada"` e atualiza `ultimaMensagem` e `ultimaMensagemEm` na conversa.
6. WHEN Simular resposta e acionado THEN mensagem com `direcao: "entrada"` e criada apos 1 a 3 segundos de delay.
7. WHEN atendente assume conversa com status `"aguardando"` THEN `status` muda para `"em_atendimento"`, `atendenteId` e preenchido e mensagem de sistema e registrada.
8. WHEN atendente finaliza conversa THEN `status` muda para `"finalizada"` com modal de confirmacao e mensagem de sistema.
9. WHEN atendente reabre conversa finalizada THEN `status` muda para `"aguardando"`.
10. WHEN atendente transfere conversa THEN pode transferir para atendente especifico ou setor, atualizando `atendenteId` ou `setorId`.
11. WHEN etiqueta e adicionada ou removida da conversa THEN `etiquetaIds` da conversa e atualizado.
12. WHEN lista de conversas e filtrada THEN usuario pode filtrar por: status, setor, atendente, etiqueta.
13. WHEN conversa tem mensagens nao lidas THEN `mensagensNaoLidas` e exibido como badge na lista.
14. WHEN usuario seleciona conversa com mensagens nao lidas THEN `mensagensNaoLidas` e zerado.
15. WHEN lista de conversas esta vazia para filtro aplicado THEN exibe estado vazio com icone e texto descritivo.
16. WHEN painel direito esta visivel THEN exibe: nome, telefone, empresa e etiquetas do contato, com botoes Ver contato e Criar negocio.

---

### Requirement 9: Respostas Rapidas

**User Story:** Como atendente, quero criar respostas rapidas com atalhos para usar durante o atendimento, agilizando respostas repetitivas.

#### Acceptance Criteria

1. WHEN usuario acessa `/respostas-rapidas` THEN ve lista com titulo, atalho, mensagem e status de cada resposta.
2. WHEN resposta rapida e criada THEN campos obrigatorios sao: `titulo`, `atalho` (deve comecar com `/`), `mensagem`; opcional: `setorId`.
3. WHEN atalho duplicado e inserido THEN formulario exibe erro antes de salvar.
4. WHEN usuario digita `/` na area de mensagem do chat THEN lista de sugestoes de respostas rapidas e exibida acima do input.
5. WHEN usuario seleciona resposta rapida no chat THEN texto preenche o campo de input.
6. WHEN busca e aplicada na lista THEN filtra por titulo ou atalho.
7. WHEN resposta rapida e inativada THEN nao aparece mais nas sugestoes do chat.

---

### Requirement 10: Dashboard

**User Story:** Como administrador ou supervisor, quero ver metricas consolidadas no dashboard, para acompanhar a operacao e o funil de vendas.

#### Acceptance Criteria

1. WHEN dashboard e carregado THEN le `empresas/{empresaId}/metricas/principal` como fonte primaria de KPIs.
2. WHEN documento de metricas nao existe THEN dashboard faz queries diretas, calcula valores e cria o documento.
3. WHEN negocio e criado, atualizado ou movido THEN documento de metricas e atualizado atomicamente com incrementos via `updateDoc`.
4. WHEN dashboard exibe KPIs THEN mostra: contatos ativos, negocios abertos, valor total abertos, negocios ganhos, negocios perdidos, conversas aguardando, conversas em atendimento, conversas finalizadas, atendentes ativos.
5. WHEN dashboard exibe graficos THEN mostra: negocios por etapa em barras, conversas por status em pizza, tendencia de conversas em area dos ultimos 7 dias.
6. WHEN dashboard exibe listas recentes THEN mostra: ultimos 5 contatos cadastrados, ultimos 5 negocios criados.
7. WHEN dados estao carregando THEN skeletons sao exibidos nos cards e listas.
8. WHEN ocorre erro ao carregar metricas THEN exibe mensagem de erro com botao Tentar novamente.

---

### Requirement 11: Configuracoes da Empresa

**User Story:** Como administrador, quero gerenciar todas as configuracoes da empresa em uma area centralizada, incluindo dados cadastrais, mensagens automaticas e preferencias.

#### Acceptance Criteria

1. WHEN administrador acessa `/configuracoes` THEN ve abas: Empresa, Equipe, Setores, Etapas do Funil, Etiquetas, Respostas Rapidas.
2. WHEN dados da empresa sao salvos THEN `empresas/{empresaId}` e atualizado com nome, documento, telefone, email e `atualizadoEm`.
3. WHEN configuracoes principais sao salvas THEN `empresas/{empresaId}/configuracoes/principal` e atualizado com: `horarioAtendimento`, `mensagemBoasVindas`, `mensagemAusencia`, `mensagemEncerramento`, `preferenciasCRM`.
4. WHEN membro e convidado via aba Equipe THEN fluxo verifica se e-mail ja tem conta Firebase e cria membro com papel selecionado.
5. WHEN etapas do funil sao reordenadas THEN campo `ordem` de cada etapa e atualizado.
6. WHEN usuario sem papel `administrador` acessa `/configuracoes` THEN e redirecionado para `/` com mensagem de permissao negada.

---

### Requirement 12: Relatorios

**User Story:** Como administrador ou supervisor, quero ver relatorios operacionais basicos, para monitorar o desempenho da equipe.

#### Acceptance Criteria

1. WHEN usuario acessa `/relatorios` THEN ve metricas de: total de conversas por periodo, conversas por atendente, negocios por responsavel, taxa de conversao por etapa.
2. WHEN atendente acessa `/relatorios` THEN e redirecionado para `/` com mensagem de permissao negada.
3. WHEN dados de relatorio estao carregando THEN skeletons sao exibidos.
4. WHEN nao ha dados para periodo selecionado THEN exibe estado vazio com texto explicativo.

---

### Requirement 13: Estados de UI e Qualidade

**User Story:** Como usuario, quero que todas as telas tenham feedback visual adequado durante carregamento, erros e acoes, para nao ficar confuso sobre o estado do sistema.

#### Acceptance Criteria

1. WHEN qualquer operacao assincrona esta em andamento THEN botao fica desabilitado com spinner para prevenir envio duplicado.
2. WHEN tela esta carregando dados THEN skeletons sao exibidos no lugar do conteudo.
3. WHEN ocorre erro em operacao THEN toast de erro e exibido com mensagem em portugues.
4. WHEN operacao e concluida com sucesso THEN toast de sucesso e exibido.
5. WHEN acao destrutiva e solicitada THEN modal de confirmacao e exibido antes de executar.
6. WHEN lista esta vazia THEN exibe: icone tematico, titulo descritivo, subtitulo com orientacao, e CTA quando aplicavel.
7. WHEN formulario e submetido com campos invalidos THEN mensagens de erro aparecem abaixo dos campos sem recarregar a pagina.

---

### Requirement 14: Arquitetura e Qualidade de Codigo

**User Story:** Como desenvolvedor, quero uma arquitetura bem organizada com separacao clara de responsabilidades, para facilitar manutencao e extensao futura.

#### Acceptance Criteria

1. WHEN pagina precisa de dados THEN usa hook customizado como `useContatos`, nunca acessa Firestore diretamente.
2. WHEN hook precisa de dados THEN chama service como `contatoService`, nunca acessa Firestore diretamente.
3. WHEN service e criado THEN nao importa componentes React, nao exibe toasts ou alertas.
4. WHEN codigo TypeScript e compilado THEN nao deve haver erros de tipo nem uso de `any` sem justificativa.
5. WHEN lint e executado THEN nao deve haver erros.
6. WHEN estrutura de pastas e organizada THEN segue: `src/services/firebase/`, `src/services/auth/`, `src/services/empresas/`, `src/services/contatos/`, `src/services/crm/`, `src/services/atendimento/`, `src/hooks/`, `src/features/`, `src/types/`.
7. WHEN integracao WhatsApp for implementada THEN estrutura de `Conversa` e `Mensagem` ja suporta `whatsappMessageId` e `origem: "whatsapp"` sem migration.
8. WHEN menu lateral e renderizado THEN itens sao: Dashboard em `/`, Atendimento em `/atendimento`, Contatos em `/contatos`, CRM em `/crm`, Respostas Rapidas em `/respostas-rapidas`, Relatorios em `/relatorios`, Equipe em `/equipe`, Configuracoes em `/configuracoes`.
9. WHEN design visual e avaliado THEN template original deve ser preservado: cores violeta e azul, tipografia, espacamentos, tema dark e light, componentes UI existentes, responsividade mobile.
10. WHEN variaveis e funcoes sao nomeadas THEN entidades de dominio usam portugues (contato, conversa, negocio) e padroes tecnicos usam ingles (hook, service, context, provider).
