import type { ReactNode } from 'react'

import { NumeroCelula } from '@/components/campo-numero'
import {
  CampoRotulado,
  GradeCampos,
  Indicador,
  ListaAvisos,
  Pagina,
  Secao,
  SeloOcupacao,
  Seletor,
} from '@/components/apresentacao'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Aquecedor, Entradas, GrupoAquecimento, ResultadoAquecedor } from '@/engine'
import { CampoEntrada } from '@/features/simulador/campo-entrada'
import { OPCOES_VAPOR, situacaoDe } from '@/features/simulador/opcoes'
import { useSimulador } from '@/features/simulador/simulador-provider'
import { num } from '@/lib/formato'

type GrupoEditavel = 'fase1' | 'fase2' | 'caldoEtanol'

function CabecalhoAquecedores() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Aquecedor</TableHead>
        <TableHead>Vapor</TableHead>
        <TableHead>Entrada (°C)</TableHead>
        <TableHead>Saída (°C)</TableHead>
        <TableHead className="text-right">T vapor (°C)</TableHead>
        <TableHead className="text-right">Veloc. (m/s)</TableHead>
        <TableHead className="text-right">K (kcal/m²·h·°C)</TableHead>
        <TableHead className="text-right">Vapor (t/h)</TableHead>
        <TableHead className="text-right">Área necessária (m²)</TableHead>
        <TableHead>Área instalada (m²)</TableHead>
        <TableHead className="text-right">Ocupação</TableHead>
      </TableRow>
    </TableHeader>
  )
}

function CelulasResultado({ a }: { a: ResultadoAquecedor }) {
  const parado = a.vapor === 'parado'
  return (
    <>
      <TableCell className="num text-right">{parado ? '–' : num(a.tVapor, 1)}</TableCell>
      <TableCell className="num text-right">{num(a.velocidade, 2)}</TableCell>
      <TableCell className="num text-right">{parado ? '–' : num(a.k, 0)}</TableCell>
      <TableCell className="num text-right">{parado ? '–' : num(a.consumoVapor, 2)}</TableCell>
      <TableCell className="num text-right font-semibold">
        {parado ? '–' : a.inviavel ? 'inviável' : num(a.area, 0)}
      </TableCell>
    </>
  )
}

