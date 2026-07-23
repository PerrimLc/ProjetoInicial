import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { atualizarEmpresa } from '@/services/empresas/empresaService'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  documento: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

export function AbaEmpresa() {
  const { empresa } = useAuth()
  const { success, error: toastError } = useToast()

  const { register, handleSubmit, reset, formState: { errors, isDirty, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', documento: '', telefone: '', email: '' },
  })

  useEffect(() => {
    if (empresa) {
      reset({
        nome: empresa.nome ?? '',
        documento: empresa.documento ?? '',
        telefone: empresa.telefone ?? '',
        email: empresa.email ?? '',
      })
    }
  }, [empresa, reset])

  const onSubmit = async (dados: FormData) => {
    if (!empresa) return
    try {
      await atualizarEmpresa(empresa.id, dados)
      success('Dados salvos!')
    } catch (e) {
      toastError('Erro ao salvar', (e as Error).message)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-0.5">Dados da Empresa</h3>
        <p className="text-xs text-muted-foreground">Informações cadastrais da sua organização</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nome da Empresa *</label>
          <Input {...register('nome')} placeholder="Nome da empresa" className="h-9 text-sm" />
          {errors.nome && <p className="text-xs text-red-400 mt-1">{errors.nome.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">CNPJ / CPF</label>
            <Input {...register('documento')} placeholder="00.000.000/0000-00" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Telefone</label>
            <Input {...register('telefone')} placeholder="+55 11 99999-9999" className="h-9 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">E-mail</label>
          <Input {...register('email')} type="email" placeholder="contato@empresa.com" className="h-9 text-sm" />
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
        </div>
        <div className="pt-2">
          <Button type="submit" variant="gradient" size="sm" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
