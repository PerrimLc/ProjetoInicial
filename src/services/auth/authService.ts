import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  Unsubscribe,
} from 'firebase/auth'
import { auth } from '@/services/firebase/firebase'
import { traduzirErroFirebase } from '@/utils/errors'

export async function loginComEmail(email: string, senha: string): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(auth, email, senha)
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function cadastrarComEmail(email: string, senha: string): Promise<UserCredential> {
  try {
    return await createUserWithEmailAndPassword(auth, email, senha)
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export async function recuperarSenha(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? ''
    throw new Error(traduzirErroFirebase(code))
  }
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback)
}
