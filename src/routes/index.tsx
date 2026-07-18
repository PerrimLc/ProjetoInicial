import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Conversations } from '@/pages/Conversations'
import { Atendimento } from '@/pages/Atendimento'
import { Leads } from '@/pages/Leads'
import { Agents } from '@/pages/Agents'
import { Flows } from '@/pages/Flows'
import { CRM } from '@/pages/CRM'
import { Contatos } from '@/pages/Contatos'
import { AgendaNew } from '@/pages/AgendaNew'
import { Knowledge } from '@/pages/Knowledge'
import { Analytics } from '@/pages/Analytics'
import { Relatorios } from '@/pages/Relatorios'
import { Equipe } from '@/pages/Equipe'
import { Settings } from '@/pages/Settings'
import { Configuracoes } from '@/pages/Configuracoes'
import { RespostasRapidas } from '@/pages/RespostasRapidas'
import { Profile } from '@/pages/Profile'
import { Login } from '@/pages/Login'
import { Onboarding } from '@/pages/Onboarding'
import { LoadingPage } from '@/components/common/LoadingPage'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'
import type { PapelUsuario } from '@/types'

// Protected route: requires authentication and empresa set up
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return <LoadingPage />
  if (!usuario) return <Navigate to="/login" replace />
  if (!usuario.empresaAtualId) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

// Public route: redirects authenticated users away from login
function PublicRoute({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return <LoadingPage />
  if (usuario) {
    if (!usuario.empresaAtualId) return <Navigate to="/onboarding" replace />
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

// Onboarding route: authenticated but no empresa
function OnboardingRoute({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return <LoadingPage />
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.empresaAtualId) return <Navigate to="/" replace />
  return <>{children}</>
}

// Permission route: requires specific roles
function PermissionRoute({
  children,
  papeis,
}: {
  children: ReactNode
  papeis: PapelUsuario[]
}) {
  const { membro, carregando } = useAuth()

  if (carregando) return <LoadingPage />

  if (!membro || !papeis.includes(membro.papel)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <OnboardingRoute>
        <Onboarding />
      </OnboardingRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      // Legacy routes (keep working during migration)
      { path: 'conversations', element: <Conversations /> },
      { path: 'leads', element: <Leads /> },
      { path: 'agents', element: <Agents /> },
      { path: 'flows', element: <Flows /> },
      { path: 'crm', element: <CRM /> },
      { path: 'agenda', element: <AgendaNew /> },
      { path: 'knowledge', element: <Knowledge /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'profile', element: <Profile /> },
      // New routes
      { path: 'atendimento', element: <Atendimento /> },
      { path: 'contatos', element: <Contatos /> },
      { path: 'respostas-rapidas', element: <RespostasRapidas /> },
      { path: 'relatorios', element: <Relatorios /> },
      {
        path: 'equipe',
        element: (
          <PermissionRoute papeis={['administrador', 'supervisor']}>
            <Equipe />
          </PermissionRoute>
        ),
      },
      {
        path: 'configuracoes',
        element: <Configuracoes />,
      },
      // Keep /settings working too
      { path: 'settings', element: <Settings /> },
    ],
  },
])
