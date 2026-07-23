# Design Document — SaaS de Atendimento e CRM via WhatsApp

## Overview

Transformação do template frontend React/TypeScript/Vite em um SaaS multiempresa de atendimento e CRM. A arquitetura substitui o AppContext baseado em localStorage por Firebase Authentication e Cloud Firestore, preservando 100% do design visual existente.

O sistema roda no plano gratuito Firebase Spark. Todas as operações são feitas pelo frontend sem Cloud Functions. Conversas funcionam de forma simulada via Firestore nesta versão.

## Architecture

### Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Auth**: Firebase Authentication (email/senha)
- **Database**: Cloud Firestore (plano Spark)
- **Roteamento**: React Router v6
- **UI**: Tailwind CSS + Radix UI + componentes existentes
- **Animações**: framer-motion (existente)
- **Gráficos**: recharts (existente)
- **Ícones**: lucide-react (existente)
- **Formulários**: react-hook-form + zod (a instalar)
- **Firebase SDK**: firebase v10+ (a instalar)

### Fluxo de dados

```
Página → Hook → Service → Firestore
```

Nenhuma página ou componente acessa o Firestore diretamente. Todo acesso é intermediado por hooks customizados que chamam services.

### Estrutura de pastas

```
src/
├── components/
│   ├── ui/              # Existentes — preservar sem alteração
│   ├── layout/          # Sidebar e TopBar adaptados
│   └── common/          # EmptyState, LoadingSkeleton, PermissionGuard
├── contexts/
│   └── AuthContext.tsx  # Substitui AppContext (Firebase Auth + empresa atual)
├── features/
│   ├── auth/            # Componentes do fluxo de login/cadastro
│   ├── dashboard/       # Cards de métricas, gráficos
│   ├── empresas/        # Onboarding, configurações da empresa
│   ├── usuarios/        # Lista de membros, convite, papéis
│   ├── contatos/        # Lista, formulário, etiquetas
│   ├── crm/             # Kanban, card de negócio, etapas
│   ├── atendimento/     # Lista de conversas, chat, painel contato
│   ├── configuracoes/   # Abas de configurações
│   └── relatorios/      # Gráficos e tabelas de relatório
├── hooks/
│   ├── useAuth.ts
│   ├── useEmpresa.ts
│   ├── usePermissao.ts
│   ├── useMembros.ts
│   ├── useSetores.ts
│   ├── useContatos.ts
│   ├── useEtiquetas.ts
│   ├── useNegocios.ts
│   ├── useEtapasFunil.ts
│   ├── useConversas.ts
│   ├── useMensagens.ts
│   ├── useRespostasRapidas.ts
│   └── useDashboard.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── Atendimento.tsx
│   ├── Contatos.tsx
│   ├── CRM.tsx
│   ├── RespostasRapidas.tsx
│   ├── Relatorios.tsx
│   ├── Equipe.tsx
│   ├── Configuracoes.tsx
│   ├── Login.tsx
│   └── Onboarding.tsx
├── routes/
│   └── index.tsx        # Rotas com ProtectedRoute e PermissionRoute
├── services/
│   ├── firebase/
│   │   ├── firebase.ts  # Inicialização Firebase
│   │   └── converters.ts # Timestamp → Date
│   ├── auth/
│   │   └── authService.ts
│   ├── empresas/
│   │   ├── empresaService.ts
│   │   ├── setorService.ts
│   │   └── membroService.ts
│   ├── contatos/
│   │   ├── contatoService.ts
│   │   └── etiquetaService.ts
│   ├── crm/
│   │   ├── negocioService.ts
│   │   └── etapaFunilService.ts
│   └── atendimento/
│       ├── conversaService.ts
│       ├── mensagemService.ts
│       └── respostaRapidaService.ts
├── types/
│   └── index.ts         # Todas as interfaces do domínio
└── utils/
    ├── errors.ts        # Tradução de erros Firebase
    ├── formatters.ts    # Funções de formatação existentes
    └── seed.ts          # Dados de desenvolvimento
```

## Components and Interfaces

### Modelo de dados TypeScript

