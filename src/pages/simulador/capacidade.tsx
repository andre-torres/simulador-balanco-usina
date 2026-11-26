import { ArrowDownToLine, CircleCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Indicador, ListaAvisos, Pagina, Secao, SeloOcupacao } from '@/components/apresentacao'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { reduzirAoLimite, type Entradas, type Setor } from '@/engine'
import { useSimulador } from '@/features/simulador/simulador-provider'
import { num, pct } from '@/lib/formato'

const SETORES: { setor: Setor; chave: keyof Entradas['limites'] }[] = [
  { setor: 'Extração', chave: 'extracao' },
  { setor: 'Tratamento de caldo', chave: 'tratamento' },
  { setor: 'Evaporação', chave: 'evaporacao' },
  { setor: 'Cozimento', chave: 'cozimento' },
  { setor: 'Destilaria', chave: 'destilaria' },
]

export function Capacidade() {
  const { entradas: e, resultado: r, alterar } = useSimulador()
  const cap = r.capacidade
  const limitante = cap.itens.find((i) => i.moagemMaxima !== null && i.moagemMaxima === cap.moagemMaxima)
  const maior = cap.itens.reduce((a, b) => ((b.ocupacao ?? 0) > (a.ocupacao ?? 0) ? b : a))

  function ajustar() {
    const ajustado = reduzirAoLimite(e)
    if (!ajustado) {
      toast.error('Reduzir a moagem não resolve este limite. Revise o equipamento ou o consumo que está acima.')
      return
    }
    alterar((d) => {
      d.cana.moagemTch = ajustado.cana.moagemTch
      d.caldo.caldoAcucar = ajustado.caldo.caldoAcucar
    })
    toast.success(
      `Moagem ajustada para ${num(ajustado.cana.moagemTch, 0)} tch e caldo para açúcar para ${num(ajustado.caldo.caldoAcucar, 1)} m³/h.`,
    )
  }

  return (
    <Pagina
      titulo="Capacidade dos equipamentos"
      descricao="Necessário é o que o balanço pede; instalado é o que você informou em cada tela. Com o limite do setor ligado, a maior ocupação do setor define a moagem máxima (estimativa proporcional: moagem ÷ ocupação, como na planilha)."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Indicador rotulo="Moagem informada" valor={num(e.cana.moagemTch, 0)} unidade="tch" />
        <Indicador
          rotulo="Maior ocupação"
          valor={num(cap.maiorOcupacao * 100, 0)}
          unidade="%"
          detalhe={maior.equipamento}
        />
        <Indicador
          rotulo="Moagem máxima estimada"
          valor={cap.moagemMaxima === null ? '–' : num(Math.floor(cap.moagemMaxima), 0)}
          unidade={cap.moagemMaxima === null ? undefined : 'tch'}
          detalhe={limitante ? `Limitada por: ${limitante.equipamento}` : 'Nenhum setor com limite ligado'}
        />
      </div>

      {cap.limiteExcedido && cap.moagemMaxima !== null ? (
        <Alert variant="destructive">
          <ArrowDownToLine />
          <AlertTitle>Moagem acima do limite dos setores ligados</AlertTitle>
          <AlertDescription>
            <p>
              A moagem de {num(e.cana.moagemTch, 0)} tch passa da máxima estimada de{' '}
              {num(Math.floor(cap.moagemMaxima), 0)} tch. O ajuste reduz a moagem e o caldo para açúcar na mesma
              proporção, mantendo o mix, até nenhum equipamento dos setores ligados passar de 100%.
            </p>
            <Button size="sm" variant="destructive" className="mt-1" onClick={ajustar}>
              Ajustar moagem e caldo ao limite
            </Button>
          </AlertDescription>
        </Alert>
      ) : cap.moagemMaxima !== null ? (
        <Alert>
          <CircleCheck />
          <AlertTitle>Dentro da capacidade dos setores com limite ligado</AlertTitle>
        </Alert>
      ) : (
        <ListaAvisos avisos={r.avisos.filter((a) => a.nivel === 'atencao')} />
      )}

      <Secao titulo="Limite por setor" descricao="Desligado: só mostra a ocupação. Ligado: o setor entra no cálculo da moagem máxima.">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {SETORES.map(({ setor, chave }) => (
            <div key={chave} className="flex items-center gap-2">
              <Switch
                id={`limite-${chave}`}
                checked={e.limites[chave]}
                onCheckedChange={(v) => alterar((d) => void (d.limites[chave] = v))}
              />
              <Label htmlFor={`limite-${chave}`} className="font-normal">
                {setor}
              </Label>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Necessário × instalado">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Setor</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead className="text-right">Necessário</TableHead>
              <TableHead className="text-right">Instalado</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Ocupação</TableHead>
              <TableHead className="text-right">Moagem máx. (tch)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cap.itens.map((item, i) => (
              <TableRow key={item.equipamento}>
                <TableCell className="text-muted-foreground">
                  {i === 0 || cap.itens[i - 1].setor !== item.setor ? item.setor : ''}
                </TableCell>
                <TableCell className="font-medium">{item.equipamento}</TableCell>
                <TableCell className="num text-right">{num(item.necessario, 1)}</TableCell>
                <TableCell className="num text-right">{num(item.instalado, 0)}</TableCell>
                <TableCell className="text-muted-foreground">{item.unidade}</TableCell>
                <TableCell className="text-right">
                  <SeloOcupacao ocupacao={item.ocupacao} situacao={item.situacao} />
                </TableCell>
                <TableCell className="text-right">
                  {item.moagemMaxima === null ? (
                    <span className="text-xs text-muted-foreground">{item.limiteAtivo ? '–' : 'limite desligado'}</span>
                  ) : (
                    <span className="num">{num(Math.floor(item.moagemMaxima), 0)}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">
          Faixas: até {pct(0.9)} ok · de {pct(0.9)} a {pct(1)} atenção · acima de {pct(1)} acima da capacidade.
        </p>
      </Secao>
    </Pagina>
  )
}
