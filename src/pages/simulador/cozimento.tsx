import { NumeroCelula } from '@/components/campo-numero'
import {
  CampoRotulado,
  GradeCampos,
  Indicador,
  ListaAvisos,
  ListaValores,
  Pagina,
  Secao,
  SeloOcupacao,
  Seletor,
  Valor,
} from '@/components/apresentacao'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CorrenteCozimento } from '@/engine'
import { CampoEntrada } from '@/features/simulador/campo-entrada'
import { situacaoDe } from '@/features/simulador/opcoes'
import { useSimulador } from '@/features/simulador/simulador-provider'
import { num } from '@/lib/formato'

type Corrente = 'massaB' | 'magma' | 'semente' | 'melA' | 'melFinal'

const CORRENTES: { chave: Corrente; nome: string }[] = [
  { chave: 'massaB', nome: 'Massa B' },
  { chave: 'magma', nome: 'Magma B' },
  { chave: 'semente', nome: 'Semente' },
  { chave: 'melA', nome: 'Mel A' },
  { chave: 'melFinal', nome: 'Mel B (final)' },
]

export function Cozimento() {
  const { entradas: e, resultado: r, alterar } = useSimulador()
  const cz = r.cozimento
  const mudar = (chave: Corrente, mudanca: (c: CorrenteCozimento) => void) =>
    alterar((d) => mudanca(d.cozimento[chave]))

  const equipamentos = [
    {
      nome: 'Tachos de massa A',
      necessario: cz.massaA.volumeNecessario,
      instalado: e.cozimento.volumeTachosA,
      unidade: 'm³',
      detalhe: `${num(cz.massaA.massaVazao, 1)} t/h de massa × ${num(e.premissas.tempoCozimentoA, 1)} h`,
      aoMudar: (v: number) => alterar((d) => void (d.cozimento.volumeTachosA = v)),
    },
    {
      nome: 'Tachos de massa B',
      necessario: cz.massaB.volumeNecessario,
      instalado: e.cozimento.volumeTachosB,
      unidade: 'm³',
      detalhe: `${num(cz.massaB.massaVazao, 1)} t/h de massa × ${num(e.premissas.tempoCozimentoB, 1)} h`,
      aoMudar: (v: number) => alterar((d) => void (d.cozimento.volumeTachosB = v)),
    },
    {
      nome: 'Secador de açúcar',
      necessario: cz.acucar,
      instalado: e.cozimento.capacidadeSecador,
      unidade: 't/h',
      detalhe: 'Produção horária de açúcar',
      aoMudar: (v: number) => alterar((d) => void (d.cozimento.capacidadeSecador = v)),
    },
  ]

  return (
    <Pagina
      titulo="Cozimento"
      descricao="Balanço de sólidos em duas massas. Açúcar = pol do xarope × SJM ÷ pureza do açúcar. Volume de tachos pelo índice de tempo de cozimento (Rein, seção 15.3)."
    >
      <ListaAvisos avisos={r.avisos.filter((a) => a.setor === 'Cozimento')} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador rotulo="Açúcar" valor={num(cz.acucar, 1)} unidade="t/h" detalhe={`SJM ${num(cz.sjm * 100, 2)}%`} />
        <Indicador
          rotulo="Tachos de massa A"
          valor={num(cz.massaA.volumeNecessario, 0)}
          unidade="m³ necessários"
          detalhe={`Vapor: ${num(cz.massaA.vapor, 1)} t/h de V2`}
        />
        <Indicador
          rotulo="Tachos de massa B"
          valor={num(cz.massaB.volumeNecessario, 0)}
          unidade="m³ necessários"
          detalhe={`Vapor: ${num(cz.massaB.vapor, 1)} t/h de ${e.cozimento.vaporMassaB}`}
        />
        <Indicador
          rotulo="Mel final"
          valor={num(cz.melFinalM3h, 1)}
          unidade="m³/h"
          detalhe={`${num(cz.solidosMelFinal, 1)} t/h de sólidos`}
        />
      </div>

      <Secao titulo="Equipamentos" descricao="Necessário pelo balanço contra o instalado na unidade.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipamento</TableHead>
              <TableHead>Base</TableHead>
              <TableHead className="text-right">Necessário</TableHead>
              <TableHead>Instalado</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Ocupação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipamentos.map((eq) => (
              <TableRow key={eq.nome}>
                <TableCell className="font-medium">{eq.nome}</TableCell>
                <TableCell className="text-muted-foreground">{eq.detalhe}</TableCell>
                <TableCell className="num text-right font-semibold">{num(eq.necessario, 1)}</TableCell>
                <TableCell>
                  <NumeroCelula
                    rotulo={`${eq.nome}: instalado`}
                    valor={eq.instalado}
                    aoMudar={(v) => v !== null && eq.aoMudar(v)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{eq.unidade}</TableCell>
                <TableCell className="text-right">
                  <SeloOcupacao {...situacaoDe(eq.necessario, eq.instalado)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Secao>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Secao titulo="Purezas e Brix" descricao="Valores de operação de cada corrente.">
          <GradeCampos className="md:grid-cols-2 xl:grid-cols-3">
            <CampoEntrada caminho="cozimento.purezaXarope" rotulo="Pureza do xarope" unidade="%" />
            <CampoEntrada caminho="cozimento.brixMassaA" rotulo="Brix da massa A" unidade="%" />
            <CampoRotulado rotulo="Vapor da massa B">
              <Seletor
                rotulo="Vapor da massa B"
                valor={e.cozimento.vaporMassaB}
                opcoes={[
                  { valor: 'V2', rotulo: 'V2' },
                  { valor: 'V3', rotulo: 'V3' },
                ]}
                aoMudar={(v) => alterar((d) => void (d.cozimento.vaporMassaB = v))}
                className="h-9 w-full"
              />
            </CampoRotulado>
          </GradeCampos>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corrente</TableHead>
                <TableHead>Pureza (%)</TableHead>
                <TableHead>Brix (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CORRENTES.map((c) => (
                <TableRow key={c.chave}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    <NumeroCelula
                      rotulo={`${c.nome}: pureza`}
                      valor={e.cozimento[c.chave].pureza}
                      aoMudar={(v) => v !== null && mudar(c.chave, (x) => void (x.pureza = v))}
                    />
                  </TableCell>
                  <TableCell>
                    <NumeroCelula
                      rotulo={`${c.nome}: Brix`}
                      valor={e.cozimento[c.chave].brix}
                      aoMudar={(v) => v !== null && mudar(c.chave, (x) => void (x.brix = v))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Secao>

        <div className="grid gap-6">
          <Secao titulo="Massa A" descricao="Sólidos em t/h; vazões no Brix de cada corrente.">
            <ListaValores>
              <Valor rotulo="Xarope consumido (sólidos)" valor={num(cz.massaA.xaropeSolidos, 1)} unidade="t/h" />
              <Valor rotulo="Xarope consumido (vazão)" valor={num(cz.massaA.xaropeVazao, 1)} unidade="t/h" />
              <Valor rotulo="Magma B consumido (vazão)" valor={num(cz.massaA.magmaVazao, 1)} unidade="t/h" />
              <Valor rotulo="Massa A (sólidos)" valor={num(cz.massaA.massaSolidos, 1)} unidade="t/h" />
              <Valor rotulo="Mel A produzido (vazão)" valor={num(cz.massaA.melAVazao, 1)} unidade="t/h" />
              <Valor rotulo="Açúcar" valor={num(cz.acucar, 1)} unidade="t/h" destaque />
              <Valor rotulo="Água evaporada" valor={num(cz.massaA.aguaEvaporada, 1)} unidade="t/h" />
              <Valor rotulo="Vapor V2" valor={num(cz.massaA.vapor, 1)} unidade="t/h" destaque />
            </ListaValores>
          </Secao>

          <Secao titulo="Massa B">
            <ListaValores>
              <Valor rotulo="Semente (vazão)" valor={num(cz.massaB.sementeVazao, 1)} unidade="t/h" />
              <Valor rotulo="Xarope na semente (sólidos)" valor={num(cz.massaB.sementeXaropeSolidos, 1)} unidade="t/h" />
              <Valor rotulo="Mel A na semente (sólidos)" valor={num(cz.massaB.sementeMelASolidos, 1)} unidade="t/h" />
              <Valor rotulo="Mel A no cozimento (sólidos)" valor={num(cz.massaB.melASolidos, 1)} unidade="t/h" />
              <Valor rotulo="Massa B (sólidos)" valor={num(cz.massaB.massaSolidos, 1)} unidade="t/h" />
              <Valor rotulo="Magma B produzido (vazão)" valor={num(cz.massaB.magmaVazao, 1)} unidade="t/h" />
              <Valor rotulo="Mel final (vazão)" valor={num(cz.massaB.melFinalVazao, 1)} unidade="t/h" />
              <Valor rotulo="Água evaporada" valor={num(cz.massaB.aguaEvaporada, 1)} unidade="t/h" />
              <Valor rotulo={`Vapor ${e.cozimento.vaporMassaB}`} valor={num(cz.massaB.vapor, 1)} unidade="t/h" destaque />
            </ListaValores>
          </Secao>
        </div>
      </div>
    </Pagina>
  )
}
