import { describe, expect, it } from 'vitest'
import { calcular } from './calcular'
import { reduzirAoLimite } from './limite'
import { entradasPadrao } from './padroes'
import type { Resultado } from './tipos'
import planilha from './__fixtures__/planilha-v2.2.json'

/**
 * Compara o motor com os valores calculados pelo Excel na planilha
 * "Simulação Processo v2.2 (corrigida)". Cada linha liga um resultado do
 * motor à célula de origem. Tolerância relativa: 1e-9 (a meta do projeto é 0,5%).
 */
const valores = planilha as Record<string, number>
const r = calcular(entradasPadrao())

type Caso = [celula: string, valor: (r: Resultado) => number]

const casos: Caso[] = [
  // Balanço de massa
  ['Balanço de massa!E7', (r) => r.balanco.diasSafra],
  ['Balanço de massa!E8', (r) => r.balanco.moagemTcd],
  ['Balanço de massa!E20', (r) => r.balanco.artCana],
  ['Balanço de massa!E22', (r) => r.balanco.aguaEmbebicao],
  ['Balanço de massa!E27', (r) => r.balanco.bagacoKgTc],
  ['Balanço de massa!E28', (r) => r.balanco.bagacoTh],
  ['Balanço de massa!P6', (r) => r.balanco.caldoTotalTh],
  ['Balanço de massa!P10', (r) => r.balanco.lodoTh],
  ['Balanço de massa!P13', (r) => r.balanco.polCaldoMisto],
  ['Balanço de massa!P15', (r) => r.balanco.artCaldoMisto],
  ['Balanço de massa!P17', (r) => r.balanco.densidadeCaldoMisto],
  ['Balanço de massa!R27', (r) => r.balanco.caldoAcucarTh],
  ['Balanço de massa!R28', (r) => r.balanco.caldoAcucarM3h],
  ['Balanço de massa!AF27', (r) => r.balanco.caldoEtanolTh],
  ['Balanço de massa!AF28', (r) => r.balanco.caldoEtanolM3h],
  // Produção
  ['Balanço de massa!R34', (r) => r.producao.acucarTh],
  ['Balanço de massa!R35', (r) => r.producao.acucarTdia],
  ['Balanço de massa!R36', (r) => r.producao.acucarSacasDia],
  ['Balanço de massa!R37', (r) => r.producao.mixAcucar],
  ['Balanço de massa!AF34', (r) => r.producao.hidratadoM3dia],
  ['Balanço de massa!AF36', (r) => r.producao.hidratadoEquivalenteM3dia],
  ['Balanço de massa!B35', (r) => r.producao.artEntrada],
  ['Balanço de massa!B36', (r) => r.producao.artAcucar],
  ['Balanço de massa!B37', (r) => r.producao.artHidratado],
  ['Balanço de massa!Y41', (r) => r.producao.recuperacaoArt],
  ['Balanço de massa!Y42', (r) => r.producao.rtc],
  ['Balanço de massa!E11', (r) => r.producao.moagemAcucarTch],
  ['Balanço de massa!E13', (r) => r.producao.moagemEtanolTch],
  // Vapores
  ['Evaporação!BZ12', (r) => r.vapor.tEscape],
  ['Evaporação!BZ22', (r) => r.vapor.tV1],
  ['Evaporação!BZ23', (r) => r.vapor.tV2],
  ['Evaporação!BZ24', (r) => r.vapor.tV3],
  // Extração (difusor)
  ['Difusor!AH11', (r) => r.extracao.vaporCaptadores],
  ['Difusor!M32', (r) => r.extracao.vaporAquecimentoCaldoMisto],
  ['Difusor!AP26', (r) => r.extracao.aquecedorDifusor.velocidade],
  ['Difusor!AP27', (r) => r.extracao.aquecedorDifusor.area],
  ['Difusor!AP28', (r) => r.extracao.aquecedorDifusor.k],
  ['Difusor!AP29', (r) => r.extracao.aquecedorDifusor.consumoVapor],
  ['Difusor!AV7', (r) => r.extracao.tEmbebicao],
  ['Difusor!BH7', (r) => r.extracao.flegmaca],
  ['Difusor!BG24', (r) => r.evaporacao.sangrias[5].V2],
  // Aquecimento antes do decantador — Fase 1
  ['Trat caldo!H6', (r) => r.aquecimento.fase1.vazaoMassa],
  ['Trat caldo!H5', (r) => r.aquecimento.fase1.vazaoVolume],
  ['Trat caldo!F43', (r) => r.aquecimento.fase1.aquecedores[0].velocidade],
  ['Trat caldo!F44', (r) => r.aquecimento.fase1.aquecedores[0].area],
  ['Trat caldo!F45', (r) => r.aquecimento.fase1.aquecedores[0].k],
  ['Trat caldo!F46', (r) => r.aquecimento.fase1.aquecedores[0].consumoVapor],
  ['Trat caldo!J44', (r) => r.aquecimento.fase1.aquecedores[1].area],
  ['Trat caldo!J46', (r) => r.aquecimento.fase1.aquecedores[1].consumoVapor],
  ['Trat caldo!N44', (r) => r.aquecimento.fase1.aquecedores[2].area],
  ['Trat caldo!N46', (r) => r.aquecimento.fase1.aquecedores[2].consumoVapor],
  ['Trat caldo!R44', (r) => r.aquecimento.fase1.aquecedores[3].area],
  ['Trat caldo!G56', (r) => r.aquecimento.fase1.vaporTotal],
  // Fase 2
  ['Trat caldo!S6', (r) => r.aquecimento.fase2.vazaoMassa],
  ['Trat caldo!S5', (r) => r.aquecimento.fase2.vazaoVolume],
  ['Trat caldo!AH19', (r) => r.aquecimento.fase2.aquecedores[0].velocidade],
  ['Trat caldo!AH20', (r) => r.aquecimento.fase2.aquecedores[0].area],
  ['Trat caldo!AL20', (r) => r.aquecimento.fase2.aquecedores[1].area],
  ['Trat caldo!AL21', (r) => r.aquecimento.fase2.aquecedores[1].k],
  ['Trat caldo!AL22', (r) => r.aquecimento.fase2.aquecedores[1].consumoVapor],
  ['Trat caldo!AP20', (r) => r.aquecimento.fase2.aquecedores[2].area],
  ['Trat caldo!AP21', (r) => r.aquecimento.fase2.aquecedores[2].k],
  ['Trat caldo!AP22', (r) => r.aquecimento.fase2.aquecedores[2].consumoVapor],
  ['Trat caldo!AT20', (r) => r.aquecimento.fase2.aquecedores[3].area],
  // Caldo de etanol
  ['Trat caldo!AH43', (r) => r.aquecimento.caldoEtanol.aquecedores[0].velocidade],
  ['Trat caldo!AH44', (r) => r.aquecimento.caldoEtanol.aquecedores[0].area],
  ['Trat caldo!AP46', (r) => r.aquecimento.caldoEtanol.aquecedores[2].consumoVapor],
  // Após o decantador
  ['Trat caldo!BM35', (r) => r.aquecimento.decantado.vazaoMassa],
  ['Trat caldo!BR44', (r) => r.aquecimento.decantado.aquecedores[0].velocidade],
  ['Trat caldo!BR45', (r) => r.aquecimento.decantado.aquecedores[0].area],
  ['Trat caldo!BR46', (r) => r.aquecimento.decantado.aquecedores[0].k],
  ['Trat caldo!BR47', (r) => r.aquecimento.decantado.aquecedores[0].consumoVapor],
  // Destilação
  ['Destilação!C32', (r) => r.destilacao.consumoEspecificoCana],
  ['Destilação!C33', (r) => r.destilacao.vaporCana],
  ['Destilação!C40', (r) => r.destilacao.consumoEspecificoMilho],
  ['Destilação!C41', (r) => r.destilacao.vaporMilho],
  ['Destilação!C42', (r) => r.destilacao.vaporTotal],
  // Sangrias
  ['Evaporação!R8', (r) => r.evaporacao.sangrias[0].V1],
  ['Evaporação!V8', (r) => r.evaporacao.sangrias[0].V2],
  ['Evaporação!V10', (r) => r.evaporacao.sangrias[2].V2],
  ['Evaporação!V11', (r) => r.evaporacao.sangrias[3].V2],
  ['Evaporação!R12', (r) => r.evaporacao.sangrias[4].V1],
  ['Evaporação!R14', (r) => r.evaporacao.sangrias[6].V1],
  ['Cálculo 1!C20', (r) => r.evaporacao.sangriaTotal.V1],
  ['Cálculo 1!G20', (r) => r.evaporacao.sangriaTotal.V2],
  ['Cálculo 1!H20', (r) => r.evaporacao.sangriaTotal.V3],
  // Evaporação por efeito
  ['Cálculo 1!C22', (r) => r.evaporacao.evaporadoTotal],
  ['Cálculo 1!C23', (r) => r.evaporacao.xaropeTh],
  ['Evaporação!L28', (r) => r.evaporacao.vaporEscape],
  ...[
    ['P', 0],
    ['T', 1],
    ['X', 2],
    ['AB', 3],
    ['AF', 4],
  ].flatMap(([col, i]): Caso[] => [
    [`Evaporação!${col}35`, (r) => r.evaporacao.efeitos[i as number].areaInstalada],
    [`Evaporação!${col}36`, (r) => r.evaporacao.efeitos[i as number].saida],
    [`Evaporação!${col}37`, (r) => r.evaporacao.efeitos[i as number].evaporado],
    [`Evaporação!${col}38`, (r) => r.evaporacao.efeitos[i as number].brixSaida],
    [`Evaporação!${col}39`, (r) => r.evaporacao.efeitos[i as number].taxa],
  ]),
  ['Evaporação!BZ26', (r) => r.evaporacao.efeitos[4].temperatura],
  ['Evaporação!F43', (r) => r.evaporacao.xaropeTemperatura],
  ['Evaporação!AU16', (r) => r.evaporacao.vaporCondensador],
  ['Evaporação!AU21', (r) => r.evaporacao.aguaCondensador],
  // Cozimento
  ['Cozimento!AU6', (r) => r.cozimento.solidosXarope],
  ['Cozimento!AU10', (r) => r.cozimento.polXarope],
  ['Cozimento!AU9', (r) => r.cozimento.sjm],
  ['Cozimento!AU8', (r) => r.cozimento.acucar],
  ['Cozimento!AU7', (r) => r.cozimento.solidosMelFinal],
  ['Cozimento!AW7', (r) => r.cozimento.melFinalM3h],
  ['Cozimento!AU12', (r) => r.cozimento.solidosMassaB],
  ['Cozimento!AU13', (r) => r.cozimento.solidosMagma],
  ['Cozimento!E17', (r) => r.cozimento.massaA.xaropeSolidos],
  ['Cozimento!E20', (r) => r.cozimento.massaA.massaSolidos],
  ['Cozimento!E21', (r) => r.cozimento.massaA.melASolidos],
  ['Cozimento!E32', (r) => r.cozimento.massaA.xaropeVazao],
  ['Cozimento!E33', (r) => r.cozimento.massaA.magmaVazao],
  ['Cozimento!I51', (r) => r.cozimento.massaA.melAVazao],
  ['Cozimento!AX32', (r) => r.cozimento.massaA.aguaEvaporada],
  ['Cozimento!E34', (r) => r.cozimento.massaA.vapor],
  ['Cozimento!AU16', (r) => r.cozimento.massaB.sementeSolidos],
  ['Cozimento!W17', (r) => r.cozimento.massaB.sementeXaropeSolidos],
  ['Cozimento!W18', (r) => r.cozimento.massaB.sementeMelASolidos],
  ['Cozimento!W21', (r) => r.cozimento.massaB.melASolidos],
  ['Cozimento!R44', (r) => r.cozimento.massaB.melAVazao],
  ['Cozimento!R45', (r) => r.cozimento.massaB.sementeVazao],
  ['Cozimento!AI44', (r) => r.cozimento.massaB.melFinalVazao],
  ['Cozimento!AI45', (r) => r.cozimento.massaB.magmaVazao],
  ['Cozimento!R46', (r) => r.cozimento.massaB.vapor],
  // Capacidade
  ['Capacidade!C25', (r) => r.cozimento.massaA.volumeNecessario],
  ['Capacidade!C26', (r) => r.cozimento.massaB.volumeNecessario],
  ['Capacidade!C33', (r) => r.capacidade.maiorOcupacao],
]

