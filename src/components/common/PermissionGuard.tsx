import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { PapelUsuario } from '@/types'

interface PermissionGuardProps {
  /** Roles allowed to see the content */
  papeis: PapelUsuario[]
  /** Content to render when permission is granted */
  children: ReactNode
  /**
   * Behaviour when permission is denied.
   * - "redirect" (default): redirects to "/"
   * - "hide": renders null without redirecting
   */
  comportamento?: 'redirect' | 'hide'
}

/**
 * Wraps content that should only be visible/accessible to certain roles.
 *
 * Usage:
 * ```tsx
 * <PermissionGuard papeis={['administrador']}>
 *   <AdminOnlyPanel />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  papeis,
  children,
  comportamento = 'redirect',
}: PermissionGuardProps) {
  const { membro } = useAuth()

  if (!membro || !papeis.includes(membro.papel)) {
    if (comportamento === 'hide') return null
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
