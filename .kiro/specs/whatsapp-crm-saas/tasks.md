# Implementation Plan: SaaS de Atendimento e CRM via WhatsApp

## Overview

Implementação em 14 tarefas sequenciais, transformando o template frontend React/TypeScript/Vite em um SaaS multiempresa com Firebase Authentication, Cloud Firestore, módulos de Contatos, CRM Kanban, Central de Atendimento, Dashboard e Configurações. O design visual existente é preservado integralmente.

## Tasks

- [x] 1. Instalar dependências e configurar Firebase base
  - Instalar pacotes: `firebase@10.12.0`, `react-hook-form@7.52.0`, `zod@3.23.0`, `@hookform/resolvers@3.6.0`
  - Criar `.env` com as credenciais Firebase do projeto `beta-agenteia`
  - Criar `.env.example` com as variáveis sem valores
  - Criar `src/services/firebase/firebase.ts` exportando `app`, `auth`, `db`
  - Criar `src/services/firebase/converters.ts` com função `converterTimestamps`
  - Reescrever `src/types/index.ts` mantendo os tipos existentes do template e adicionando as novas interfaces: `Usuario`, `Empresa`, `MembroEmpresa`, `Setor`, `Contato`, `Etiqueta`, `EtapaFunil`, `Negocio`, `Conversa`, `Mensagem`, `RespostaRapida`, `MetricasPrincipal` e todos os tipos auxiliares
  - Criar `src/utils/errors.ts` com função `traduzirErroFirebase`
  - Criar `firestore.rules` na raiz do projeto
  - Criar `firestore.indexes.json` na raiz do projeto
  - Verificar que o projeto compila sem erros (`tsc --noEmit`)
  - **Requirements**: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9

- [x] 2. Implementar serviços Firebase
  - Criar `src/services/auth/authService.ts` com: `loginComEmail`, `cadastrarComEmail`, `logout`, `recuperarSenha`, `onAuthChange`
  - Criar `src/services/empresas/empresaService.ts` com: `criarEmpresa`, `buscarEmpresa`, `atualizarEmpresa`, `buscarConfiguracoes`, `salvarConfiguracoes`
  - Criar `src/services/empresas/membroService.ts` com: `buscarMembro`, `listarMembros`, `criarMembro`, `atualizarPapel`, `inativarMembro`
  - Criar `src/services/empresas/setorService.ts` com: `listarSetores`, `criarSetor`, `atualizarSetor`, `inativarSetor`
  - Criar `src/services/contatos/contatoService.ts` com: `listarContatos` (paginado com `orderBy('nome'), limit(20), startAfter`), `buscarContato`, `criarContato`, `atualizarContato`, `inativarContato`
  - Criar `src/services/contatos/etiquetaService.ts` com: `listarEtiquetas`, `criarEtiqueta`, `excluirEtiqueta`
  - Criar `src/services/crm/etapaFunilService.ts` com: `listarEtapas`, `criarEtapa`, `atualizarEtapa`, `reordenarEtapas`, `desativarEtapa`, `criarEtapasPadrao`
  - Criar `src/services/crm/negocioService.ts` com: `listarNegocios`, `criarNegocio`, `atualizarNegocio`, `moverNegocio` (atualiza apenas `etapaId` + `atualizadoEm`), `marcarGanho`, `marcarPerdido`
  - Criar `src/services/atendimento/conversaService.ts` com: `criarConversa`, `atualizarConversa`, `assumirAtendimento`, `finalizarAtendimento`, `reabrirAtendimento`, `transferirConversa`, `zerarNaoLidas`, `escutarConversas`
  - Criar `src/services/atendimento/mensagemService.ts` com: `enviarMensagem`, `simularResposta`, `escutarMensagens`
  - Criar `src/services/atendimento/respostaRapidaService.ts` com: `listarRespostasRapidas`, `criarRespostaRapida`, `atualizarRespostaRapida`
  - Criar `src/services/dashboard/dashboardService.ts` com: `buscarMetricas`, `inicializarMetricas`, `incrementarMetrica`
  - **Requirements**: 1.5, 1.6, 1.7, 5.3, 7.2, 8.5, 8.6

- [x] 3. Implementar AuthContext e autenticação
  - Criar `src/contexts/AuthContext.tsx` com `AuthProvider` e hook `useAuth` expondo `usuario`, `empresa`, `membro`, `carregando`, `login`, `cadastrar`, `logout`, `recuperarSenha`
  - Criar `src/contexts/ThemeContext.tsx` extraindo a lógica de tema (dark/light) do AppContext existente
  - Atualizar `src/App.tsx` para usar `AuthProvider` e `ThemeContext` no lugar do `AppProvider`
  - Criar `src/hooks/useAuth.ts` (re-export do contexto com validação)
  - Criar `src/hooks/usePermissao.ts` expondo: `podeGerenciarUsuarios`, `podeVisualizarRelatorios`, `podeTransferirConversa`, `podeGerenciarEmpresa`, `podeGerenciarConfiguracoes`
  - Atualizar `src/pages/Login.tsx` para usar Firebase Auth: login real, cadastro com fluxo de onboarding (criar empresa + etapas padrão), recuperação de senha, erros em português
  - Criar `src/pages/Onboarding.tsx` para casos em que o usuário está autenticado mas sem empresa vinculada
  - Atualizar `src/routes/index.tsx` com novas rotas, `ProtectedRoute` usando `AuthContext`, e `PermissionRoute` para rotas restritas por papel
  - Criar `src/components/common/LoadingPage.tsx` para estado de carregamento inicial da sessão
  - **Requirements**: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 3.7, 3.8