describe('motor × planilha v2.2', () => {
  it.each(casos)('%s', (celula, valor) => {
    const esperado = valores[celula]
    expect(esperado, `célula ${celula} não encontrada na planilha`).toBeTypeOf('number')
    const obtido = valor(r)
    const tolerancia = Math.max(Math.abs(esperado) * 1e-9, 1e-9)
    expect(Math.abs(obtido - esperado), `${celula}: obtido ${obtido}, planilha ${esperado}`).toBeLessThan(
      tolerancia,
    )
  })

  it('ocupação de cada equipamento igual à aba Capacidade', () => {
    // Linhas 5 a 23 e 25 a 28 da aba Capacidade, na mesma ordem do motor (5 efeitos).
    const linhas = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28]
    expect(r.capacidade.itens).toHaveLength(linhas.length)
    linhas.forEach((linha, i) => {
      const esperado = valores[`Capacidade!F${linha}`]
      expect(r.capacidade.itens[i].ocupacao ?? 0, `Capacidade!F${linha}`).toBeCloseTo(esperado, 9)
    })
  })

  it('sem avisos de erro no cenário da planilha', () => {
    expect(r.balanco.fechado).toBe(true)
    expect(r.cozimento.coerente).toBe(true)
    expect(r.capacidade.moagemMaxima).toBeNull()
    expect(r.avisos.filter((a) => a.nivel === 'erro')).toEqual([])
  })
})