```typescript
// Papéis de usuário
export type PapelUsuario = 'administrador' | 'supervisor' | 'atendente'

// Entidade: Usuário (coleção raiz)
export interface Usuario {
  id: string
  nome: string
  email: string
  fotoUrl?: string
  empresaAtualId?: string
  criadoEm: Date
  ultimoAcessoEm?: Date
}

// Entidade: Empresa
export interface Empresa {
  id: string
  nome: string
  documento?: string
  telefone?: string
  email?: string
  ativa: boolean
  criadaPor: string
  criadoEm: Date
  atualizadoEm: Date
}

// Entidade: Membro da empresa
export interface MembroEmpresa {
  usuarioId: string
  nome: string
  email: string
  papel: PapelUsuario
  setorIds: string[]
  ativo: boolean
  criadoEm: Date
}

// Entidade: Setor
export interface Setor {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  criadoEm: Date
}

// Entidade: Contato
export interface Contato {
  id: string
  nome: string
  telefone: string
  email?: string
  empresa?: string
  observacoes?: string
  etiquetaIds: string[]
  origem?: string
  responsavelId?: string
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}

// Entidade: Etiqueta
export interface Etiqueta {
  id: string
  nome: string
  cor: string
  criadoEm: Date
}

// Entidade: Etapa do funil
export interface EtapaFunil {
  id: string
  nome: string
  ordem: number
  ativo: boolean
  criadoEm: Date
}

// Tipos auxiliares CRM
export type PrioridadeNegocio = 'baixa' | 'media' | 'alta'
export type StatusNegocio = 'aberto' | 'ganho' | 'perdido'

// Entidade: Negócio
export interface Negocio {
  id: string
  titulo: string
  contatoId: string
  contatoNome: string
  etapaId: string
  responsavelId?: string
  valor?: number
  prioridade: PrioridadeNegocio
  status: StatusNegocio
  origem?: string
  observacoes?: string
  criadoEm: Date
  atualizadoEm: Date
}

// Tipos auxiliares atendimento
export type StatusConversa = 'aguardando' | 'em_atendimento' | 'finalizada'
export type DirecaoMensagem = 'entrada' | 'saida'
export type StatusMensagem = 'enviando' | 'enviada' | 'entregue' | 'lida' | 'erro'

// Entidade: Conversa
export interface Conversa {
  id: string
  contatoId: string
  contatoNome: string
  telefone: string
  atendenteId?: string
  setorId?: string
  status: StatusConversa
  ultimaMensagem: string
  ultimaMensagemEm: Date
  mensagensNaoLidas: number
  etiquetaIds: string[]
  origem: 'simulacao' | 'whatsapp'
  criadoEm: Date
  atualizadoEm: Date
}

// Entidade: Mensagem
export interface Mensagem {
  id: string
  conversaId: string
  texto: string
  tipo: 'texto' | 'sistema'
  direcao: DirecaoMensagem
  remetenteId?: string
  status: StatusMensagem
  enviadaEm: Date
  whatsappMessageId?: string
}

// Entidade: Resposta rápida
export interface RespostaRapida {
  id: string
  titulo: string
  atalho: string
  mensagem: string
  setorId?: string
  ativa: boolean
  criadoEm: Date
  atualizadoEm: Date
}

// Documento de métricas
export interface MetricasPrincipal {
  contatosAtivos: number
  negociosAbertos: number
  valorTotalAbertos: number
  negociosGanhos: number
  negociosPerdidos: number
  conversasAguardando: number
  conversasEmAtendimento: number
  conversasFinalizadas: number
  atendentesAtivos: number
  atualizadoEm: Date
}
```

### AuthContext

Substitui completamente o AppContext atual. Responsável por:
- Estado da sessão Firebase Auth
- Carregamento do usuário, empresa e membro atual
- Funções de autenticação

```typescript
interface AuthContextValue {
  usuario: Usuario | null
  empresa: Empresa | null
  membro: MembroEmpresa | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  cadastrar: (dados: CadastroData) => Promise<void>
  logout: () => Promise<void>
  recuperarSenha: (email: string) => Promise<void>
}
```

