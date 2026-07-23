import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useContatos } from '@/hooks/useContatos'
import { useMembros } from '@/hooks/useMembros'
import type { Negocio, EtapaFunil } from '@/types'

const schema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  contatoId: z.string().min(1, 'Selecione um contato'),
  etapaId: z.string().min(1, 'Selecione uma etapa'),
  prioridade: z.enum(['baixa', 'media', 'alta']),
  valor: z.coerce.number().min(0).optional(),
  responsavelId: z.string().optional(),
  origem: z.string().optional(),
  observacoes: z.string().optional(),
})

export type NegocioFormData = z.infer<typeof schema>

interface NegocioFormProps {
  negocio?: Negocio
  etapas: EtapaFunil[]
  etapaIdInicial?: string
  onSalvar: (dados: NegocioFormData) => Promise<void>
  onCancelar: () => void
  salvando?: boolean
}

const origens = ['Manual', 'WhatsApp', 'Site', 'Indicação', 'Evento', 'LinkedIn', 'Instagram', 'Outro']

export function NegocioForm({ negocio, etapas, etapaIdInicial, onSalvar, onCancelar, salvando }: NegocioFormProps) {
  const { contatos } = useContatos()
  const { membros } = useMembros()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NegocioFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: '',
      contatoId: '',
      etapaId: etapaIdInicial ?? etapas[0]?.id ?? '',
      prioridade: 'media',
      valor: 0,
      responsavelId: '',
      origem: '',
      observacoes: '',
    },
  })

  useEffect(() => {
    if (negocio) {
      reset({
        titulo: negocio.titulo,
        contatoId: negocio.contatoId,
        etapaId: negocio.etapaId,
        prioridade: negocio.prioridade,
        valor: negocio.valor ?? 0,
        responsavelId: negocio.responsavelId ?? '',
        origem: negocio.origem ?? '',
        observacoes: negocio.observacoes ?? '',
      })
    }
  }, [negocio, reset])

  return (
    <form onSubmit={handleSubmit(onSalvar)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Título */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Título <span className="text-red-400">*</span>
          </label>
          <Input {...register('titulo')} placeholder="Nome do negócio" className="h-9 text-sm" />
          {errors.titulo && <p className="text-xs text-red-400 mt-1">{errors.titulo.message}</p>}
        </div>

        {/* Contato */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Contato <span className="text-red-400">*</span>
          </label>
          <select
            {...register('contatoId')}
            className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Selecionar contato...</option>
            {contatos.filter((c) => c.ativo).map((c) => (
              <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>
            ))}
          </select>
          {errors.contatoId && <p className="text-xs text-red-400 mt-1">{errors.contatoId.message}</p>}
        </div>

        {/* Etapa */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Etapa <span className="text-red-400">*</span>
          </label>
          <select
            {...register('etapaId')}
            className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {etapas.filter((e) => e.ativo).map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
          {errors.etapaId && <p className="text-xs text-red-400 mt-1">{errors.etapaId.message}</p>}
        </div>

        {/* Prioridade */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Prioridade <span className="text-red-400">*</span>
          </label>
          <select
            {...register('prioridade')}
            className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        {/* Valor */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Valor (R$)</label>
          <Input {...register('valor')} type="number" placeholder="0" className="h-9 text-sm" />
        </div>

        {/* Responsável */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Responsável</label>
          <select
            {...register('responsavelId')}
            className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Sem responsável</option>
            {membros.filter((m) => m.ativo).map((m) => (
              <option key={m.usuarioId} value={m.usuarioId}>{m.nome}</option>
            ))}
          </select>
        </div>

        {/* Origem */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Origem</label>
          <select
            {...register('origem')}
            className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Selecionar origem...</option>
            {origens.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Observações */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Observações</label>
          <textarea
            {...register('observacoes')}
            rows={3}
            placeholder="Notas sobre o negócio..."
            className="w-full text-sm bg-transparent border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" variant="gradient" size="sm" disabled={salvando}>
          {salvando ? 'Salvando...' : negocio ? 'Salvar Alterações' : 'Criar Negócio'}
        </Button>
      </div>
    </form>
  )
}