- [x] 4. Implementar hooks de dados
  - Criar `src/hooks/useEmpresa.ts` carregando empresa atual do contexto com reload
  - Criar `src/hooks/useMembros.ts` listando membros com loading/error e funções de convite/inativação
  - Criar `src/hooks/useSetores.ts` listando setores com CRUD
  - Criar `src/hooks/useEtiquetas.ts` listando etiquetas com CRUD
  - Criar `src/hooks/useContatos.ts` com lista paginada 20/página, busca, CRUD e paginação via startAfter
  - Criar `src/hooks/useEtapasFunil.ts` listando etapas ordenadas por `ordem` com CRUD e reordenação
  - Criar `src/hooks/useNegocios.ts` com lista por etapa, filtros, CRUD, mover, ganho/perdido
  - Criar `src/hooks/useConversas.ts` com listener em tempo real, filtros e ações de atendimento
  - Criar `src/hooks/useMensagens.ts` com listener de mensagens da conversa selecionada com cleanup correto
  - Criar `src/hooks/useRespostasRapidas.ts` com lista, busca, CRUD e ativar/inativar
  - Criar `src/hooks/useDashboard.ts` carregando métricas e inicializando documento se não existir
  - **Requirements**: 5.1, 5.3, 7.1, 8.2, 8.3, 8.4, 9.6, 10.1, 10.2

- [x] 5. Adaptar layout e navegação
  - Atualizar `src/components/layout/Sidebar.tsx` com novos itens de menu (Atendimento, Contatos, CRM, Respostas Rápidas, Relatórios, Equipe, Configurações) usando `useAuth` e `usePermissao` para exibição condicional
  - Atualizar `src/components/layout/MainLayout.tsx` com os novos títulos de página
  - Atualizar `src/components/layout/TopBar.tsx` para usar dados reais do `AuthContext`
  - Criar `src/components/common/EmptyState.tsx` com props: `icon`, `titulo`, `descricao`, `acao`
  - Criar `src/components/common/PermissionGuard.tsx` que redireciona ou oculta conteúdo por papel
  - **Requirements**: 3.7, 13.1, 14.8

- [x] 6. Implementar módulo de Contatos
  - Criar `src/pages/Contatos.tsx` adaptando `Leads.tsx` existente: lista paginada, busca por nome/telefone, badge de etiquetas, indicação de inativo
  - Criar `src/features/contatos/ContatoForm.tsx` com react-hook-form + zod: campos nome*, telefone*, email, empresa, observacoes, origem, etiquetas, responsável
  - Criar `src/features/contatos/ContatoCard.tsx` com ações: editar, inativar (com confirmação), novo negócio, nova conversa
  - Integrar `useContatos` na página com loading (Skeleton), estado vazio (EmptyState) e paginação ("Carregar mais")
  - Garantir que "Novo negócio" abre modal pré-preenchido e "Nova conversa" cria conversa e redireciona para `/atendimento`
  - **Requirements**: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12

- [x] 7. Implementar módulo CRM (Kanban)
  - Criar `src/pages/CRM.tsx` adaptando o existente para usar etapas dinâmicas via `useEtapasFunil` e `useNegocios`
  - Criar `src/features/crm/NegocioForm.tsx` com react-hook-form + zod: campos titulo*, contatoId*, etapaId*, prioridade*, valor, responsavelId, origem, observacoes
  - Criar `src/features/crm/NegocioCard.tsx` com menu de ações: editar, mover, marcar ganho, marcar perdido (com confirmação), excluir
  - Implementar drag-and-drop chamando `moverNegocio` (atualiza apenas `etapaId` + `atualizadoEm`)
  - Implementar filtros por responsável, prioridade, status, origem e busca por título/contato
  - Exibir no cabeçalho de cada coluna: nome, contador de negócios e soma dos valores
  - Exibir EmptyState em colunas vazias com botão "+ Adicionar"
  - **Requirements**: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10

- [x] 8. Implementar Central de Atendimento
  - Criar `src/pages/Atendimento.tsx` adaptando `Conversations.tsx` para usar Firestore via `useConversas` e `useMensagens`
  - Implementar lista de conversas com busca, filtros (status/setor/atendente/etiqueta), badge de não lidas e listener em tempo real
  - Implementar área de chat com histórico, input com suporte a respostas rápidas (digitar `/` exibe sugestões), botão enviar
  - Implementar painel direito colapsável com dados do contato, etiquetas e botões "Ver contato" e "Criar negócio"
  - Implementar ações do header: assumir, transferir (atendente/setor), finalizar (com confirmação), reabrir, adicionar/remover etiqueta
  - Garantir cancelamento correto dos listeners ao trocar de conversa e ao sair da página
  - Implementar botão "Simular resposta" que cria mensagem de entrada após delay de 1-3s
  - Ao selecionar conversa com mensagens não lidas, zerar `mensagensNaoLidas`
  - **Requirements**: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 8.13, 8.14, 8.15, 8.16