O AppContext existente será mantido temporariamente apenas para o tema (dark/light). As demais funcionalidades são migradas.

### Componentes reutilizáveis novos

**EmptyState**: Estado vazio padronizado
```typescript
interface EmptyStateProps {
  icon: LucideIcon
  titulo: string
  descricao: string
  acao?: { label: string; onClick: () => void }
}
```

**PermissionGuard**: Proteção por papel
```typescript
interface PermissionGuardProps {
  papeis: PapelUsuario[]
  children: ReactNode
  fallback?: ReactNode
}
```

**LoadingPage**: Tela de carregamento com logo animado

## Data Models

### Estrutura Firestore

```
usuarios/{uid}
  - nome, email, fotoUrl, empresaAtualId, criadoEm, ultimoAcessoEm

empresas/{empresaId}
  - nome, documento, telefone, email, ativa, criadaPor, criadoEm, atualizadoEm

empresas/{empresaId}/membros/{uid}
  - usuarioId, nome, email, papel, setorIds, ativo, criadoEm

empresas/{empresaId}/setores/{setorId}
  - nome, descricao, ativo, criadoEm

empresas/{empresaId}/contatos/{contatoId}
  - nome, telefone, email, empresa, observacoes, etiquetaIds,
    origem, responsavelId, ativo, criadoEm, atualizadoEm

empresas/{empresaId}/etiquetas/{etiquetaId}
  - nome, cor, criadoEm

empresas/{empresaId}/etapasFunil/{etapaId}
  - nome, ordem, ativo, criadoEm

empresas/{empresaId}/negocios/{negocioId}
  - titulo, contatoId, contatoNome, etapaId, responsavelId,
    valor, prioridade, status, origem, observacoes, criadoEm, atualizadoEm

empresas/{empresaId}/conversas/{conversaId}
  - contatoId, contatoNome, telefone, atendenteId, setorId,
    status, ultimaMensagem, ultimaMensagemEm, mensagensNaoLidas,
    etiquetaIds, origem, criadoEm, atualizadoEm

empresas/{empresaId}/conversas/{conversaId}/mensagens/{mensagemId}
  - conversaId, texto, tipo, direcao, remetenteId,
    status, enviadaEm, whatsappMessageId

empresas/{empresaId}/respostasRapidas/{respostaId}
  - titulo, atalho, mensagem, setorId, ativa, criadoEm, atualizadoEm

empresas/{empresaId}/configuracoes/principal
  - horarioAtendimento, mensagemBoasVindas, mensagemAusencia,
    mensagemEncerramento, preferenciasCRM

empresas/{empresaId}/metricas/principal
  - contatosAtivos, negociosAbertos, valorTotalAbertos,
    negociosGanhos, negociosPerdidos, conversasAguardando,
    conversasEmAtendimento, conversasFinalizadas, atendentesAtivos, atualizadoEm
```

### Conversor Firestore → TypeScript

Todo document snapshot passa por um conversor que transforma `Timestamp` em `Date`:

```typescript
// src/services/firebase/converters.ts
import { Timestamp } from 'firebase/firestore'

export function converterTimestamps<T>(data: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    result[key] = value instanceof Timestamp ? value.toDate() : value
  }
  return result as T
}
```

## Services Design

### firebase.ts

