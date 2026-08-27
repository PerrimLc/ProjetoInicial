import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Visão geral da plataforma' },
  '/atendimento': { title: 'Atendimento', subtitle: 'Central de conversas em tempo real' },
  '/contatos': { title: 'Contatos', subtitle: 'Base de contatos da empresa' },
  '/crm': { title: 'CRM', subtitle: 'Pipeline de vendas Kanban' },
  '/agenda': { title: 'Agenda', subtitle: 'Reuniões e agendamentos' },
  '/respostas-rapidas': { title: 'Respostas Rápidas', subtitle: 'Atalhos e modelos de mensagem' },
  '/relatorios': { title: 'Relatórios', subtitle: 'Métricas e insights operacionais' },
  '/equipe': { title: 'Equipe', subtitle: 'Membros e atendentes da empresa' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Gerencie sua empresa e integrações' },
}

export function MainLayout() {
  const location = useLocation()
  const page = pageTitles[location.pathname] ?? { title: 'AgentAI', subtitle: '' }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={page.title} subtitle={page.subtitle} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
