import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  CircleAlert,
  CloudAlert,
  CloudCheck,
  CloudUpload,
  Droplets,
  Factory,
  Flame,
  FlaskConical,
  Gauge,
  ListChecks,
  Moon,
  Settings2,
  Sun,
  Thermometer,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink, Outlet, useParams } from 'react-router'

import { Marca } from '@/components/marca'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Aviso } from '@/engine'
import { Carregando } from '@/features/auth/rota-protegida'
import { repositorio, type Simulacao } from '@/features/simulacoes/repositorio'
import { SimuladorProvider, useSimulador, type EstadoGravacao } from '@/features/simulador/simulador-provider'
import { num } from '@/lib/formato'
import { useTema } from '@/lib/tema'
import { cn } from '@/lib/utils'

interface ItemMenu {
  para: string
  rotulo: string
  icone: LucideIcon
  /** Setores cujos avisos acendem o marcador deste item. */
  setores?: Aviso['setor'][]
}

const MENU: { grupo: string; itens: ItemMenu[] }[] = [
  {
    grupo: 'Entrada',
    itens: [{ para: 'dados', rotulo: 'Dados primários', icone: ListChecks, setores: ['Balanço'] }],
  },
  {
    grupo: 'Resultados',
    itens: [
      { para: 'producao', rotulo: 'Açúcar e etanol', icone: Factory },
      { para: 'aquecimento', rotulo: 'Aquecimento', icone: Thermometer, setores: ['Tratamento de caldo'] },
      { para: 'evaporacao', rotulo: 'Evaporação', icone: Droplets, setores: ['Evaporação'] },
      { para: 'cozimento', rotulo: 'Cozimento', icone: FlaskConical, setores: ['Cozimento'] },
    ],
  },
  {
    grupo: 'Apoio',
    itens: [
      { para: 'extracao-destilaria', rotulo: 'Extração e destilaria', icone: Flame, setores: ['Extração', 'Destilaria'] },
      { para: 'capacidade', rotulo: 'Capacidade', icone: Gauge },
      { para: 'premissas', rotulo: 'Premissas', icone: Settings2 },
    ],
  },
]

const GRAVACAO: Record<EstadoGravacao, { texto: string; icone: LucideIcon; classe?: string }> = {
  salvo: { texto: 'Salvo', icone: CloudCheck },
  pendente: { texto: 'Alterações a salvar', icone: CloudUpload },
  salvando: { texto: 'Salvando…', icone: CloudUpload },
  erro: { texto: 'Não salvou. Nova tentativa na próxima alteração.', icone: CloudAlert, classe: 'text-destructive' },
}

function nivelDoItem(item: ItemMenu, avisos: Aviso[]): Aviso['nivel'] | null {
  const meus = avisos.filter((a) => item.setores?.includes(a.setor))
  if (meus.some((a) => a.nivel === 'erro')) return 'erro'
  return meus.length > 0 ? 'atencao' : null
}

function Marcador({ nivel }: { nivel: Aviso['nivel'] | null }) {
  if (!nivel) return null
  const texto = nivel === 'erro' ? 'há erro neste setor' : 'há equipamento acima da capacidade'
  return (
    <span
      role="img"
      aria-label={texto}
      title={texto}
      className={cn('ml-auto size-2 shrink-0 rounded-full', nivel === 'erro' ? 'bg-destructive' : 'bg-warning')}
    />
  )
}

function Resumo({ rotulo, valor, unidade, alerta }: { rotulo: string; valor: string; unidade: string; alerta?: boolean }) {
  return (
    <div className="grid gap-0.5 px-4 py-2 first:pl-0">
      <span className="text-[11px] whitespace-nowrap text-muted-foreground">{rotulo}</span>
      <span className="flex items-baseline gap-1 whitespace-nowrap">
        <span className={cn('num text-base font-semibold', alerta && 'text-destructive')}>{valor}</span>
        <span className="text-[11px] text-muted-foreground">{unidade}</span>
      </span>
    </div>
  )
}