- [x] 9. Implementar Respostas Rápidas
  - Criar `src/pages/RespostasRapidas.tsx` com lista, busca por título/atalho, toggle ativo/inativo
  - Criar `src/features/atendimento/RespostaRapidaForm.tsx` com validação: atalho começa com `/`, título e mensagem obrigatórios, verificar atalho duplicado
  - Integrar sugestões de respostas rápidas no chat da página Atendimento: digitar `/` exibe dropdown; seleção preenche o input
  - **Requirements**: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7

- [x] 10. Implementar Dashboard
  - Criar `src/pages/Dashboard.tsx` adaptando o existente para usar `useDashboard`: KPI cards com dados reais, gráfico negócios por etapa (barras), conversas por status (pizza), tendência (área)
  - Implementar estados de loading com Skeleton nos cards e listas
  - Implementar estado de erro com botão "Tentar novamente"
  - Exibir listas recentes: últimos 5 contatos e últimos 5 negócios com links
  - Garantir que `metricas/principal` é criado automaticamente se não existir na primeira carga
  - **Requirements**: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8

- [x] 11. Implementar Configurações
  - Criar `src/pages/Configuracoes.tsx` adaptando `Settings.tsx` com abas: Empresa, Equipe, Setores, Etapas do Funil, Etiquetas, Respostas Rápidas
  - Criar `src/features/configuracoes/AbaEmpresa.tsx` com formulário de dados cadastrais e mensagens automáticas
  - Criar `src/features/configuracoes/AbaEquipe.tsx` com lista de membros, convite por email, alteração de papel, ativação/inativação
  - Criar `src/features/configuracoes/AbaSetores.tsx` com lista, criação e inativação de setores
  - Criar `src/features/configuracoes/AbaEtapasFunil.tsx` com lista ordenável, criação, renomeação e desativação de etapas
  - Criar `src/features/configuracoes/AbaEtiquetas.tsx` com lista, criação (nome + cor) e exclusão com confirmação
  - Proteger rota `/configuracoes` redirecionando quem não é `administrador`
  - **Requirements**: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8

- [x] 12. Implementar Relatórios e Equipe
  - Criar `src/pages/Relatorios.tsx` adaptando `Analytics.tsx` com métricas básicas: total de conversas por período, conversas por atendente, negócios por responsável, taxa de conversão por etapa
  - Proteger rota `/relatorios` bloqueando papel `atendente`
  - Criar `src/pages/Equipe.tsx` como visualização da equipe (lista somente leitura para supervisores)
  - **Requirements**: 12.1, 12.2, 12.3, 12.4

- [x] 13. Criar utilitários e seed de desenvolvimento
  - Criar `src/utils/seed.ts` com função `runSeed(empresaId, adminUid)` criando: 2 setores, 5 etiquetas, 10 contatos, 8 negócios distribuídos nas etapas, 5 conversas com mensagens simuladas, 4 respostas rápidas
  - Garantir que `runSeed` só roda em ambiente de desenvolvimento (`import.meta.env.DEV`)
  - **Requirements**: 1.10

- [x] 14. Revisão final, segurança e build
  - Revisar e finalizar `firestore.rules` com todas as regras de isolamento multiempresa e controle por papel
  - Revisar `firestore.indexes.json` adicionando índices identificados durante implementação
  - Verificar que o build passa sem erros: `npm run build`
  - Verificar que o lint passa sem erros: `npm run lint`
  - Verificar responsividade mobile nas páginas principais (Atendimento, Contatos, CRM, Dashboard)
  - Remover imports de dados mock das páginas migradas
  - Garantir que o `AppContext` original não é mais usado nas páginas migradas
  - Verificar no console que não há warnings importantes nem erros de tipo em runtime
  - **Requirements**: 3.9, 3.10, 13.1, 13.2, 13.3, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3"] },
    { "wave": 4, "tasks": ["4"] },
    { "wave": 5, "tasks": ["5"] },
    { "wave": 6, "tasks": ["6", "7", "10", "13"] },
    { "wave": 7, "tasks": ["8", "11", "12"] },
    { "wave": 8, "tasks": ["9"] },
    { "wave": 9, "tasks": ["14"] }
  ]
}
```

## Notes

- O design visual existente deve ser preservado 100% — cores violeta/azul, tipografia, componentes UI, responsividade
- Todas as datas são gravadas com `serverTimestamp()` e convertidas para `Date` nos services
- Listeners em tempo real apenas para: lista de conversas e mensagens da conversa ativa
- O `AppContext` original pode ser mantido funcionando em paralelo durante a migração para evitar quebras
- Firebase SDK credenciais já configuradas no projeto `beta-agenteia`
