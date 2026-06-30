import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Conversations } from '@/pages/Conversations'
import { Leads } from '@/pages/Leads'
import { Agents } from '@/pages/Agents'
import { Flows } from '@/pages/Flows'
import { CRM } from '@/pages/CRM'
import { Agenda } from '@/pages/Agenda'
import { Knowledge } from '@/pages/Knowledge'
import { Analytics } from '@/pages/Analytics'
import { Settings } from '@/pages/Settings'
import { Profile } from '@/pages/Profile'
import { Login } from '@/pages/Login'
import { useApp } from '@/contexts/AppContext'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useApp()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useApp()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <PublicRoute><Login /></PublicRoute>,
  },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'conversations', element: <Conversations /> },
      { path: 'leads', element: <Leads /> },
      { path: 'agents', element: <Agents /> },
      { path: 'flows', element: <Flows /> },
      { path: 'crm', element: <CRM /> },
      { path: 'agenda', element: <Agenda /> },
      { path: 'knowledge', element: <Knowledge /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'settings', element: <Settings /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
])
