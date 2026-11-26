import type { ReactNode } from 'react'
import { CircleAlert, TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Aviso, Situacao } from '@/engine'
import { pct } from '@/lib/formato'
import { cn } from '@/lib/utils'

export function Pagina({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string
  descricao?: string
  acoes?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
          {descricao && <p className="max-w-3xl text-sm text-muted-foreground">{descricao}</p>}
        </div>
        {acoes}
      </header>
      {children}
    </div>
  )
}

export function Secao({
  titulo,
  descricao,
  acao,
  children,
  className,
}: {
  titulo: string
  descricao?: string
  acao?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        {descricao && <CardDescription>{descricao}</CardDescription>}
        {acao && <CardAction>{acao}</CardAction>}
      </CardHeader>
      <CardContent className="grid gap-5">{children}</CardContent>
    </Card>
  )
}

/** Grade padrão dos campos de digitação. */
export function GradeCampos({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-3 xl:grid-cols-4', className)}>
      {children}
    </div>
  )
}

/** Indicador de destaque (valor calculado). */
export function Indicador({
  rotulo,
  valor,
  unidade,
  detalhe,
  className,
}: {
  rotulo: string
  valor: string
  unidade?: string
  detalhe?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-1 rounded-lg border bg-card px-4 py-3', className)}>
      <span className="text-xs text-muted-foreground">{rotulo}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="num text-2xl font-semibold tracking-tight">{valor}</span>
        {unidade && <span className="text-xs text-muted-foreground">{unidade}</span>}
      </span>
      {detalhe && <span className="text-xs text-muted-foreground">{detalhe}</span>}
    </div>
  )
}

/** Lista de valores calculados: rótulo à esquerda, número e unidade à direita. */
export function ListaValores({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('grid divide-y text-sm', className)}>{children}</dl>
}

export function Valor({
  rotulo,
  valor,
  unidade,
  destaque,
}: {
  rotulo: string
  valor: string
  unidade?: string
  destaque?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className={cn('text-muted-foreground', destaque && 'font-medium text-foreground')}>{rotulo}</dt>
      <dd className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className={cn('num', destaque && 'font-semibold')}>{valor}</span>
        {unidade && <span className="w-14 text-xs text-muted-foreground">{unidade}</span>}
      </dd>
    </div>
  )
}

const rotuloSituacao: Record<Situacao, string> = {
  ok: 'ok',
  atencao: 'atenção',
  acima: 'acima',
  'sem-dado': 'sem dado',
}

/** Ocupação = necessário ÷ instalado, com cor por faixa (≤ 90%, 90–100%, > 100%). */
export function SeloOcupacao({ ocupacao, situacao }: { ocupacao: number | null; situacao: Situacao }) {
  if (situacao === 'sem-dado') return <span className="text-xs text-muted-foreground">sem dado</span>
  const variante = situacao === 'acima' ? 'destructive' : situacao === 'atencao' ? 'warning' : 'success'
  return (
    <Badge variant={variante} className="num min-w-14" title={rotuloSituacao[situacao]}>
      {pct(ocupacao)}
    </Badge>
  )
}

export function ListaAvisos({ avisos }: { avisos: Aviso[] }) {
  if (avisos.length === 0) return null
  const erros = avisos.filter((a) => a.nivel === 'erro')
  const atencao = avisos.filter((a) => a.nivel === 'atencao')
  return (
    <div className="grid gap-2">
      {erros.map((a) => (
        <Alert key={a.mensagem} variant="destructive">
          <CircleAlert />
          <AlertTitle>{a.setor}</AlertTitle>
          <AlertDescription>{a.mensagem}</AlertDescription>
        </Alert>
      ))}
      {atencao.length > 0 && (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertTitle>Equipamento acima da capacidade instalada</AlertTitle>
          <AlertDescription>
            <ul className="grid gap-0.5">
              {atencao.map((a) => (
                <li key={a.mensagem}>{a.mensagem}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export interface Opcao<T extends string> {
  valor: T
  rotulo: string
}

export function Seletor<T extends string>({
  rotulo,
  valor,
  opcoes,
  aoMudar,
  className,
}: {
  rotulo: string
  valor: T
  opcoes: Opcao<T>[]
  aoMudar: (valor: T) => void
  className?: string
}) {
  return (
    <Select value={valor} onValueChange={(v) => aoMudar(v as T)}>
      <SelectTrigger size="sm" aria-label={rotulo} className={cn('w-28 bg-campo dark:bg-campo', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Campo com rótulo em cima para controles que não são numéricos. */
export function CampoRotulado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-1.5">
      <span className="text-xs text-muted-foreground">{rotulo}</span>
      {children}
    </div>
  )
}
