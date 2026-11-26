import { Indicador, ListaAvisos, ListaValores, Pagina, Secao, Valor } from '@/components/apresentacao'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSimulador } from '@/features/simulador/simulador-provider'
import { num, pct } from '@/lib/formato'

export function Producao() {
  const { entradas: e, resultado: r } = useSimulador()
  const p = r.producao
  const artPerdido = p.artEntrada - p.artAcucar - p.artHidratado - p.artAnidro
  const linhasArt = [
    { nome: 'Açúcar', kg: p.artAcucar },
    { nome: 'Etanol hidratado', kg: p.artHidratado },
    { nome: 'Etanol anidro', kg: p.artAnidro },
    { nome: 'Perdas (extração, tratamento, fermentação, destilação, indeterminadas)', kg: artPerdido },
  ]

  return (
    <Pagina
      titulo="Produção de açúcar e etanol"
      descricao="Açúcar pelo balanço de sólidos do cozimento (fórmula SJM). Etanol pelas eficiências, com o ART que não foi para o açúcar."
    >
      <ListaAvisos avisos={r.avisos.filter((a) => a.setor === 'Balanço' || a.setor === 'Destilaria')} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Açúcar"
          valor={num(p.acucarTdia, 0)}
          unidade="t/dia"
          detalhe={`${num(p.acucarTh, 1)} t/h · ${num(p.acucarSacasDia, 0)} sacas/dia`}
        />
        <Indicador
          rotulo="Etanol hidratado"
          valor={num(p.hidratadoM3dia, 0)}
          unidade="m³/dia"
          detalhe={`${num(p.hidratadoM3dia / 24, 1)} m³/h`}
        />
        <Indicador
          rotulo="Etanol anidro"
          valor={num(p.anidroM3dia, 0)}
          unidade="m³/dia"
          detalhe="Valor digitado nos dados primários"
        />
        <Indicador
          rotulo="Mix para açúcar"
          valor={num(p.mixAcucar * 100, 1)}
          unidade="% do ART recuperado"
          detalhe={`${num(p.moagemAcucarTch, 0)} tch açúcar · ${num(p.moagemEtanolTch, 0)} tch etanol`}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Secao titulo="Volumes na safra" descricao={`${num(r.balanco.diasSafra, 1)} dias de safra a ${num(r.balanco.moagemTcd, 0)} t de cana por dia.`}>
          <ListaValores>
            <Valor rotulo="Açúcar" valor={num(p.acucarSafra, 0)} unidade="t" destaque />
            <Valor rotulo="Açúcar" valor={num((p.acucarSafra * 1000) / e.premissas.kgPorSaca, 0)} unidade="sacas" />
            <Valor rotulo="Etanol de cana (hidratado + anidro)" valor={num(p.etanolSafra, 0)} unidade="m³" destaque />
            <Valor rotulo="Hidratado equivalente por dia" valor={num(p.hidratadoEquivalenteM3dia, 0)} unidade="m³/dia" />
            <Valor rotulo="Etanol de milho (hidratado)" valor={num(p.etanolMilhoM3dia, 0)} unidade="m³/dia" />
          </ListaValores>
        </Secao>

        <Secao titulo="Eficiência">
          <ListaValores>
            <Valor rotulo="Recuperação de ART" valor={num(p.recuperacaoArt, 2)} unidade="%" destaque />
            <Valor rotulo="RTC" valor={num(p.rtc, 2)} unidade="%" />
            <Valor rotulo="SJM (recuperação no cozimento)" valor={num(r.cozimento.sjm * 100, 2)} unidade="%" />
            <Valor rotulo="ART da cana" valor={num(r.balanco.artCana, 2)} unidade="%" />
            <Valor rotulo="ART do caldo misto" valor={num(r.balanco.artCaldoMisto, 2)} unidade="%" />
            <Valor rotulo="Pol do caldo misto" valor={num(r.balanco.polCaldoMisto, 2)} unidade="%" />
          </ListaValores>
        </Secao>

        <Secao titulo="Destino do ART" descricao="Em quilos de ART por dia.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destino</TableHead>
                <TableHead className="text-right">kg/dia</TableHead>
                <TableHead className="text-right">% do ART da cana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhasArt.map((l) => (
                <TableRow key={l.nome}>
                  <TableCell className="whitespace-normal">{l.nome}</TableCell>
                  <TableCell className="num text-right">{num(l.kg, 0)}</TableCell>
                  <TableCell className="num text-right">{pct(l.kg / p.artEntrada, 1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>ART que entra com a cana</TableCell>
                <TableCell className="num text-right">{num(p.artEntrada, 0)}</TableCell>
                <TableCell className="num text-right">100,0%</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Secao>

        <Secao titulo="Caldo, xarope e mel">
          <ListaValores>
            <Valor rotulo="Caldo misto total" valor={num(r.balanco.caldoTotalTh, 1)} unidade="t/h" />
            <Valor rotulo="Caldo para açúcar" valor={num(r.balanco.caldoAcucarTh, 1)} unidade="t/h" />
            <Valor rotulo="Caldo para etanol" valor={num(r.balanco.caldoEtanolTh, 1)} unidade="t/h" />
            <Valor rotulo="Caldo para etanol" valor={num(r.balanco.caldoEtanolM3h, 1)} unidade="m³/h" />
            <Valor rotulo="Xarope" valor={num(r.evaporacao.xaropeTh, 1)} unidade="t/h" />
            <Valor rotulo="Mel final" valor={num(r.cozimento.melFinalM3h, 1)} unidade="m³/h" />
            <Valor rotulo="Bagaço" valor={num(r.balanco.bagacoTh, 1)} unidade="t/h" />
          </ListaValores>
        </Secao>
      </div>
    </Pagina>
  )
}
