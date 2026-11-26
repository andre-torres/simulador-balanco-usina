import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { modoDemonstracao, supabase } from '@/lib/supabase'

export interface Usuario {
  id: string
  email: string
}

interface AuthContexto {
  usuario: Usuario | null
  carregando: boolean
  modoDemonstracao: boolean
  /** Devolve a mensagem de erro, ou `null` se deu certo. */
  entrar: (email: string, senha: string) => Promise<string | null>
  cadastrar: (email: string, senha: string) => Promise<{ erro: string | null; confirmarEmail: boolean }>
  sair: () => Promise<void>
}

const Contexto = createContext<AuthContexto | null>(null)

const USUARIO_LOCAL: Usuario = { id: 'local', email: 'Modo demonstração' }

function traduzir(mensagem: string): string {
  if (/invalid login credentials/i.test(mensagem)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(mensagem)) return 'Confirme o e-mail antes de entrar.'
  if (/already registered/i.test(mensagem)) return 'Este e-mail já tem cadastro.'
  if (/password should be at least/i.test(mensagem)) return 'A senha precisa de pelo menos 6 caracteres.'
  if (/rate limit/i.test(mensagem)) return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  return mensagem
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(modoDemonstracao ? USUARIO_LOCAL : null)
  const [carregando, setCarregando] = useState(!modoDemonstracao)

  useEffect(() => {
    if (!supabase) return
    let ativo = true
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return
      const u = data.session?.user
      setUsuario(u ? { id: u.id, email: u.email ?? '' } : null)
      setCarregando(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      const u = sessao?.user
      setUsuario(u ? { id: u.id, email: u.email ?? '' } : null)
      setCarregando(false)
    })
    return () => {
      ativo = false
      data.subscription.unsubscribe()
    }
  }, [])

  const valor = useMemo<AuthContexto>(
    () => ({
      usuario,
      carregando,
      modoDemonstracao,
      async entrar(email, senha) {
        if (!supabase) return null
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        return error ? traduzir(error.message) : null
      },
      async cadastrar(email, senha) {
        if (!supabase) return { erro: null, confirmarEmail: false }
        const { data, error } = await supabase.auth.signUp({ email, password: senha })
        if (error) return { erro: traduzir(error.message), confirmarEmail: false }
        return { erro: null, confirmarEmail: data.session === null }
      },
      async sair() {
        if (supabase) await supabase.auth.signOut()
      },
    }),
    [usuario, carregando],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthContexto {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
