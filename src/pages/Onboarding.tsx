import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building, ArrowRight, Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { criarEmpresa } from '@/services/empresas/empresaService'
import { criarMembro } from '@/services/empresas/membroService'
import { criarEtapasPadrao } from '@/services/crm/etapaFunilService'
import logoIcon from '@/assets/logo-icon.png'

export function Onboarding() {
  const { usuario, logout } = useAuth()
  const { success, error } = useToast()
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCriarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    const nome = nomeEmpresa.trim()
    if (!nome) {
      error('Nome obrigatório', 'Informe o nome da empresa.')
      return
    }
    if (!usuario) return

    setLoading(true)
    try {
      // Create empresa
      const empresaId = await criarEmpresa({ nome, criadaPor: usuario.id })

      // Create membro
      await criarMembro(empresaId, {
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: 'administrador',
        setorIds: [],
        ativo: true,
      })

      // Create default stages
      await criarEtapasPadrao(empresaId)

      // Link usuario to empresa
      await updateDoc(doc(db, 'usuarios', usuario.id), { empresaAtualId: empresaId })

      success('Empresa criada!', 'Bem-vindo à plataforma.')
      // onAuthStateChanged will reload and redirect automatically
    } catch (err) {
      error('Erro ao criar empresa', (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30 p-2">
            <img src={logoIcon} alt="FoxIA" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-xl gradient-text">FoxIA</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold mb-2">Crie sua empresa</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Configure sua empresa para começar a usar a plataforma.
          </p>

          <form onSubmit={handleCriarEmpresa} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Nome da empresa *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  placeholder="Sua Empresa Ltda."
                  className="h-10 pl-9"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-10 gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Criando...
                </>
              ) : (
                <>
                  Continuar <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <button
          onClick={logout}
          className="mt-4 mx-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair da conta
        </button>
      </motion.div>
    </div>
  )
}
