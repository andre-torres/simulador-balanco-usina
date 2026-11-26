import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'

import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth/auth-provider'
import { RotaProtegida, RotaPublica } from '@/features/auth/rota-protegida'
import { Cadastro, Login } from '@/pages/acesso'
import { Simulacoes } from '@/pages/simulacoes'
import { Aquecimento } from '@/pages/simulador/aquecimento'
import { Capacidade } from '@/pages/simulador/capacidade'
import { Cozimento } from '@/pages/simulador/cozimento'
import { DadosPrimarios } from '@/pages/simulador/dados-primarios'
import { Evaporacao } from '@/pages/simulador/evaporacao'
import { ExtracaoDestilaria } from '@/pages/simulador/extracao-destilaria'
import { SimuladorLayout } from '@/pages/simulador/layout'
import { Premissas } from '@/pages/simulador/premissas'
import { Producao } from '@/pages/simulador/producao'

const router = createBrowserRouter([
  {
    element: <RotaPublica />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/cadastro', element: <Cadastro /> },
    ],
  },
  {
    element: <RotaProtegida />,
    children: [
      { path: '/simulacoes', element: <Simulacoes /> },
      {
        path: '/simulacoes/:id',
        element: <SimuladorLayout />,
        children: [
          { index: true, element: <Navigate to="dados" replace /> },
          { path: 'dados', element: <DadosPrimarios /> },
          { path: 'producao', element: <Producao /> },
          { path: 'aquecimento', element: <Aquecimento /> },
          { path: 'evaporacao', element: <Evaporacao /> },
          { path: 'cozimento', element: <Cozimento /> },
          { path: 'extracao-destilaria', element: <ExtracaoDestilaria /> },
          { path: 'capacidade', element: <Capacidade /> },
          { path: 'premissas', element: <Premissas /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/simulacoes" replace /> },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" />
    </AuthProvider>
  )
}
