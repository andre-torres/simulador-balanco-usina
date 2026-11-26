import { useCallback, useEffect, useState } from 'react'
import { Copy, LoaderCircle, LogOut, Moon, Plus, Sun, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Marca } from '@/components/marca'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { calcular, entradasPadrao } from '@/engine'
import { useAuth } from '@/features/auth/auth-provider'
import { repositorio, type Simulacao } from '@/features/simulacoes/repositorio'
import { dataHora, num } from '@/lib/formato'
import { useTema } from '@/lib/tema'

export function Simulacoes() {
  const { usuario, sair, modoDemonstracao } = useAuth()
  const { tema, alternar } = useTema()
  const navegar = useNavigate()
  const [lista, setLista] = useState<Simulacao[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [excluir, setExcluir] = useState<Simulacao | null>(null)

  const carregar = useCallback(() => {
    repositorio
      .listar()
      .then((dados) => {
        setLista(dados)
        setErro(null)
      })
      .catch((e: Error) => setErro(e.message))
  }, [])

  useEffect(carregar, [carregar])

  async function criar(nome: string, origem?: Simulacao) {
    setCriando(true)
    try {
      const nova = await repositorio.criar(nome, origem ? structuredClone(origem.entradas) : entradasPadrao())
      if (origem) {
        toast.success(`"${nova.nome}" criada.`)
        carregar()
      } else {
        navegar(`/simulacoes/${nova.id}`)
      }
    } catch (e) {
      toast.error(`Não foi possível criar a simulação. ${(e as Error).message}`)
    } finally {
      setCriando(false)
    }
  }

  async function confirmarExclusao() {
    if (!excluir) return
    const alvo = excluir
    setExcluir(null)
    try {
      await repositorio.excluir(alvo.id)
      setLista((atual) => atual?.filter((s) => s.id !== alvo.id) ?? null)
      toast.success(`"${alvo.nome}" excluída.`)
    } catch (e) {
      toast.error(`Não foi possível excluir. ${(e as Error).message}`)
    }
  }

  return (
    <div className="min-h-svh">
      <header className="border-b bg-sidebar">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Marca />
          <div className="flex items-center gap-1">
            {modoDemonstracao ? (
              <Badge variant="warning">Modo demonstração</Badge>
            ) : (
              <span className="hidden text-sm text-muted-foreground sm:inline">{usuario?.email}</span>
            )}
            <Button variant="ghost" size="icon" onClick={alternar} aria-label="Alternar tema claro e escuro">
              {tema === 'escuro' ? <Sun /> : <Moon />}
            </Button>
            {!modoDemonstracao && (
              <Button variant="ghost" size="sm" onClick={() => void sair()}>
                <LogOut />
                Sair
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <h1 className="text-xl font-semibold tracking-tight">Simulações</h1>
            <p className="text-sm text-muted-foreground">
              Cada simulação guarda os dados primários, os parâmetros de processo e os equipamentos de um cenário.
            </p>
          </div>
          <Button onClick={() => void criar('Nova simulação')} disabled={criando}>
            {criando ? <LoaderCircle className="animate-spin" /> : <Plus />}
            Nova simulação
          </Button>
        </div>

        {modoDemonstracao && (
          <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
            Sem Supabase configurado: as simulações ficam salvas só neste navegador. Preencha o arquivo{' '}
            <code className="num text-xs">.env.local</code> para ativar login e banco de dados.
          </p>
        )}

        {erro ? (
          <Card>
            <CardContent className="grid justify-items-start gap-3">
              <p className="text-sm">Não foi possível carregar as simulações. {erro}</p>
              <Button variant="outline" size="sm" onClick={carregar}>
                Tentar de novo
              </Button>
            </CardContent>
          </Card>
        ) : lista === null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Carregando…
          </p>
        ) : lista.length === 0 ? (
          <Card>
            <CardContent className="grid justify-items-center gap-3 py-10 text-center">
              <p className="font-medium">Nenhuma simulação ainda</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Comece por um cenário de exemplo: você altera a moagem, a cana e os equipamentos e vê a produção
                de açúcar e etanol na hora.
              </p>
              <Button onClick={() => void criar('Nova simulação')} disabled={criando}>
                <Plus />
                Criar a primeira simulação
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="py-2">
            <CardContent className="px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Moagem (tch)</TableHead>
                    <TableHead className="text-right">Açúcar (t/dia)</TableHead>
                    <TableHead className="text-right">Hidratado (m³/dia)</TableHead>
                    <TableHead>Atualizada</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((s) => {
                    const r = calcular(s.entradas)
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          <Link to={`/simulacoes/${s.id}`} className="underline-offset-4 hover:underline">
                            {s.nome}
                          </Link>
                        </TableCell>
                        <TableCell className="num text-right">{num(s.entradas.cana.moagemTch, 0)}</TableCell>
                        <TableCell className="num text-right">{num(r.producao.acucarTdia, 0)}</TableCell>
                        <TableCell className="num text-right">{num(r.producao.hidratadoM3dia, 0)}</TableCell>
                        <TableCell className="text-muted-foreground">{dataHora(s.atualizadoEm)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Duplicar ${s.nome}`}
                              title="Duplicar"
                              onClick={() => void criar(`${s.nome} (cópia)`, s)}
                            >
                              <Copy />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Excluir ${s.nome}`}
                              title="Excluir"
                              onClick={() => setExcluir(s)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={excluir !== null} onOpenChange={(aberto) => !aberto && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{excluir?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              A simulação e todos os dados digitados nela serão apagados. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter simulação</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void confirmarExclusao()}
            >
              Excluir simulação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