function Casca() {
  const { nome, renomear, resultado: r, gravacao } = useSimulador()
  const { tema, alternar } = useTema()
  const estado = GRAVACAO[gravacao]
  const erros = r.avisos.filter((a) => a.nivel === 'erro').length

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-6 border-r bg-sidebar p-4 lg:flex">
        <Link to="/simulacoes" aria-label="Voltar para a lista de simulações">
          <Marca />
        </Link>
        <nav className="grid gap-5" aria-label="Telas da simulação">
          {MENU.map((g) => (
            <div key={g.grupo} className="grid gap-1">
              <span className="px-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                {g.grupo}
              </span>
              {g.itens.map((item) => (
                <NavLink
                  key={item.para}
                  to={item.para}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-accent font-medium text-accent-foreground',
                    )
                  }
                >
                  <item.icone className="size-4 shrink-0" />
                  {item.rotulo}
                  <Marcador nivel={nivelDoItem(item, r.avisos)} />
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <p className="mt-auto text-[11px] leading-relaxed text-muted-foreground">
          Campos em amarelo são de digitação. Os demais valores são calculados.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b bg-background">
          <div className="flex items-center gap-2 px-4 pt-3 lg:px-6">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
              <Link to="/simulacoes">
                <ChevronLeft />
                Simulações
              </Link>
            </Button>
            <Input
              aria-label="Nome da simulação"
              value={nome}
              maxLength={120}
              onChange={(e) => renomear(e.target.value)}
              onBlur={(e) => e.target.value.trim() === '' && renomear('Simulação sem nome')}
              className="h-8 max-w-sm border-transparent px-2 text-base font-semibold shadow-none hover:border-input focus-visible:border-ring md:text-base dark:bg-transparent"
            />
            <span
              className={cn('ml-auto flex items-center gap-1.5 text-xs text-muted-foreground', estado.classe)}
              role="status"
            >
              <estado.icone className="size-4" />
              <span className="hidden sm:inline">{estado.texto}</span>
            </span>
            <Button variant="ghost" size="icon" onClick={alternar} aria-label="Alternar tema claro e escuro">
              {tema === 'escuro' ? <Sun /> : <Moon />}
            </Button>
          </div>

          <div className="flex divide-x overflow-x-auto px-4 pb-1 lg:px-6">
            <Resumo rotulo="Moagem" valor={num(r.balanco.moagemTcd, 0)} unidade="tcd" />
            <Resumo rotulo="Açúcar" valor={num(r.producao.acucarTdia, 0)} unidade="t/dia" />
            <Resumo rotulo="Etanol hidratado" valor={num(r.producao.hidratadoM3dia, 0)} unidade="m³/dia" />
            <Resumo rotulo="Etanol anidro" valor={num(r.producao.anidroM3dia, 0)} unidade="m³/dia" />
            <Resumo rotulo="Vapor de escape (evaporação)" valor={num(r.evaporacao.vaporEscape, 0)} unidade="t/h" />
            <Resumo
              rotulo="Maior ocupação"
              valor={num(r.capacidade.maiorOcupacao * 100, 0)}
              unidade="%"
              alerta={r.capacidade.maiorOcupacao > 1}
            />
            {erros > 0 && (
              <div className="flex items-center gap-1.5 px-4 text-xs font-medium whitespace-nowrap text-destructive">
                <CircleAlert className="size-4" />
                {erros} {erros === 1 ? 'erro a corrigir' : 'erros a corrigir'}
              </div>
            )}
          </div>

          <nav className="flex gap-1 overflow-x-auto border-t px-3 py-1.5 lg:hidden" aria-label="Telas da simulação">
            {MENU.flatMap((g) => g.itens).map((item) => (
              <NavLink
                key={item.para}
                to={item.para}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground',
                    isActive && 'bg-accent font-medium text-accent-foreground',
                  )
                }
              >
                {item.rotulo}
                <Marcador nivel={nivelDoItem(item, r.avisos)} />
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** Carrega a simulação da rota e monta o simulador em volta das telas. */
export function SimuladorLayout() {
  const { id } = useParams()
  const [estado, setEstado] = useState<{ id?: string; simulacao?: Simulacao | null; erro?: string }>({})

  useEffect(() => {
    if (!id) return
    let ativo = true
    repositorio
      .obter(id)
      .then((simulacao) => ativo && setEstado({ id, simulacao }))
      .catch((e: Error) => ativo && setEstado({ id, erro: e.message }))
    return () => {
      ativo = false
    }
  }, [id])

  if (estado.id !== id) return <Carregando texto="Abrindo a simulação…" />
  if (estado.erro || !estado.simulacao) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="font-medium">
          {estado.erro ? 'Não foi possível abrir a simulação.' : 'Simulação não encontrada.'}
        </p>
        {estado.erro && <p className="text-sm text-muted-foreground">{estado.erro}</p>}
        <Button asChild variant="outline">
          <Link to="/simulacoes">Voltar para as simulações</Link>
        </Button>
      </div>
    )
  }
  return (
    <SimuladorProvider key={estado.simulacao.id} simulacao={estado.simulacao}>
      <Casca />
    </SimuladorProvider>
  )
}
