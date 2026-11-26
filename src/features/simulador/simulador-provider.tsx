import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { calcular, type Entradas, type Resultado } from '@/engine'
import { repositorio, type Simulacao } from '@/features/simulacoes/repositorio'

export type EstadoGravacao = 'salvo' | 'pendente' | 'salvando' | 'erro'

interface SimuladorContexto {
  id: string
  nome: string
  entradas: Entradas
  resultado: Resultado
  gravacao: EstadoGravacao
  /** Altera as entradas: recebe uma cópia para modificar à vontade. */
  alterar: (mudanca: (rascunho: Entradas) => void) => void
  renomear: (nome: string) => void
}

const Contexto = createContext<SimuladorContexto | null>(null)

const ESPERA_GRAVACAO_MS = 800

export function SimuladorProvider({ simulacao, children }: { simulacao: Simulacao; children: ReactNode }) {
  const [nome, setNome] = useState(simulacao.nome)
  const [entradas, setEntradas] = useState(simulacao.entradas)
  const [gravacao, setGravacao] = useState<EstadoGravacao>('salvo')
  const pendente = useRef<{ nome: string; entradas: Entradas } | null>(null)

  // O cálculo roda a cada alteração; é uma função pura do motor.
  const resultado = useMemo(() => calcular(entradas), [entradas])

  const gravar = useCallback(async () => {
    const dados = pendente.current
    if (!dados) return
    pendente.current = null
    setGravacao('salvando')
    try {
      await repositorio.salvar(simulacao.id, dados)
      setGravacao(pendente.current ? 'pendente' : 'salvo')
    } catch {
      pendente.current ??= dados
      setGravacao('erro')
    }
  }, [simulacao.id])

  const ultimo = useRef({ nome: simulacao.nome, entradas: simulacao.entradas })
  useEffect(() => {
    if (ultimo.current.nome === nome && ultimo.current.entradas === entradas) return
    ultimo.current = { nome, entradas }
    pendente.current = { nome, entradas }
    setGravacao('pendente')
    const espera = setTimeout(gravar, ESPERA_GRAVACAO_MS)
    return () => clearTimeout(espera)
  }, [nome, entradas, gravar])

  // Grava o que estiver pendente ao sair da tela.
  useEffect(() => () => void gravar(), [gravar])

  const alterar = useCallback((mudanca: (rascunho: Entradas) => void) => {
    setEntradas((atual) => {
      const rascunho = structuredClone(atual)
      mudanca(rascunho)
      return rascunho
    })
  }, [])

  const valor = useMemo<SimuladorContexto>(
    () => ({ id: simulacao.id, nome, entradas, resultado, gravacao, alterar, renomear: setNome }),
    [simulacao.id, nome, entradas, resultado, gravacao, alterar],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useSimulador(): SimuladorContexto {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useSimulador precisa estar dentro de <SimuladorProvider>')
  return ctx
}
