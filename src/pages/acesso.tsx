import { useState, type FormEvent } from 'react'
import { CircleAlert, LoaderCircle, MailCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'

import { Marca } from '@/components/marca'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-provider'

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-sidebar p-4">
      <Marca />
      {children}
    </div>
  )
}

export function Login() {
  const { entrar } = useAuth()
  const navegar = useNavigate()
  const local = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)
    const falha = await entrar(email.trim(), senha)
    setEnviando(false)
    if (falha) return setErro(falha)
    const destino = (local.state as { de?: string } | null)?.de ?? '/simulacoes'
    navegar(destino, { replace: true })
  }

  return (
    <Moldura>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Entrar</CardTitle>
          <CardDescription>Acesse suas simulações de balanço.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="grid gap-4">
            {erro && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>{erro}</AlertTitle>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={enviando}>
              {enviando && <LoaderCircle className="animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Ainda não tem conta?
          <Button variant="link" asChild className="px-1.5">
            <Link to="/cadastro">Criar conta</Link>
          </Button>
        </CardFooter>
      </Card>
    </Moldura>
  )
}

export function Cadastro() {
  const { cadastrar } = useAuth()
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)
    const resposta = await cadastrar(email.trim(), senha)
    setEnviando(false)
    if (resposta.erro) return setErro(resposta.erro)
    if (resposta.confirmarEmail) return setConfirmar(true)
    navegar('/simulacoes', { replace: true })
  }

  return (
    <Moldura>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Criar conta</CardTitle>
          <CardDescription>Suas simulações ficam salvas na sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmar ? (
            <Alert>
              <MailCheck />
              <AlertTitle>Confirme seu e-mail</AlertTitle>
              <AlertDescription>
                Enviamos um link para {email}. Abra o link e depois entre com sua senha.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={enviar} className="grid gap-4">
              {erro && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertTitle>{erro}</AlertTitle>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Pelo menos 6 caracteres.</p>
              </div>
              <Button type="submit" disabled={enviando}>
                {enviando && <LoaderCircle className="animate-spin" />}
                Criar conta
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Já tem conta?
          <Button variant="link" asChild className="px-1.5">
            <Link to="/login">Entrar</Link>
          </Button>
        </CardFooter>
      </Card>
    </Moldura>
  )
}
