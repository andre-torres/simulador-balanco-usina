import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '@/features/auth/auth-provider'

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center gap-2 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" />
      {texto}
    </div>
  )
}

/** Só deixa passar quem está autenticado; os demais vão para o login. */
export function RotaProtegida() {
  const { usuario, carregando } = useAuth()
  const local = useLocation()
  if (carregando) return <Carregando />
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />
  return <Outlet />
}

/** Login e cadastro: quem já entrou vai direto para as simulações. */
export function RotaPublica() {
  const { usuario, carregando } = useAuth()
  if (carregando) return <Carregando />
  if (usuario) return <Navigate to="/simulacoes" replace />
  return <Outlet />
}
