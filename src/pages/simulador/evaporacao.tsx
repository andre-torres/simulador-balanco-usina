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
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { EfeitoEvaporacao } from '@/engine'
import { CampoEntrada } from '@/features/simulador/campo-entrada'
import { situacaoDe } from '@/features/simulador/opcoes'
import { useSimulador } from '@/features/simulador/simulador-provider'
import { num } from '@/lib/formato'

export function Evaporacao() {
  const { entradas: e, resultado: r, alterar } = useSimulador()
  const ev = r.evaporacao
  const mudarEfeito = (i: number, mudanca: (f: EfeitoEvaporacao) => void) =>
    alterar((d) => mudanca(d.evaporacao.efeitos[i]))
  const mudarPressao = (i: number, v: number) => alterar((d) => void (d.evaporacao.pressoes[i] = v))

  return (
    <Pagina
      titulo="Evaporação"
      descricao="Método abreviado: 1 kg de vapor por kg de água evaporada. A área necessária de cada efeito é a evaporação dividida pela taxa máxima informada."
    >
      <ListaAvisos avisos={r.avisos.filter((a) => a.setor === 'Evaporação')} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Água evaporada"
          valor={num(ev.evaporadoTotal, 1)}
          unidade="t/h"
          detalhe={`Caldo ${num(ev.caldoEntrada, 1)} t/h a ${num(ev.brixEntrada, 2)} °Bx`}
        />
        <Indicador
          rotulo="Vapor de escape no 1º efeito"
          valor={num(ev.vaporEscape, 1)}
          unidade="t/h"
          detalhe={`${num((ev.vaporEscape / e.cana.moagemTch) * 1000, 0)} kg por t de cana`}
        />
        <Indicador
          rotulo="Área necessária"
          valor={num(ev.areaNecessariaTotal, 0)}
          unidade="m²"
          detalhe={`Instalada: ${num(ev.areaInstaladaTotal, 0)} m²`}
        />
        <Indicador
          rotulo="Xarope"
          valor={num(ev.xaropeTh, 1)}
          unidade="t/h"
          detalhe={`${num(ev.xaropeBrix, 2)} °Bx · ${num(ev.xaropeTemperatura, 1)} °C`}
        />
      </div>

      <Secao titulo="Condições de operação">
        <GradeCampos>
          <CampoRotulado rotulo="Efeitos em operação">
            <Seletor
              rotulo="Efeitos em operação"
              valor={String(e.evaporacao.numeroEfeitos) as '5' | '6'}
              opcoes={[
                { valor: '5', rotulo: '5 efeitos' },
                { valor: '6', rotulo: '6 efeitos' },
              ]}
              aoMudar={(v) => alterar((d) => void (d.evaporacao.numeroEfeitos = v === '6' ? 6 : 5))}
              className="h-9 w-full"
            />
          </CampoRotulado>
          <CampoEntrada caminho="evaporacao.pressaoEscape" rotulo="Pressão do vapor de escape" unidade="kgf/cm²" />
          <CampoEntrada caminho="evaporacao.vacuo" rotulo="Vácuo no último corpo" unidade="polHg" />
          <CampoEntrada caminho="evaporacao.brixXarope" rotulo="Brix do xarope" unidade="%" />
          <CampoEntrada caminho="evaporacao.tAguaEntrada" rotulo="Água do condensador: entrada" unidade="°C" />
          <CampoEntrada caminho="evaporacao.tAguaSaida" rotulo="Água do condensador: saída" unidade="°C" />
        </GradeCampos>
      </Secao>

      <Secao
        titulo="Efeitos"
        descricao="Pressão manométrica do vapor vegetal gerado em cada efeito (negativo = vácuo). O último corpo usa o vácuo informado acima."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Efeito</TableHead>
              <TableHead>Pressão (kgf/cm²)</TableHead>
              <TableHead className="text-right">T vapor (°C)</TableHead>
              <TableHead className="text-right">Evaporado (t/h)</TableHead>
              <TableHead className="text-right">Sangria (t/h)</TableHead>
              <TableHead className="text-right">Brix saída</TableHead>
              <TableHead>Caixas</TableHead>
              <TableHead>Área por caixa (m²)</TableHead>
              <TableHead className="text-right">Taxa (kg/m²·h)</TableHead>
              <TableHead>Taxa máx.</TableHead>
              <TableHead className="text-right">Área necessária (m²)</TableHead>
              <TableHead className="text-right">Ocupação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ev.efeitos.map((f, i) => {
              const cfg = e.evaporacao.efeitos[i]
              const ultimo = i === ev.efeitos.length - 1
              return (
                <TableRow key={f.numero}>
                  <TableCell className="font-medium">{f.numero}º</TableCell>
                  <TableCell>
                    {ultimo ? (
                      <span className="num text-muted-foreground">{num(f.pressaoAbs - 1, 2)} (vácuo)</span>
                    ) : (
                      <NumeroCelula
                        rotulo={`${f.numero}º efeito: pressão do vapor vegetal`}
                        valor={e.evaporacao.pressoes[i]}
                        aoMudar={(v) => v !== null && mudarPressao(i, v)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="num text-right">{num(f.temperatura, 1)}</TableCell>
                  <TableCell className="num text-right">{num(f.evaporado, 1)}</TableCell>
                  <TableCell className="num text-right">{f.sangria > 0 ? num(f.sangria, 1) : '–'}</TableCell>
                  <TableCell className="num text-right">{num(f.brixSaida, 2)}</TableCell>
                  <TableCell>
                    <NumeroCelula
                      rotulo={`${f.numero}º efeito: número de caixas`}
                      valor={cfg.caixas}
                      aoMudar={(v) => v !== null && mudarEfeito(i, (x) => void (x.caixas = v))}
                      className="w-16"
                    />
                  </TableCell>
                  <TableCell>
                    <NumeroCelula
                      rotulo={`${f.numero}º efeito: área por caixa`}
                      valor={cfg.areaPorCaixa}
                      aoMudar={(v) => v !== null && mudarEfeito(i, (x) => void (x.areaPorCaixa = v))}
                    />
                  </TableCell>
                  <TableCell className="num text-right">{num(f.taxa, 1)}</TableCell>
                  <TableCell>
                    <NumeroCelula
                      rotulo={`${f.numero}º efeito: taxa máxima de evaporação`}
                      valor={cfg.taxaMaxima}
                      aoMudar={(v) => v !== null && mudarEfeito(i, (x) => void (x.taxaMaxima = v))}
                      className="w-16"
                    />
                  </TableCell>
                  <TableCell className="num text-right font-semibold">{num(f.areaNecessaria, 0)}</TableCell>
                  <TableCell className="text-right">
                    <SeloOcupacao {...situacaoDe(f.taxa, f.taxaMaxima)} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="num text-right">{num(ev.evaporadoTotal, 1)}</TableCell>
              <TableCell colSpan={6} className="text-right text-xs font-normal text-muted-foreground">
                Instalada: {num(ev.areaInstaladaTotal, 0)} m²
              </TableCell>
              <TableCell className="num text-right">{num(ev.areaNecessariaTotal, 0)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </Secao>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Secao
          titulo="Sangrias de vapor vegetal"
          descricao="Quem consome o vapor de cada efeito, em t/h. A extração e a destilaria são configuradas na tela Extração e destilaria."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumidor</TableHead>
                <TableHead className="text-right">V1</TableHead>
                <TableHead className="text-right">V2</TableHead>
                <TableHead className="text-right">V3</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ev.sangrias.map((s) => (
                <TableRow key={s.consumidor}>
                  <TableCell>{s.consumidor}</TableCell>
                  <TableCell className="num text-right">{s.V1 > 0 ? num(s.V1, 1) : '–'}</TableCell>
                  <TableCell className="num text-right">{s.V2 > 0 ? num(s.V2, 1) : '–'}</TableCell>
                  <TableCell className="num text-right">{s.V3 > 0 ? num(s.V3, 1) : '–'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="num text-right">{num(ev.sangriaTotal.V1, 1)}</TableCell>
                <TableCell className="num text-right">{num(ev.sangriaTotal.V2, 1)}</TableCell>
                <TableCell className="num text-right">{num(ev.sangriaTotal.V3, 1)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Secao>

        <Secao titulo="Condensador">
          <ListaValores>
            <Valor rotulo="Vapor do último efeito" valor={num(ev.vaporCondensador, 1)} unidade="t/h" />
            <Valor rotulo="Água para o condensador" valor={num(ev.aguaCondensador, 0)} unidade="m³/h" destaque />
            <Valor rotulo="Temperatura do xarope" valor={num(ev.xaropeTemperatura, 1)} unidade="°C" />
          </ListaValores>
        </Secao>
      </div>
    </Pagina>
  )
}