```typescript
// src/services/firebase/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

### authService.ts

Funções: `loginComEmail`, `cadastrarComEmail`, `logout`, `recuperarSenha`, `onAuthChange`

### empresaService.ts

Funções: `criarEmpresa`, `buscarEmpresa`, `atualizarEmpresa`, `buscarConfiguracoes`, `salvarConfiguracoes`

### membroService.ts

Funções: `buscarMembro`, `listarMembros`, `criarMembro`, `atualizarPapel`, `ativarMembro`, `inativarMembro`

### setorService.ts

Funções: `listarSetores`, `criarSetor`, `atualizarSetor`, `inativarSetor`

### contatoService.ts

Funções: `listarContatos` (com paginação), `buscarContato`, `criarContato`, `atualizarContato`, `inativarContato`

Paginação: `orderBy('nome'), limit(20), startAfter(ultimoDoc)`

### etiquetaService.ts

Funções: `listarEtiquetas`, `criarEtiqueta`, `excluirEtiqueta`

### etapaFunilService.ts

Funções: `listarEtapas`, `criarEtapa`, `atualizarEtapa`, `reordenarEtapas`, `desativarEtapa`

### negocioService.ts

Funções: `listarNegocios`, `criarNegocio`, `atualizarNegocio`, `moverNegocio` (atualiza apenas `etapaId` + `atualizadoEm`), `marcarGanho`, `marcarPerdido`

### conversaService.ts

Funções: `criarConversa`, `atualizarConversa`, `assumirAtendimento`, `finalizarAtendimento`, `reabrirAtendimento`, `transferirConversa`, `zerarNaoLidas`

Listener: `escutarConversas(empresaId, callback)` → retorna `unsubscribe`

### mensagemService.ts

Funções: `enviarMensagem`, `simularResposta`

Listener: `escutarMensagens(empresaId, conversaId, callback)` → retorna `unsubscribe`

### respostaRapidaService.ts

Funções: `listarRespostasRapidas`, `criarRespostaRapida`, `atualizarRespostaRapida`, `ativar`, `inativar`

### dashboardService.ts

Funções: `buscarMetricas`, `inicializarMetricas`, `incrementarMetrica`

## Key Flows

### Fluxo de cadastro e onboarding

```
1. Usuário preenche nome, email, empresa, senha
2. createUserWithEmailAndPassword (Firebase Auth)
3. setDoc usuarios/{uid} { nome, email, criadoEm }
4. addDoc empresas/ { nome, criadaPor: uid, ativa: true }
5. setDoc empresas/{empresaId}/membros/{uid} { papel: 'administrador', ativo: true }
6. updateDoc usuarios/{uid} { empresaAtualId: empresaId }
7. batch write: 6 etapas padrão em etapasFunil/
8. Redirecionar para /
```

### Fluxo de login

```
1. signInWithEmailAndPassword
2. onAuthStateChanged dispara
3. getDoc usuarios/{uid}
4. getDoc empresas/{empresaAtualId}
5. getDoc empresas/{empresaId}/membros/{uid}
6. Se membro.ativo === false → logout + mensagem
7. AuthContext populado → rotas protegidas liberadas
```

### Fluxo de listener de conversas

```
Montar /atendimento:
  unsubscribeConversas = onSnapshot(conversas query, callback)

Selecionar conversa:
  unsubscribeMensagens?.()  ← cancela listener anterior
  unsubscribeMensagens = onSnapshot(mensagens query, callback)

Desmontar /atendimento:
  unsubscribeConversas?.()
  unsubscribeMensagens?.()
