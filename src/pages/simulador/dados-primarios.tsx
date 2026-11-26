import { GradeCampos, ListaAvisos, ListaValores, Pagina, Secao, Valor } from '@/components/apresentacao'
import { CampoEntrada } from '@/features/simulador/campo-entrada'
import { useSimulador } from '@/features/simulador/simulador-provider'
import { num } from '@/lib/formato'

export function DadosPrimarios() {
  const { resultado: r } = useSimulador()

  return (
    <Pagina
      titulo="Dados primários"
      descricao="Digite os dados da cana, do caldo e as eficiências. A produção e o dimensionamento dos equipamentos são recalculados a cada alteração."
    >
      <ListaAvisos avisos={r.avisos.filter((a) => a.setor === 'Balanço')} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-6">
          <Secao titulo="Cana e moagem">
            <GradeCampos>
              <CampoEntrada
                rotulo="Moagem horária"
                unidade="tch"
                caminho="cana.moagemTch"
              />
              <CampoEntrada
                rotulo="Disponibilidade"
                unidade="%"
                caminho="cana.disponibilidade"
              />
              <CampoEntrada
                rotulo="Moagem da safra"
                unidade="t"
                caminho="cana.moagemSafra"
              />
              <CampoEntrada
                rotulo="Fibra da cana"
                unidade="%"
                caminho="cana.fibra"
              />
              <CampoEntrada
                rotulo="PC da cana"
                unidade="%"
                caminho="cana.pc"
              />
              <CampoEntrada
                rotulo="AR da cana"
                unidade="%"
                caminho="cana.ar"
              />
              <CampoEntrada
                rotulo="Embebição"
                unidade="% fibra"
                caminho="cana.embebicaoFibra"
              />
            </GradeCampos>
          </Secao>

          <Secao titulo="Bagaço">
            <GradeCampos>
              <CampoEntrada
                rotulo="Umidade do bagaço"
                unidade="%"
                caminho="bagaco.umidade"
              />
              <CampoEntrada
                rotulo="Pol do bagaço"
                unidade="%"
                caminho="bagaco.pol"
              />
              <CampoEntrada
                rotulo="Pureza do caldo do último terno"
                unidade="%"
                caminho="bagaco.purezaUltimoTerno"
              />
            </GradeCampos>
          </Secao>

          <Secao
            titulo="Caldo"
            descricao="O caldo para açúcar define o tamanho da fábrica de açúcar; o restante do caldo misto segue para etanol."
          >
            <GradeCampos>
              <CampoEntrada
                rotulo="Caldo decantado para açúcar"
                unidade="m³/h"
                caminho="caldo.caldoAcucar"
                dica={`O caldo total comporta até ${num(Math.floor(r.balanco.caldoAcucarMaximo), 0)} m³/h.`}
              />
              <CampoEntrada
                rotulo="Brix do caldo misto"
                unidade="%"
                caminho="caldo.brixMisto"
              />
              <CampoEntrada
                rotulo="Pureza do caldo misto"
                unidade="%"
                caminho="caldo.purezaMisto"
              />
              <CampoEntrada
                rotulo="Temperatura do caldo misto"
                unidade="°C"
                caminho="extracao.tempCaldoMisto"
              />
              <CampoEntrada
                rotulo="Lodo"
                unidade="% cana"
                caminho="caldo.lodo"
              />
              <CampoEntrada
                rotulo="Brix do caldo decantado"
                unidade="%"
                caminho="tratamento.decantado.brix"
              />
              <CampoEntrada
                rotulo="Brix do xarope"
                unidade="%"
                caminho="evaporacao.brixXarope"
              />
              <CampoEntrada
                rotulo="Pureza do xarope"
                unidade="%"
                caminho="cozimento.purezaXarope"
              />
              <CampoEntrada
                rotulo="Pureza do mel final"
                unidade="%"
                caminho="cozimento.melFinal.pureza"
              />
            </GradeCampos>
          </Secao>

          <Secao titulo="Eficiências e etanol">
            <GradeCampos>
              <CampoEntrada
                rotulo="Extração"
                unidade="%"
                caminho="eficiencias.extracao"
              />
              <CampoEntrada
                rotulo="Tratamento de caldo"
                unidade="%"
                caminho="eficiencias.tratamento"
              />
              <CampoEntrada
                rotulo="Rendimento da fermentação"
                unidade="%"
                caminho="eficiencias.fermentacao"
              />
              <CampoEntrada
                rotulo="Destilação"
                unidade="%"
                caminho="eficiencias.destilacao"
              />
              <CampoEntrada
                rotulo="Perdas indeterminadas"
                unidade="%"
                caminho="eficiencias.perdasIndeterminadas"
              />
              <CampoEntrada
                rotulo="Produção de anidro"
                unidade="m³/dia"
                caminho="etanol.anidro"
                dica="O hidratado é calculado com o ART que sobra."
              />
              <CampoEntrada
                rotulo="Teor do vinho bruto"
                unidade="°GL"
                caminho="etanol.glVinho"
              />
            </GradeCampos>
          </Secao>

          <Secao
            titulo="Planta de milho"
            descricao="Opcional. Entra no balanço como consumidora de vapor V1. Deixe a moagem em zero se a unidade não processa milho."
          >
            <GradeCampos>
              <CampoEntrada
                rotulo="Moagem de milho"
                unidade="t/dia"
                caminho="milho.moagem"
              />
              <CampoEntrada
                rotulo="Rendimento em hidratado"
                unidade="L/t"
                caminho="milho.rendimento"
              />
              <CampoEntrada
                rotulo="Teor do vinho"
                unidade="°GL"
                caminho="milho.glVinho"
              />
              <CampoEntrada
                rotulo="Consumo de vapor V1"
                unidade="kg/t"
                caminho="milho.vaporV1"
              />
            </GradeCampos>
          </Secao>
        </div>

        <aside className="grid gap-6 lg:sticky lg:top-4">
          <Secao titulo="Produção calculada">
            <ListaValores>
              <Valor rotulo="Açúcar" valor={num(r.producao.acucarTdia, 0)} unidade="t/dia" destaque />
              <Valor rotulo="Açúcar" valor={num(r.producao.acucarSacasDia, 0)} unidade="sc/dia" />
              <Valor rotulo="Etanol hidratado" valor={num(r.producao.hidratadoM3dia, 0)} unidade="m³/dia" destaque />
              <Valor rotulo="Etanol anidro" valor={num(r.producao.anidroM3dia, 0)} unidade="m³/dia" />
              <Valor rotulo="Mix para açúcar" valor={num(r.producao.mixAcucar * 100, 1)} unidade="%" />
              <Valor rotulo="Recuperação de ART" valor={num(r.producao.recuperacaoArt, 2)} unidade="%" />
            </ListaValores>
          </Secao>
          <Secao titulo="Balanço da cana">
            <ListaValores>
              <Valor rotulo="Moagem diária" valor={num(r.balanco.moagemTcd, 0)} unidade="tcd" />
              <Valor rotulo="Dias de safra" valor={num(r.balanco.diasSafra, 1)} unidade="dias" />
              <Valor rotulo="ART da cana" valor={num(r.balanco.artCana, 2)} unidade="%" />
              <Valor rotulo="Água de embebição" valor={num(r.balanco.aguaEmbebicao, 1)} unidade="t/h" />
              <Valor rotulo="Bagaço" valor={num(r.balanco.bagacoTh, 1)} unidade="t/h" />
              <Valor rotulo="Caldo misto total" valor={num(r.balanco.caldoTotalTh, 1)} unidade="t/h" />
              <Valor rotulo="Caldo para açúcar" valor={num(r.balanco.caldoAcucarTh, 1)} unidade="t/h" />
              <Valor rotulo="Caldo para etanol" valor={num(r.balanco.caldoEtanolTh, 1)} unidade="t/h" />
            </ListaValores>
          </Secao>
        </aside>
      </div>
    </Pagina>
  )
}
