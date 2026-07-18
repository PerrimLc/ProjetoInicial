import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge as _Badge } from '@/components/ui/badge'
import { useEtiquetas } from '@/hooks/useEtiquetas'
import { useMembros } from '@/hooks/useMembros'
import type { Contato } from '@/types'

// ─── Schema de validação ────────────────────────────────────────────────────

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  empresa: z.string().optional(),
  observacoes: z.string().optional(),
  origem: z.string().optional(),
  etiquetaIds: z.array(z.string()),
  responsavelId: z.string().optional(),
  ativo: z.boolean(),
})

export type ContatoFormData = z.infer<typeof schema>

interface ContatoFormProps {
  contato?: Contato
  onSalvar: (dados: ContatoFormData) => Promise<void>
  onCancelar: () => void
  salvando?: boolean
}

const origens = ['Manual', 'WhatsApp', 'Site', 'Indicação', 'Evento', 'LinkedIn', 'Instagram', 'Outro']

export function ContatoForm({ contato, onSalvar, onCancelar, salvando }: ContatoFormProps) {
  const { etiquetas } = useEtiquetas()
  const { membros } = useMembros()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContatoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      empresa: '',
      observacoes: '',
      origem: '',
      etiquetaIds: [],
      responsavelId: '',
      ativo: true,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (contato) {
      reset({
        nome: contato.nome,
        telefone: contato.telefone,
        email: contato.email ?? '',
        empresa: contato.empresa ?? '',
        observacoes: contato.observacoes ?? '',
        origem: contato.origem ?? '',
        etiquetaIds: contato.etiquetaIds ?? [],
        responsavelId: contato.responsavelId ?? '',
        ativo: contato.ativo,
      })
    }
  }, [contato, reset])

  const selectedEtiquetaIds = watch('etiquetaIds')

  const toggleEtiqueta = (id: string) => {
    const current = selectedEtiquetaIds ?? []
    if (current.includes(id)) {
      setValue('etiquetaIds', current.filter((e) => e !== id))
    } else {
      setValue('etiquetaIds', [...current, id])
    }
  }

  const onSubmit = (data: ContatoFormData) => {
    onSalvar(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Nome */}
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Nome <span className="text-red-400">*</span>
          </label>
          <Input
            {...register('nome')}
            placeholder="Nome completo"
            className="h-9 text-sm"
          />
          {errors.nome && (
            <p className="text-xs text-red-400 mt-1">{errors.nome.message}</p>
          )}
        </div>

        {/* Telefone */}
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Telefone <span className="text-red-400">*</span>
          </label>
          <Input
            {...register('telefone')}
            placeholder="+55 11 99999-9999"
            className="h-9 text-sm"
          />
          {errors.telefone && (
            <p className="text-xs text-red-400 mt-1">{errors.telefone.message}</p>
          )}
        </div>

        {/* E-mail */}
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            E-mail
          </label>
          <Input
            {...register('email')}
            type="email"
            placeholder="email@exemplo.com"
            className="h-9 text-sm"
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Empresa */}
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Empresa
          </label>
          <Input
            {...register('empresa')}
            placeholder="Nome da empresa"
            className="h-9 text-sm"
          />
        </div>

        {/* Origem */}
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Origem
          </label>
          <select
            {...register('origem')}
            className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Selecionar origem...</option>
            {origens.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Responsável */}
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Responsável
          </label>
          <select
            {...register('responsavelId')}
            className="w-full h-9 text-sm bg-transparent border border-border rounded-lg px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Sem responsável</option>
            {membros
              .filter((m) => m.ativo)
              .map((m) => (
                <option key={m.usuarioId} value={m.usuarioId}>
                  {m.nome}
                </option>
              ))}
          </select>
        </div>

        {/* Observações */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Observações
          </label>
          <textarea
            {...register('observacoes')}
            placeholder="Anotações sobre o contato..."
            rows={3}
            className="w-full text-sm bg-transparent border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        {/* Etiquetas */}
        {etiquetas.length > 0 && (
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Etiquetas
            </label>
            <Controller
              control={control}
              name="etiquetaIds"
              render={() => (
                <div className="flex flex-wrap gap-2">
                  {etiquetas.map((et) => {
                    const selected = selectedEtiquetaIds?.includes(et.id)
                    return (
                      <button
                        key={et.id}
                        type="button"
                        onClick={() => toggleEtiqueta(et.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? 'border-transparent opacity-100 ring-2 ring-offset-1 ring-offset-card'
                            : 'border-border opacity-60 hover:opacity-90'
                        }`}
                        style={
                          selected
                            ? { backgroundColor: et.cor + '33', color: et.cor }
                            : {}
                        }
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: et.cor }}
                        />
                        {et.nome}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" variant="gradient" size="sm" disabled={salvando}>
          {salvando ? 'Salvando...' : contato ? 'Salvar Alterações' : 'Cadastrar Contato'}
        </Button>
      </div>
    </form>
  )
}