function TabelaGrupo({
  grupo,
  chave,
  aquecedores,
  alterar,
}: {
  grupo: GrupoAquecimento
  chave: GrupoEditavel
  aquecedores: Aquecedor[]
  alterar: (mudanca: (rascunho: Entradas) => void) => void
}) {
  const mudar = (i: number, mudanca: (a: Aquecedor) => void) =>
    alterar((d) => mudanca(d.tratamento[chave].aquecedores[i]))

  return (
    <Table>
      <CabecalhoAquecedores />
      <TableBody>
        {grupo.aquecedores.map((a, i) => {
          const { ocupacao, situacao } = situacaoDe(a.area, a.areaInstalada)
          return (
            <TableRow key={a.nome}>
              <TableCell className="font-medium">{i + 1}</TableCell>
              <TableCell>
                <Seletor
                  rotulo={`${a.nome}: vapor`}
                  valor={a.vapor}
                  opcoes={OPCOES_VAPOR}
                  aoMudar={(v) => mudar(i, (x) => void (x.vapor = v))}
                />
              </TableCell>
              <TableCell>
                <NumeroCelula
                  rotulo={`${a.nome}: temperatura de entrada`}
                  valor={aquecedores[i].tEntrada}
                  vazio={`${num(a.tEntrada, 1)} (anterior)`}
                  aoMudar={(v) => mudar(i, (x) => void (x.tEntrada = v))}
                  className="w-28"
                />
              </TableCell>
              <TableCell>
                <NumeroCelula
                  rotulo={`${a.nome}: temperatura de saída`}
                  valor={a.tSaida}
                  aoMudar={(v) => v !== null && mudar(i, (x) => void (x.tSaida = v))}
                />
              </TableCell>
              <CelulasResultado a={a} />
              <TableCell>
                <NumeroCelula
                  rotulo={`${a.nome}: área instalada`}
                  valor={a.areaInstalada}
                  aoMudar={(v) => v !== null && mudar(i, (x) => void (x.areaInstalada = v))}
                />
              </TableCell>
              <TableCell className="text-right">
                <SeloOcupacao ocupacao={ocupacao} situacao={situacao} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={7}>Total do grupo</TableCell>
          <TableCell className="num text-right">{num(grupo.vaporTotal, 2)}</TableCell>
          <TableCell className="num text-right">{num(grupo.areaTotal, 0)}</TableCell>
          <TableCell colSpan={2} />
        </TableRow>
      </TableFooter>
    </Table>
  )
}

function Fluxo({ grupo, children }: { grupo: GrupoAquecimento; children?: ReactNode }) {
  return (
    <GradeCampos>
      <CampoRotulado rotulo="Vazão calculada">
        <span className="num flex h-9 items-center text-sm">
          {num(grupo.vazaoMassa, 1)} t/h · {num(grupo.vazaoVolume, 1)} m³/h
        </span>
      </CampoRotulado>
      {children}
    </GradeCampos>
  )
}

export function Aquecimento() {
  const { entradas: e, resultado: r, alterar } = useSimulador()
  const aq = r.aquecimento
  const dec = aq.decantado.aquecedores[0]
  const ocupacaoDec = situacaoDe(dec.area, dec.areaInstalada)

  return (
    <Pagina
      titulo="Aquecimento do caldo"
      descricao="Área de troca necessária em cada aquecedor, antes e depois do decantador. O K segue a eq. 9.18 de Rein: 7,0 × temperatura do vapor × (velocidade ÷ 1,8)^0,8."
    >
      <ListaAvisos avisos={r.avisos.filter((a) => a.setor === 'Tratamento de caldo')} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Antes do decantador"
          valor={num(aq.antesDecantador.area, 0)}
          unidade="m² necessários"
          detalhe={`${num(aq.antesDecantador.vapor, 1)} t/h de vapor vegetal`}
        />
        <Indicador
          rotulo="Após o decantador"
          valor={num(aq.aposDecantador.area, 0)}
          unidade="m² necessários"
          detalhe={`${num(aq.aposDecantador.vapor, 1)} t/h de vapor vegetal`}
        />
        <Indicador
          rotulo="Vapor vegetal V1"
          valor={num(r.vapor.tV1, 1)}
          unidade="°C"
          detalhe={`${num(e.evaporacao.pressoes[0], 2)} kgf/cm² man.`}
        />
        <Indicador
          rotulo="Vapor vegetal V2 · V3"
          valor={`${num(r.vapor.tV2, 1)} · ${num(r.vapor.tV3, 1)}`}
          unidade="°C"
          detalhe="Pressões na tela Evaporação"
        />
      </div>

      <h2 className="mt-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Antes do decantador
      </h2>

      <Secao
        titulo="Caldo misto – Fase 1"
        descricao="Deixe a entrada em branco para usar a saída do aquecedor anterior."
      >
        <Fluxo grupo={aq.fase1}>
          <CampoEntrada caminho="tratamento.fracaoFase1" rotulo="Caldo misto na Fase 1" unidade="%" />
          <CampoEntrada caminho="tratamento.fase1.tEntrada" rotulo="Temperatura de entrada" unidade="°C" />
          <CampoEntrada caminho="tratamento.fase1.linhas" rotulo="Linhas em paralelo" unidade="un" />
          <CampoEntrada caminho="tratamento.fase1.secao" rotulo="Seção de passagem por linha" unidade="m²" />
        </Fluxo>
        <TabelaGrupo grupo={aq.fase1} chave="fase1" aquecedores={e.tratamento.fase1.aquecedores} alterar={alterar} />
      </Secao>

      <Secao titulo="Caldo misto – Fase 2" descricao="Recebe o restante do caldo misto.">
        <Fluxo grupo={aq.fase2}>
          <CampoEntrada caminho="tratamento.fase2.tEntrada" rotulo="Temperatura de entrada" unidade="°C" />
          <CampoEntrada caminho="tratamento.fase2.secao" rotulo="Seção de passagem" unidade="m²" />
        </Fluxo>
        <TabelaGrupo grupo={aq.fase2} chave="fase2" aquecedores={e.tratamento.fase2.aquecedores} alterar={alterar} />
      </Secao>

      <Secao
        titulo="Caldo para etanol"
        descricao="Caldo misto que não vai para a fábrica de açúcar. Com os aquecedores parados não há consumo de vapor."
      >
        <Fluxo grupo={aq.caldoEtanol}>
          <CampoEntrada caminho="tratamento.caldoEtanol.temperatura" rotulo="Temperatura de entrada" unidade="°C" />
          <CampoEntrada caminho="tratamento.caldoEtanol.brix" rotulo="Brix" unidade="%" />
          <CampoEntrada caminho="tratamento.caldoEtanol.secao" rotulo="Seção de passagem" unidade="m²" />
        </Fluxo>
        <TabelaGrupo
          grupo={aq.caldoEtanol}
          chave="caldoEtanol"
          aquecedores={e.tratamento.caldoEtanol.aquecedores}
          alterar={alterar}
        />
      </Secao>

      <h2 className="mt-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Após o decantador
      </h2>

      <Secao
        titulo="Caldo decantado"
        descricao="Aquecedor entre o decantador e o primeiro efeito da evaporação, com vapor V1."
      >
        <Fluxo grupo={aq.decantado}>
          <CampoEntrada caminho="tratamento.decantado.temperatura" rotulo="Temperatura de entrada" unidade="°C" />
          <CampoEntrada caminho="tratamento.decantado.brix" rotulo="Brix" unidade="%" />
          <CampoEntrada caminho="tratamento.decantado.linhas" rotulo="Linhas em paralelo" unidade="un" />
          <CampoEntrada caminho="tratamento.decantado.secao" rotulo="Seção de passagem por linha" unidade="m²" />
        </Fluxo>
        <Table>
          <CabecalhoAquecedores />
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">1</TableCell>
              <TableCell>
                <Seletor
                  rotulo="Aquecedor de caldo decantado: vapor"
                  valor={e.tratamento.decantado.vapor}
                  opcoes={[
                    { valor: 'V1', rotulo: 'V1' },
                    { valor: 'parado', rotulo: 'Parado' },
                  ]}
                  aoMudar={(v) => alterar((d) => void (d.tratamento.decantado.vapor = v))}
                />
              </TableCell>
              <TableCell className="num">{num(dec.tEntrada, 1)}</TableCell>
              <TableCell>
                <NumeroCelula
                  rotulo="Aquecedor de caldo decantado: temperatura de saída"
                  valor={dec.tSaida}
                  aoMudar={(v) => v !== null && alterar((d) => void (d.tratamento.decantado.tSaida = v))}
                />
              </TableCell>
              <CelulasResultado a={dec} />
              <TableCell>
                <NumeroCelula
                  rotulo="Aquecedor de caldo decantado: área instalada"
                  valor={dec.areaInstalada}
                  aoMudar={(v) => v !== null && alterar((d) => void (d.tratamento.decantado.areaInstalada = v))}
                />
              </TableCell>
              <TableCell className="text-right">
                <SeloOcupacao {...ocupacaoDec} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Secao>
    </Pagina>
  )
}
