import {
  CampoRotulado,
  GradeCampos,
  ListaAvisos,
  ListaValores,
  Pagina,
  Secao,
  SeloOcupacao,
  Seletor,
  Valor,
} from '@/components/apresentacao'
import { CampoEntrada } from '@/features/simulador/campo-entrada'
import { OPCOES_LIGADO, OPCOES_VAPOR_DIFUSOR, situacaoDe } from '@/features/simulador/opcoes'
import { useSimulador } from '@/features/simulador/simulador-provider'
import { num } from '@/lib/formato'

export function ExtracaoDestilaria() {
  const { entradas: e, resultado: r, alterar } = useSimulador()
  const x = r.extracao
  const aq = x.aquecedorDifusor
  const ligado = (v: boolean) => (v ? 'sim' : 'nao')

  return (
    <Pagina
      titulo="Extração e destilaria"
      descricao="Consumidores de vapor vegetal fora da fábrica de açúcar. Entram no balanço da evaporação como sangrias de V1 e V2."
    >
      <ListaAvisos avisos={r.avisos.filter((a) => a.setor === 'Extração' || a.setor === 'Destilaria')} />

      <Secao
        titulo="Extração (difusor)"
        descricao="Se a unidade usa moenda, zere os captadores e deixe os aquecimentos em Parado."
      >
        <GradeCampos>
          <CampoEntrada caminho="extracao.capacidadeNominal" rotulo="Capacidade nominal de moagem" unidade="tch" />
          <CampoRotulado rotulo="Ocupação da moagem">
            <span className="flex h-9 items-center">
              <SeloOcupacao {...situacaoDe(e.cana.moagemTch, e.extracao.capacidadeNominal)} />
            </span>
          </CampoRotulado>
        </GradeCampos>

        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
          <div className="grid content-start gap-4">
            <h3 className="text-sm font-medium">Captadores com vapor direto</h3>
            <GradeCampos className="md:grid-cols-2 xl:grid-cols-2">
              <CampoEntrada caminho="extracao.captadores.quantidade" rotulo="Captadores com vapor aberto" unidade="un" />
              <CampoEntrada caminho="extracao.captadores.vazaoPorCaptador" rotulo="Vazão por captador" unidade="m³/h" />
              <CampoEntrada caminho="extracao.captadores.tEntrada" rotulo="Temperatura de entrada" unidade="°C" />
              <CampoEntrada caminho="extracao.captadores.tSaida" rotulo="Temperatura de saída" unidade="°C" />
              <CampoRotulado rotulo="Vapor">
                <Seletor
                  rotulo="Captadores: vapor"
                  valor={e.extracao.captadores.vapor}
                  opcoes={OPCOES_VAPOR_DIFUSOR}
                  aoMudar={(v) => alterar((d) => void (d.extracao.captadores.vapor = v))}
                  className="h-9 w-full"
                />
              </CampoRotulado>
            </GradeCampos>
            <ListaValores>
              <Valor rotulo="Vapor nos captadores (soma ao caldo)" valor={num(x.vaporCaptadores, 1)} unidade="t/h" destaque />
            </ListaValores>
          </div>

          <div className="grid content-start gap-4">
            <h3 className="text-sm font-medium">Aquecimento do caldo misto</h3>
            <GradeCampos className="md:grid-cols-2 xl:grid-cols-2">
              <CampoEntrada caminho="extracao.aquecimentoCaldoMisto.tSaida" rotulo="Temperatura de saída" unidade="°C" />
              <CampoRotulado rotulo="Vapor">
                <Seletor
                  rotulo="Aquecimento do caldo misto: vapor"
                  valor={e.extracao.aquecimentoCaldoMisto.vapor}
                  opcoes={OPCOES_VAPOR_DIFUSOR}
                  aoMudar={(v) => alterar((d) => void (d.extracao.aquecimentoCaldoMisto.vapor = v))}
                  className="h-9 w-full"
                />
              </CampoRotulado>
            </GradeCampos>
            <ListaValores>
              <Valor
                rotulo={`Vapor (de ${num(e.extracao.tempCaldoMisto, 0)} °C até a saída)`}
                valor={num(x.vaporAquecimentoCaldoMisto, 1)}
                unidade="t/h"
                destaque
              />
            </ListaValores>
          </div>

          <div className="grid content-start gap-4">
            <h3 className="text-sm font-medium">Aquecedor de caldo do difusor</h3>
            <GradeCampos className="md:grid-cols-2 xl:grid-cols-2">
              <CampoEntrada caminho="extracao.aquecedorDifusor.tEntrada" rotulo="Temperatura de entrada" unidade="°C" />
              <CampoEntrada caminho="extracao.aquecedorDifusor.tSaida" rotulo="Temperatura de saída" unidade="°C" />
              <CampoEntrada caminho="extracao.aquecedorDifusor.secao" rotulo="Seção de passagem" unidade="m²" />
              <CampoEntrada caminho="extracao.aquecedorDifusor.areaInstalada" rotulo="Área instalada" unidade="m²" />
              <CampoRotulado rotulo="Vapor">
                <Seletor
                  rotulo="Aquecedor do difusor: vapor"
                  valor={e.extracao.aquecedorDifusor.vapor}
                  opcoes={OPCOES_VAPOR_DIFUSOR}
                  aoMudar={(v) => alterar((d) => void (d.extracao.aquecedorDifusor.vapor = v))}
                  className="h-9 w-full"
                />
              </CampoRotulado>
              <CampoRotulado rotulo="Ocupação">
                <span className="flex h-9 items-center">
                  <SeloOcupacao {...situacaoDe(aq.area, aq.areaInstalada)} />
                </span>
              </CampoRotulado>
            </GradeCampos>
            <ListaValores>
              <Valor rotulo="Área necessária" valor={aq.inviavel ? 'inviável' : num(aq.area, 0)} unidade="m²" destaque />
              <Valor rotulo="Velocidade" valor={num(aq.velocidade, 2)} unidade="m/s" />
              <Valor rotulo="K" valor={num(aq.k, 0)} unidade="kcal/m²·h·°C" />
              <Valor rotulo="Vapor" valor={num(aq.consumoVapor, 1)} unidade="t/h" />
            </ListaValores>
          </div>

          <div className="grid content-start gap-4">
            <h3 className="text-sm font-medium">Aquecimento da água de embebição</h3>
            <GradeCampos className="md:grid-cols-2 xl:grid-cols-2">
              <CampoEntrada caminho="extracao.embebicao.condensado" rotulo="Condensado na embebição" unidade="t/h" />
              <CampoEntrada caminho="extracao.embebicao.tCondensado" rotulo="Temperatura do condensado" unidade="°C" />
              <CampoEntrada caminho="extracao.embebicao.tFlegmaca" rotulo="Temperatura da flegmaça" unidade="°C" />
              <CampoEntrada caminho="extracao.embebicao.tAguaBruta" rotulo="Temperatura da água bruta" unidade="°C" />
              <CampoEntrada caminho="extracao.embebicao.tSaida" rotulo="Temperatura de saída" unidade="°C" />
              <CampoRotulado rotulo="Vapor">
                <Seletor
                  rotulo="Embebição: vapor"
                  valor={e.extracao.embebicao.vapor}
                  opcoes={OPCOES_VAPOR_DIFUSOR}
                  aoMudar={(v) => alterar((d) => void (d.extracao.embebicao.vapor = v))}
                  className="h-9 w-full"
                />
              </CampoRotulado>
            </GradeCampos>
            <ListaValores>
              <Valor rotulo="Flegmaça na embebição" valor={num(x.flegmaca, 1)} unidade="t/h" />
              <Valor rotulo="Temperatura da mistura" valor={num(x.tEmbebicao, 1)} unidade="°C" />
              <Valor rotulo="Vapor" valor={num(x.vaporEmbebicao, 1)} unidade="t/h" destaque />
            </ListaValores>
          </div>
        </div>
      </Secao>

      <Secao
        titulo="Destilaria"
        descricao="Consumo específico de vapor = 13,877 × °GL do vinho ^ −0,788 (t de vapor por m³). Todo o vapor da destilaria sai do V1."
      >
        <GradeCampos>
          <CampoEntrada caminho="etanol.capacidadeDestilaria" rotulo="Capacidade (hidratado equivalente)" unidade="m³/dia" />
          <CampoRotulado rotulo="Ocupação da destilaria">
            <span className="flex h-9 items-center">
              <SeloOcupacao
                {...situacaoDe(r.producao.hidratadoEquivalenteM3dia, e.etanol.capacidadeDestilaria)}
              />
            </span>
          </CampoRotulado>
          <CampoRotulado rotulo="Colunas A e B (cana)">
            <Seletor
              rotulo="Colunas A e B"
              valor={ligado(e.etanol.colunasABLigadas)}
              opcoes={OPCOES_LIGADO}
              aoMudar={(v) => alterar((d) => void (d.etanol.colunasABLigadas = v === 'sim'))}
              className="h-9 w-full"
            />
          </CampoRotulado>
          <CampoRotulado rotulo="Coluna C (anidro)">
            <Seletor
              rotulo="Coluna C"
              valor={ligado(e.etanol.colunaCLigada)}
              opcoes={OPCOES_LIGADO}
              aoMudar={(v) => alterar((d) => void (d.etanol.colunaCLigada = v === 'sim'))}
              className="h-9 w-full"
            />
          </CampoRotulado>
          <CampoEntrada caminho="etanol.consumoColunaC" rotulo="Consumo da coluna C" unidade="t/m³" />
          <CampoRotulado rotulo="Destilação do milho">
            <Seletor
              rotulo="Destilação do milho"
              valor={ligado(e.milho.destilacaoLigada)}
              opcoes={OPCOES_LIGADO}
              aoMudar={(v) => alterar((d) => void (d.milho.destilacaoLigada = v === 'sim'))}
              className="h-9 w-full"
            />
          </CampoRotulado>
        </GradeCampos>
        <ListaValores className="max-w-xl">
          <Valor rotulo="Consumo específico – cana" valor={num(r.destilacao.consumoEspecificoCana, 3)} unidade="t/m³" />
          <Valor rotulo="Vapor das colunas A e B" valor={num(r.destilacao.vaporCana, 1)} unidade="t/h" />
          <Valor rotulo="Vapor da coluna C" valor={num(r.destilacao.vaporColunaC, 1)} unidade="t/h" />
          <Valor rotulo="Consumo específico – milho" valor={num(r.destilacao.consumoEspecificoMilho, 3)} unidade="t/m³" />
          <Valor rotulo="Vapor da destilação do milho" valor={num(r.destilacao.vaporMilho, 1)} unidade="t/h" />
          <Valor rotulo="Total da destilaria (V1)" valor={num(r.destilacao.vaporTotal, 1)} unidade="t/h" destaque />
        </ListaValores>
      </Secao>
    </Pagina>
  )
}
