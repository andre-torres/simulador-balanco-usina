import type { Entradas, Premissas } from './tipos'

/**
 * Constantes de processo e correlações (aba "Premissas" da planilha v2.2).
 * Referência das fórmulas: Rein, P. Engenharia do Açúcar de Cana. Bartens, 2013.
 */
export const PREMISSAS_PADRAO: Premissas = {
  litrosEtanolPorTcEquivalente: 80,
  artCaldoMistoA: 0.61,
  artCaldoMistoB: 38.3,
  flegmacaPorLitro: 2,
  fatorSacaroseArt: 0.95,
  polAcucarArt: 0.995,
  litrosEtanolPorKgArt: 0.6475,
  rtcPolAcucar: 0.993,
  rtcKgArtPorSaca: 52.63,
  rtcLitrosEtanolPorKgArt: 0.5957,
  teorHidratado: 0.9542,
  teorAnidro: 0.9958,
  condensadorConstante: 563,
  purezaAcucar: 99.3,
  densidadeMel: 1.4,
  fatorVaporMassaA: 1.1,
  fatorVaporMassaB: 1.3,
  densidadeMassaCozida: 1.45,
  tempoCozimentoA: 4.5,
  tempoCozimentoB: 6,
  destilacaoVaporCoef: 13.877,
  destilacaoVaporExp: 0.788,
  calorLatenteA: 607,
  calorLatenteBAquecedor: 0.67,
  tsatA: 0.0208,
  tsatB: 0.2861,
  tsatC: 4.5981,
  cpBrix: 0.006,
  lyleA: 200,
  lyleB: 54000,
  lyleC: 0.036,
  kCoefW: 7,
  kVelocidadeRef: 1.8,
  kExpoente: 0.8,
  wParaKcal: 0.859845,
  kgPorSaca: 50,
}

/**
 * Cenário inicial: os mesmos valores da planilha "Simulação Processo v2.2 (corrigida)".
 * É o caso usado no teste automático (src/engine/calcular.test.ts).
 * Troque por valores de exemplo próprios antes de publicar o produto.
 */
export const ENTRADAS_PADRAO: Entradas = {
  cana: {
    moagemSafra: 4_900_000,
    moagemTch: 1000,
    disponibilidade: 100,
    fibra: 13.03,
    pc: 14.55,
    ar: 0.57,
    embebicaoFibra: 200,
  },
  bagaco: { umidade: 49.8, purezaUltimoTerno: 85.11, pol: 1.96 },
  caldo: { caldoAcucar: 1000, lodo: 6, brixMisto: 14.19, purezaMisto: 85.78 },
  eficiencias: {
    extracao: 95.6,
    tratamento: 100,
    fermentacao: 88,
    destilacao: 99,
    perdasIndeterminadas: 2.09,
  },
  etanol: {
    anidro: 0,
    glVinho: 9.9,
    capacidadeDestilaria: 1000,
    colunasABLigadas: true,
    colunaCLigada: false,
    consumoColunaC: 0.7,
  },
  milho: { moagem: 1300, glVinho: 17.55, rendimento: 400, vaporV1: 70, destilacaoLigada: true },
  extracao: {
    capacidadeNominal: 1100,
    tempCaldoMisto: 48,
    captadores: { quantidade: 5, vazaoPorCaptador: 75, tEntrada: 66, tSaida: 82, vapor: 'V2' },
    aquecimentoCaldoMisto: { tSaida: 85, vapor: 'V2' },
    aquecedorDifusor: { tEntrada: 48, tSaida: 85, vapor: 'V2', secao: 0.08902, areaInstalada: 850 },
    embebicao: {
      vapor: 'parado',
      condensado: 100,
      tCondensado: 57.3,
      tFlegmaca: 86,
      tAguaBruta: 50,
      tSaida: 100,
    },
  },
  tratamento: {
    fracaoFase1: 53,
    fase1: {
      tEntrada: 88,
      linhas: 2,
      secao: 0.087,
      aquecedores: [
        { vapor: 'V2', tEntrada: null, tSaida: 88.5, areaInstalada: 100 },
        { vapor: 'V2', tEntrada: null, tSaida: 95.6, areaInstalada: 500 },
        { vapor: 'V2', tEntrada: 87.8, tSaida: 104.2, areaInstalada: 1500 },
        { vapor: 'parado', tEntrada: 87.2, tSaida: 0, areaInstalada: 500 },
      ],
    },
    fase2: {
      tEntrada: 88.7,
      secao: 0.16,
      aquecedores: [
        { vapor: 'V2', tEntrada: null, tSaida: 88.7, areaInstalada: 300 },
        { vapor: 'V2', tEntrada: null, tSaida: 91.9, areaInstalada: 200 },
        { vapor: 'V1', tEntrada: null, tSaida: 103.3, areaInstalada: 550 },
        { vapor: 'parado', tEntrada: null, tSaida: 100, areaInstalada: 300 },
      ],
    },
    caldoEtanol: {
      temperatura: 55,
      brix: 12.84,
      secao: 0.087,
      aquecedores: [
        { vapor: 'parado', tEntrada: null, tSaida: 63, areaInstalada: 100 },
        { vapor: 'parado', tEntrada: null, tSaida: 77, areaInstalada: 100 },
        { vapor: 'parado', tEntrada: null, tSaida: 97, areaInstalada: 100 },
      ],
    },
    decantado: {
      temperatura: 95,
      brix: 12.84,
      tSaida: 110,
      vapor: 'V1',
      linhas: 2,
      secao: 0.087,
      areaInstalada: 1300,
    },
  },
  evaporacao: {
    pressaoEscape: 1.7,
    pressoes: [1.16, 0.64, 0.15, -0.32, -0.55],
    vacuo: 23,
    brixXarope: 56.52,
    numeroEfeitos: 5,
    tAguaEntrada: 32,
    tAguaSaida: 52,
    efeitos: [
      { caixas: 4, areaPorCaixa: 3500, taxaMaxima: 30 },
      { caixas: 2, areaPorCaixa: 3500, taxaMaxima: 25 },
      { caixas: 1, areaPorCaixa: 2000, taxaMaxima: 20 },
      { caixas: 1, areaPorCaixa: 2000, taxaMaxima: 20 },
      { caixas: 1, areaPorCaixa: 2000, taxaMaxima: 20 },
      { caixas: 1, areaPorCaixa: 2000, taxaMaxima: 20 },
    ],
  },
  cozimento: {
    purezaXarope: 84.29,
    brixMassaA: 91.96,
    massaB: { pureza: 73.7, brix: 92.92 },
    magma: { pureza: 87.32, brix: 90 },
    semente: { pureza: 78, brix: 89.48 },
    melA: { pureza: 72.26, brix: 83.31 },
    melFinal: { pureza: 55.63, brix: 90.02 },
    vaporMassaB: 'V2',
    volumeTachosA: 400,
    volumeTachosB: 550,
    capacidadeSecador: 100,
  },
  limites: {
    extracao: false,
    tratamento: false,
    evaporacao: false,
    cozimento: false,
    destilaria: false,
  },
  premissas: PREMISSAS_PADRAO,
}

export function entradasPadrao(): Entradas {
  return structuredClone(ENTRADAS_PADRAO)
}