describe('comportamento do motor', () => {
  it('com 6 efeitos a evaporação fecha no Brix do xarope', () => {
    const e = entradasPadrao()
    e.evaporacao.numeroEfeitos = 6
    const r6 = calcular(e)
    expect(r6.evaporacao.efeitos).toHaveLength(6)
    expect(r6.evaporacao.efeitos[5].brixSaida).toBeCloseTo(e.evaporacao.brixXarope, 9)
    expect(r6.evaporacao.efeitos[5].saida).toBeCloseTo(r6.evaporacao.xaropeTh, 9)
  })

  it('limite ativo estima a moagem máxima pela maior ocupação do setor', () => {
    const e = entradasPadrao()
    e.limites.evaporacao = true
    const rl = calcular(e)
    const maior = Math.max(...rl.evaporacao.efeitos.map((f) => f.taxa / f.taxaMaxima))
    expect(rl.capacidade.moagemMaxima).toBeCloseTo(e.cana.moagemTch / maior, 9)
    expect(rl.capacidade.limiteExcedido).toBe(true)
  })

  it('a trava automática reduz moagem e caldo para açúcar até caber no limite', () => {
    const e = entradasPadrao()
    expect(reduzirAoLimite(e)).toBeNull() // nenhum limite ativo
    e.limites.evaporacao = true
    const ajustado = reduzirAoLimite(e)!
    expect(ajustado).not.toBeNull()
    const ra = calcular(ajustado)
    expect(ra.capacidade.limiteExcedido).toBe(false)
    expect(ra.balanco.fechado).toBe(true)
    expect(ajustado.caldo.caldoAcucar / ajustado.cana.moagemTch).toBeCloseTo(1, 2) // mix mantido
    // 1 tch acima já estoura: o ajuste parou no limite
    const acima = structuredClone(e)
    acima.cana.moagemTch = ajustado.cana.moagemTch + 1
    acima.caldo.caldoAcucar = (e.caldo.caldoAcucar * acima.cana.moagemTch) / e.cana.moagemTch
    expect(calcular(acima).capacidade.limiteExcedido).toBe(true)
  })

  it('avisa quando o caldo para açúcar passa do caldo total', () => {
    const e = entradasPadrao()
    e.caldo.caldoAcucar = 1200
    const rc = calcular(e)
    expect(rc.balanco.fechado).toBe(false)
    expect(rc.balanco.caldoAcucarMaximo).toBeLessThan(1200)
  })

  it('sem milho e sem difusor o balanço continua válido', () => {
    const e = entradasPadrao()
    e.milho.moagem = 0
    e.extracao.captadores.quantidade = 0
    e.extracao.aquecimentoCaldoMisto.vapor = 'parado'
    e.extracao.aquecedorDifusor.vapor = 'parado'
    const rs = calcular(e)
    expect(rs.evaporacao.sangrias[5]).toMatchObject({ V1: 0, V2: 0 })
    expect(rs.evaporacao.sangrias[6].V1).toBe(0)
    expect(Number.isFinite(rs.producao.hidratadoM3dia)).toBe(true)
  })
})
