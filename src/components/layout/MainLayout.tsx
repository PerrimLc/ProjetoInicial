import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Visão geral da plataforma' },
  '/conversations': { title: 'Conversas', subtitle: 'Gerenciar atendimentos em tempo real' },
  '/leads': { title: 'Leads', subtitle: 'Pipeline de captação e qualificação' },
  '/agents': { title: 'Agentes IA', subtitle: 'Gerencie seus agentes inteligentes' },
  '/flows': { title: 'Fluxos de Automação', subtitle: 'Construa fluxos inteligentes' },
  '/crm': { title: 'CRM', subtitle: 'Pipeline de vendas Kanban' },
  '/agenda': { title: 'Agenda', subtitle: 'Reuniões e compromissos' },
  '/knowledge': { title: 'Base de Conhecimento', subtitle: 'Documentos e materiais de treinamento' },
  '/analytics': { title: 'Analytics', subtitle: 'Métricas e insights de desempenho' },
  '/settings': { title: 'Configurações', subtitle: 'Gerencie sua conta e integrações' },
  '/profile': { title: 'Meu Perfil', subtitle: 'Dados pessoais e preferências' },
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