```

### Atualização de métricas

Não há Cloud Functions. O frontend atualiza `metricas/principal` via `updateDoc` com incrementos do Firestore (`increment(1)`) ao:
- Criar contato → `contatosAtivos++`
- Criar negócio → `negociosAbertos++`, `valorTotalAbertos += valor`
- Mover negócio para ganho → `negociosAbertos--`, `negociosGanhos++`
- Criar conversa → `conversasAguardando++`
- Assumir conversa → `conversasAguardando--`, `conversasEmAtendimento++`
- Finalizar conversa → `conversasEmAtendimento--`, `conversasFinalizadas++`

## Security Rules

### firestore.rules (esboço)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuários: só o próprio usuário lê/escreve
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Empresas: só membros ativos acessam
    match /empresas/{empresaId} {
      function isMembro() {
        return exists(/databases/$(database)/documents/empresas/$(empresaId)/membros/$(request.auth.uid))
          && get(/databases/$(database)/documents/empresas/$(empresaId)/membros/$(request.auth.uid)).data.ativo == true;
      }
      function getPapel() {
        return get(/databases/$(database)/documents/empresas/$(empresaId)/membros/$(request.auth.uid)).data.papel;
      }
      function isAdmin() { return getPapel() == 'administrador'; }
      function isSupervisorOuAdmin() { return getPapel() in ['administrador', 'supervisor']; }

      allow read: if request.auth != null && isMembro();
      allow write: if request.auth != null && isAdmin();

      // Membros: só admin gerencia
      match /membros/{membroId} {
        allow read: if request.auth != null && isMembro();
        allow write: if request.auth != null && isAdmin();
      }

      // Configurações: só admin
      match /configuracoes/{doc} {
        allow read: if request.auth != null && isMembro();
        allow write: if request.auth != null && isAdmin();
      }

      // Contatos, etiquetas, etapas, negócios: membros ativos
      match /contatos/{doc} {
        allow read, write: if request.auth != null && isMembro();
      }
      match /etiquetas/{doc} {
        allow read, write: if request.auth != null && isMembro();
      }
      match /etapasFunil/{doc} {
        allow read: if request.auth != null && isMembro();
        allow write: if request.auth != null && isAdmin();
      }
      match /negocios/{doc} {
        allow read, write: if request.auth != null && isMembro();
      }
      match /setores/{doc} {
        allow read: if request.auth != null && isMembro();
        allow write: if request.auth != null && isAdmin();
      }

      // Conversas: membros leem; atendentes só as próprias ou do setor
      match /conversas/{conversaId} {
        allow read: if request.auth != null && isMembro();
        allow write: if request.auth != null && isMembro();
        match /mensagens/{mensagemId} {
          allow read, write: if request.auth != null && isMembro();
        }
      }

      // Respostas rápidas
      match /respostasRapidas/{doc} {
        allow read, write: if request.auth != null && isMembro();
      }

      // Métricas: leitura livre para membros, escrita livre para membros
      match /metricas/{doc} {
        allow read, write: if request.auth != null && isMembro();
      }
    }
  }
}
```

## Indexes (firestore.indexes.json)

Índices necessários pelas queries implementadas:

```json
{
  "indexes": [
    {
      "collectionGroup": "contatos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ativo", "order": "ASCENDING" },
        { "fieldPath": "nome", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "negocios",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "etapaId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "conversas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "ultimaMensagemEm", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "mensagens",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "conversaId", "order": "ASCENDING" },
        { "fieldPath": "enviadaEm", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Environment Variables

### .env (já configurado pelo usuário — valores reais ficam apenas no .env local, nunca no repositório)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### .env.example (a criar)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Dependencies to Install

```bash
npm install firebase react-hook-form zod @hookform/resolvers
```

Versões fixas:
- `firebase@10.12.0`
- `react-hook-form@7.52.0`
- `zod@3.23.0`
- `@hookform/resolvers@3.6.0`

## Navigation (Sidebar update)

O Sidebar existente será atualizado com os novos itens de navegação:

```typescript
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: MessageSquare, label: 'Atendimento', to: '/atendimento', badge: conversasNaoLidas },
  { icon: Users, label: 'Contatos', to: '/contatos' },
  { icon: CreditCard, label: 'CRM', to: '/crm' },
  { icon: Zap, label: 'Respostas Rápidas', to: '/respostas-rapidas' },
  { icon: BarChart3, label: 'Relatórios', to: '/relatorios' },
  { icon: UserCog, label: 'Equipe', to: '/equipe' },
]
const bottomItems = [
  { icon: Settings, label: 'Configurações', to: '/configuracoes' },
]
```

O badge de "Atendimento" mostrará o total de `conversasAguardando` do documento de métricas.

## Design Preservation

O design visual existente é preservado integralmente:
- **Cores**: violeta `#8B5CF6` + azul `#3B82F6` com gradiente
- **Tema**: dark/light com toggle (mantido no ThemeContext separado)
- **Sidebar**: animação framer-motion colapsável mantida
- **Componentes UI**: Button, Card, Modal, Badge, Avatar, Input, Toast, Skeleton, Progress, ScrollArea, Separator, StatusDot — sem alteração
- **Tipografia e espaçamentos**: sem alteração
- **Responsividade**: mantida

## Error Handling

### Tradução de erros Firebase

