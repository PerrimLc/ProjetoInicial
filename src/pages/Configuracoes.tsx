import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Users, Layers, GitBranch, Tag, Zap, Bot, Clock, GitMerge } from 'lucide-react'
import { AbaEmpresa } from '@/features/configuracoes/AbaEmpresa'
import { AbaEquipe } from '@/features/configuracoes/AbaEquipe'
import { AbaSetores } from '@/features/configuracoes/AbaSetores'
import { AbaEtapasFunil } from '@/features/configuracoes/AbaEtapasFunil'
import { AbaEtiquetas } from '@/features/configuracoes/AbaEtiquetas'
import { AbaRespostasRapidas } from '@/features/configuracoes/AbaRespostasRapidas'
import { AbaIA } from '@/features/configuracoes/AbaIA'
import { AbaHorarios } from '@/features/configuracoes/AbaHorarios'
import { AbaFilas } from '@/features/configuracoes/AbaFilas'

type AbaId = 'empresa' | 'equipe' | 'setores' | 'etapas' | 'etiquetas' | 'respostas' | 'ia' | 'horarios' | 'filas'

const abas = [
  { id: 'empresa' as AbaId,   label: 'Empresa',          icon: Building2 },
  { id: 'equipe' as AbaId,    label: 'Equipe',            icon: Users },
  { id: 'setores' as AbaId,   label: 'Setores',           icon: Layers },
  { id: 'etapas' as AbaId,    label: 'Etapas do Funil',   icon: GitBranch },
  { id: 'etiquetas' as AbaId, label: 'Etiquetas',         icon: Tag },
  { id: 'respostas' as AbaId, label: 'Respostas Rápidas', icon: Zap },
  { id: 'horarios' as AbaId,  label: 'Horários',          icon: Clock },
  { id: 'filas' as AbaId,     label: 'Filas',             icon: GitMerge },
  { id: 'ia' as AbaId,        label: 'Agente de IA',      icon: Bot },
]

export function Configuracoes() {
  const [abaAtiva, setAbaAtiva] = useState<AbaId>('empresa')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar de abas */}
      <div className="w-52 shrink-0 border-r border-border bg-card/30 p-3 space-y-0.5">
        {abas.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setAbaAtiva(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              abaAtiva === id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}>
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      <div className="flex-1 overflow-y-auto p-6">
        {abaAtiva === 'empresa'   && <AbaEmpresa />}
        {abaAtiva === 'equipe'    && <AbaEquipe />}
        {abaAtiva === 'setores'   && <AbaSetores />}
        {abaAtiva === 'etapas'    && <AbaEtapasFunil />}
        {abaAtiva === 'etiquetas' && <AbaEtiquetas />}
        {abaAtiva === 'respostas' && <AbaRespostasRapidas />}
        {abaAtiva === 'horarios'  && <AbaHorarios />}
        {abaAtiva === 'filas'     && <AbaFilas />}
        {abaAtiva === 'ia'        && <AbaIA />}
      </div>
    </motion.div>
  )
}
