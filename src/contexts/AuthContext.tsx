import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase/firebase'
import { converterTimestamps } from '@/services/firebase/converters'
import {
  loginComEmail,
  cadastrarComEmail,
  logout as authLogout,
  recuperarSenha as authRecuperarSenha,
  onAuthChange,
} from '@/services/auth/authService'
import { criarEmpresa, buscarEmpresa } from '@/services/empresas/empresaService'
import { criarMembro, buscarMembro } from '@/services/empresas/membroService'
import { criarEtapasPadrao } from '@/services/crm/etapaFunilService'
import type { Usuario, Empresa, MembroEmpresa } from '@/types'

export interface AuthContextValue {
  usuario: Usuario | null
  empresa: Empresa | null
  membro: MembroEmpresa | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  cadastrar: (nome: string, email: string, nomeEmpresa: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  recuperarSenha: (email: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [membro, setMembro] = useState<MembroEmpresa | null>(null)
  const [carregando, setCarregando] = useState(true)
  // When login/cadastrar populates state directly, skip the next onAuthStateChanged call
  const skipNextAuthChange = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (skipNextAuthChange.current) {
        skipNextAuthChange.current = false
        setCarregando(false)
        return
      }

      if (!firebaseUser) {
        setUsuario(null)
        setEmpresa(null)
        setMembro(null)
        setCarregando(false)
        return
      }

      try {
        // Load usuario document
        const usuarioSnap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
        if (!usuarioSnap.exists()) {
          setUsuario(null)
          setEmpresa(null)
          setMembro(null)
          setCarregando(false)
          return
        }

        const usuarioData = converterTimestamps<Usuario>({
          id: usuarioSnap.id,
          ...usuarioSnap.data(),
        })
        setUsuario(usuarioData)

        const empresaId = usuarioData.empresaAtualId
        if (!empresaId) {
          setEmpresa(null)
          setMembro(null)
          setCarregando(false)
          return
        }

        // Load empresa and membro in parallel
        const [empresaData, membroData] = await Promise.all([
          buscarEmpresa(empresaId),
          buscarMembro(empresaId, firebaseUser.uid),
        ])

        // If membro is inactive, logout automatically
        if (membroData && !membroData.ativo) {
          await authLogout()
          setUsuario(null)
          setEmpresa(null)
          setMembro(null)
          setCarregando(false)
          return
        }

        setEmpresa(empresaData)
        setMembro(membroData)
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err)
        setUsuario(null)
        setEmpresa(null)
        setMembro(null)
      } finally {
        setCarregando(false)
      }
    })

    return unsubscribe
  }, [])

  const login = useCallback(async (email: string, senha: string): Promise<void> => {
    const credencial = await loginComEmail(email, senha)
    const uid = credencial.user.uid

    // Load user data directly instead of waiting for onAuthStateChanged
    const usuarioSnap = await getDoc(doc(db, 'usuarios', uid))
    if (!usuarioSnap.exists()) return

    const usuarioData = converterTimestamps<Usuario>({
      id: usuarioSnap.id,
      ...usuarioSnap.data(),
    })

    const empresaId = usuarioData.empresaAtualId
    if (!empresaId) {
      skipNextAuthChange.current = true
      setUsuario(usuarioData)
      setCarregando(false)
      return
    }

    const [empresaData, membroData] = await Promise.all([
      buscarEmpresa(empresaId),
      buscarMembro(empresaId, uid),
    ])

    skipNextAuthChange.current = true
    setUsuario(usuarioData)
    setEmpresa(empresaData)
    setMembro(membroData)
    setCarregando(false)
  }, [])

  const cadastrar = useCallback(
    async (nome: string, email: string, nomeEmpresa: string, senha: string): Promise<void> => {
      // 1. Create Firebase Auth user
      const credencial = await cadastrarComEmail(email, senha)
      const uid = credencial.user.uid

      // 2. Create usuario document (without empresaAtualId yet)
      await setDoc(doc(db, 'usuarios', uid), {
        nome,
        email,
        criadoEm: serverTimestamp(),
        empresaAtualId: '',
      })

      // 3. Create empresa
      const empresaId = await criarEmpresa({ nome: nomeEmpresa, criadaPor: uid })

      // 4. Create membro as administrador
      await criarMembro(empresaId, {
        usuarioId: uid,
        nome,
        email,
        papel: 'administrador',
        setorIds: [],
        ativo: true,
      })

      // 5. Create default funnel stages
      await criarEtapasPadrao(empresaId)

      // 6. Update usuario with empresaAtualId
      await updateDoc(doc(db, 'usuarios', uid), { empresaAtualId: empresaId })

      // 7. Proactively set state so navigation triggers immediately
      //    (onAuthStateChanged may fire before the updateDoc write is visible)
      const [empresaData, membroData] = await Promise.all([
        buscarEmpresa(empresaId),
        buscarMembro(empresaId, uid),
      ])
      const usuarioFinal: Usuario = {
        id: uid,
        nome,
        email,
        empresaAtualId: empresaId,
        criadoEm: new Date(),
      }
      skipNextAuthChange.current = true
      setUsuario(usuarioFinal)
      setEmpresa(empresaData)
      setMembro(membroData)
      setCarregando(false)
    },
    []
  )

  const logout = useCallback(async (): Promise<void> => {
    await authLogout()
    setUsuario(null)
    setEmpresa(null)
    setMembro(null)
  }, [])

  const recuperarSenha = useCallback(async (email: string): Promise<void> => {
    await authRecuperarSenha(email)
  }, [])

  const value: AuthContextValue = {
    usuario,
    empresa,
    membro,
    carregando,
    login,
    cadastrar,
    logout,
    recuperarSenha,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