```typescript
// src/utils/errors.ts
export function traduzirErroFirebase(code: string): string {
  const erros: Record<string, string> = {
    'auth/user-not-found': 'E-mail não cadastrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/email-already-in-use': 'Este e-mail já está em uso.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde e tente novamente.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'permission-denied': 'Você não tem permissão para realizar esta ação.',
    'not-found': 'Registro não encontrado.',
    'unavailable': 'Serviço temporariamente indisponível.',
  }
  return erros[code] ?? 'Ocorreu um erro inesperado. Tente novamente.'
}
```

### Padrão de tratamento em services

Todos os services seguem o padrão:
```typescript
try {
  // operação Firestore
} catch (error: unknown) {
  const code = (error as { code?: string }).code ?? ''
  throw new Error(traduzirErroFirebase(code))
}
```

### Padrão de tratamento em hooks

```typescript
const [erro, setErro] = useState<string | null>(null)
const [carregando, setCarregando] = useState(false)

const executar = async () => {
  setCarregando(true)
  setErro(null)
  try {
    await service.operacao()
  } catch (e) {
    setErro((e as Error).message)
  } finally {
    setCarregando(false)
  }
}
```

Erros são exibidos via toast (componente existente) ou inline nos formulários.

## Correctness Properties

### Property 1: Isolamento multiempresa
Toda query inclui `empresaId` no path. Dados de empresas diferentes nunca se misturam. Um membro de empresa A jamais lê ou escreve dados da empresa B.

**Validates: Requirements 3.2, 3.3**

### Property 2: Listeners sem vazamento de memória
O `unsubscribe` é sempre chamado no cleanup do `useEffect`. Nenhum listener permanece ativo após o componente ser desmontado.

**Validates: Requirements 8.4**

### Property 3: Métricas sem race condition
Atualizações de `metricas/principal` usam `increment()` do Firestore (operação atômica no servidor). Múltiplas operações concorrentes não corrompem os contadores.

**Validates: Requirements 10.3**

### Property 4: Paginação estável
`startAfter(ultimoDoc)` usa a referência real do último documento Firestore, não o índice do array. Inserções concorrentes não causam duplicatas ou saltos na paginação.

**Validates: Requirements 5.3**

### Property 5: Atualização parcial de negócio
Ao mover um negócio, apenas `etapaId` e `atualizadoEm` são sobrescritos via `updateDoc`. Nenhum outro campo é perdido.

**Validates: Requirements 7.2**

### Property 6: Listener único de mensagens
O unsubscribe do listener anterior é chamado antes de abrir um novo. Nunca há dois listeners de mensagens ativos simultaneamente.

**Validates: Requirements 8.3**

## Testing Strategy

Como o projeto usa Firebase Spark (sem emuladores configurados por padrão), a estratégia de teste foca em:

### Testes manuais por fase

**Fase 2 (Firebase base):**
- Verificar que `firebase.ts` inicializa sem erros no console
- Verificar que variáveis de ambiente são lidas corretamente

**Fase 3 (Autenticação):**
- Cadastro cria documentos em `usuarios/` e `empresas/`
- Login com credencial inválida exibe mensagem em português
- Rota protegida redireciona para `/login`
- Logout limpa sessão e redireciona

**Fase 4 (Empresa e permissões):**
- Membro com papel `atendente` não acessa `/configuracoes`
- Membro inativo não consegue fazer login

**Fase 5 (Contatos):**
- Paginação carrega 20 registros e "Carregar mais" busca próxima página
- Inativar contato exige confirmação e atualiza campo `ativo`

**Fase 6 (CRM):**
- Mover card atualiza apenas `etapaId` e `atualizadoEm` no Firestore
- Métricas são incrementadas/decrementadas corretamente

**Fase 7 (Atendimento):**
- Listener de conversas é cancelado ao sair da página
- Selecionar nova conversa cancela listener anterior de mensagens

**Fase 8 (Dashboard):**
- Documento `metricas/principal` é criado se não existir
- Valores refletem os dados reais do Firestore

### Seed de desenvolvimento

`src/utils/seed.ts` exporta `runSeed(empresaId, adminUid)` que cria dados de exemplo para facilitar testes manuais durante desenvolvimento. Não roda automaticamente em produção.
