import type {
  Aquecedor,
  Aviso,
  Entradas,
  FonteVapor,
  GrupoAquecimento,
  ItemCapacidade,
  LinhaSangria,
  Premissas,
  Resultado,
  ResultadoAquecedor,
  ResultadoEfeito,
  Setor,
  Situacao,
} from './tipos'

/**
 * Motor de cálculo do balanço — porte da planilha "Simulação Processo v2.2 (corrigida)".
 *
 * Função pura: mesmas entradas, mesmo resultado. Não acessa rede, DOM nem banco.
 * As referências entre colchetes apontam a célula de origem na planilha
 * (BM = Balanço de massa, TC = Trat caldo, EV = Evaporação, C1 = Cálculo 1,
 *  CZ = Cozimento, DF = Difusor, DS = Destilação, CP = Capacidade).
 */

// ------------------------------------------------------------ propriedades

/** Temperatura de saturação (°C) a partir da pressão absoluta (kgf/cm²). */
export function temperaturaSaturacao(pAbs: number, p: Premissas): number {
  const ln = Math.log(pAbs)
  return Math.exp(-p.tsatA * ln * ln + p.tsatB * ln + p.tsatC)
}

/** Calor latente (kcal/kg) usado nos aquecedores. */
export function calorLatente(t: number, p: Premissas): number {
  return p.calorLatenteA - p.calorLatenteBAquecedor * t
}

/** Calor específico do caldo (kcal/kg·°C). */
export function calorEspecifico(brix: number, p: Premissas): number {
  return 1 - p.cpBrix * brix
}

/** Densidade do caldo (t/m³) pela equação de Lyle (Rein, p. 852). */
export function densidadeLyle(brix: number, t: number, p: Premissas): number {
  return (1 + (brix * (brix + p.lyleA)) / p.lyleB) * (1 - (p.lyleC * (t - 20)) / (160 - t))
}

/** Coeficiente global K (kcal/m²·h·°C) — Rein, eq. 9.18. */
export function coeficienteK(tVapor: number, velocidade: number, p: Premissas): number {
  return p.kCoefW * p.wParaKcal * tVapor * Math.pow(velocidade / p.kVelocidadeRef, p.kExpoente)
}

// ---------------------------------------------------------------- aquecedor

interface DadosAquecedor {
  nome: string
  vapor: FonteVapor
  /** t/h */
  vazao: number
  brix: number
  velocidade: number
  tVapor: number
  tEntrada: number
  tSaida: number
  areaInstalada: number
}

function calcularAquecedor(d: DadosAquecedor, p: Premissas): ResultadoAquecedor {
  const base = {
    nome: d.nome,
    vapor: d.vapor,
    tEntrada: d.tEntrada,
    tSaida: d.tSaida,
    velocidade: d.velocidade,
    areaInstalada: d.areaInstalada,
  }
  if (d.vapor === 'parado') {
    return { ...base, tVapor: 0, k: 0, area: 0, consumoVapor: 0, inviavel: false }
  }
  const cp = calorEspecifico(d.brix, p)
  const k = coeficienteK(d.tVapor, d.velocidade, p)
  const inviavel = d.tVapor <= d.tSaida || d.tVapor <= d.tEntrada || !(k > 0)
  const area = inviavel
    ? Number.NaN
    : ((1000 * d.vazao * cp) / k) * Math.log((d.tVapor - d.tEntrada) / (d.tVapor - d.tSaida))
  const consumoVapor = (d.vazao * cp * (d.tSaida - d.tEntrada)) / calorLatente(d.tVapor, p)
  return { ...base, tVapor: d.tVapor, k, area, consumoVapor, inviavel }
}

function calcularSerie(
  nome: string,
  rotulos: string[],
  aquecedores: Aquecedor[],
  fluxo: { vazaoMassa: number; vazaoVolume: number; brix: number; tEntrada: number; velocidade: number },
  tVaporDe: (v: FonteVapor) => number,
  p: Premissas,
): GrupoAquecimento {
  const resultados: ResultadoAquecedor[] = []
  let tAnterior = fluxo.tEntrada
  aquecedores.forEach((a, i) => {
    const tEntrada = a.tEntrada ?? tAnterior
    resultados.push(
      calcularAquecedor(
        {
          nome: rotulos[i] ?? `Aquecedor ${i + 1}`,
          vapor: a.vapor,
          vazao: fluxo.vazaoMassa,
          brix: fluxo.brix,
          velocidade: fluxo.velocidade,
          tVapor: tVaporDe(a.vapor),
          tEntrada,
          tSaida: a.tSaida,
          areaInstalada: a.areaInstalada,
        },
        p,
      ),
    )
    tAnterior = a.tSaida
  })
  return {
    nome,
    vazaoMassa: fluxo.vazaoMassa,
    vazaoVolume: fluxo.vazaoVolume,
    brix: fluxo.brix,
    aquecedores: resultados,
    areaTotal: somar(resultados.map((r) => r.area)),
    vaporTotal: somar(resultados.map((r) => r.consumoVapor)),
  }
}

function somar(valores: number[]): number {
  return valores.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0)
}

function vaporPorFonte(grupos: GrupoAquecimento[], fonte: FonteVapor): number {
  return somar(
    grupos.flatMap((g) => g.aquecedores.filter((a) => a.vapor === fonte).map((a) => a.consumoVapor)),
  )
}

// ------------------------------------------------------------- capacidade

function situacaoDe(ocupacao: number | null): Situacao {
  if (ocupacao === null) return 'sem-dado'
  if (ocupacao > 1) return 'acima'
  if (ocupacao > 0.9) return 'atencao'
  return 'ok'
}

function itemCapacidade(
  setor: Setor,
  equipamento: string,
  necessario: number,
  instalado: number,
  unidade: string,
  limiteAtivo: boolean,
  moagem: number,
): ItemCapacidade {
  const ocupacao = Number.isFinite(necessario) && instalado > 0 ? necessario / instalado : null
  return {
    setor,
    equipamento,
    necessario,
    instalado,
    unidade,
    ocupacao,
    situacao: situacaoDe(ocupacao),
    limiteAtivo,
    moagemMaxima: limiteAtivo && ocupacao !== null && ocupacao > 0 ? moagem / ocupacao : null,
  }
}

// ---------------------------------------------------------------- cálculo

export function calcular(e: Entradas): Resultado {
  const p = e.premissas
  const avisos: Aviso[] = []
  const tch = e.cana.moagemTch

  // ---- Vapores: temperatura de saturação por pressão [EV BZ12:BZ26]
  const tEscape = temperaturaSaturacao(e.evaporacao.pressaoEscape + 1, p)
  const pAbs = e.evaporacao.pressoes.map((x) => x + 1)
  const tVeg = pAbs.map((x) => temperaturaSaturacao(x, p))
  const [tV1, tV2, tV3] = tVeg
  const pVacuo = (76 - e.evaporacao.vacuo * 2.54) * 0.0135833
  const tVacuo = temperaturaSaturacao(pVacuo, p)
  const tVaporDe = (v: FonteVapor): number =>
    v === 'V1' ? tV1 : v === 'V2' ? tV2 : v === 'V3' ? tV3 : 0

  // ---- Balanço de massa: cana, bagaço, caldo
  const moagemTcd = tch * 24 * (e.cana.disponibilidade / 100) // [BM E8]
  const diasSafra = e.cana.moagemSafra / moagemTcd // [BM E7]
  const artCana = e.cana.pc / p.fatorSacaroseArt + e.cana.ar // [BM E20]
  const aguaEmbebicao = (e.cana.embebicaoFibra / 100) * (e.cana.fibra / 100) * tch // [BM E22]
  const bagacoKgTc =
    (e.cana.fibra / (1 - e.bagaco.umidade / 100 - e.bagaco.pol / e.bagaco.purezaUltimoTerno)) * 10 // [BM E27]
  const bagacoTh = (bagacoKgTc * tch) / 1000 // [BM E28]
  const lodoTh = (e.caldo.lodo * tch) / 100 // [BM P10]
  const brixMisto = e.caldo.brixMisto
  const cpMisto = calorEspecifico(brixMisto, p)

  // ---- Extração: vapor direto nos captadores [DF AH6:AH11]
  const cap = e.extracao.captadores
  const vazaoCaptadores = cap.quantidade * cap.vazaoPorCaptador
  const tMediaCaptadores = (cap.tEntrada + cap.tSaida) / 2
  const vaporCaptadores =
    cap.vapor === 'parado'
      ? 0
      : (vazaoCaptadores *
          densidadeLyle(brixMisto, tMediaCaptadores, p) *
          cpMisto *
          (cap.tSaida - cap.tEntrada)) /
        calorLatente(tVaporDe(cap.vapor), p)

  const caldoTotalTh = tch + aguaEmbebicao - bagacoTh + lodoTh + vaporCaptadores // [BM P6]
  const densidadeCaldoMisto = densidadeLyle(brixMisto, e.extracao.tempCaldoMisto, p) // [BM P17]
  const caldoTotalM3h = caldoTotalTh / densidadeCaldoMisto // [DF M28]
  const polCaldoMisto = (brixMisto * e.caldo.purezaMisto) / 100 // [BM P13]
  const artCaldoMisto =
    ((p.artCaldoMistoA * e.caldo.purezaMisto + p.artCaldoMistoB) * brixMisto) / 100 // [BM P15]

  // ---- Caldo decantado para açúcar [TC BM34:BM38]
  const dec = e.tratamento.decantado
  const densidadeDecantado = densidadeLyle(dec.brix, dec.temperatura, p)
  const caldoAcucarTh = e.caldo.caldoAcucar * densidadeDecantado // [TC BM35]
  const caldoAcucarM3h = caldoAcucarTh / densidadeCaldoMisto // [BM R28]
  const caldoEtanolTh = Math.max(0, caldoTotalTh - caldoAcucarTh) // [BM AF27]
  const densidadeCaldoEtanol = densidadeLyle(brixMisto, e.tratamento.caldoEtanol.temperatura, p) // [BM P12]
  const caldoEtanolM3h = caldoEtanolTh / densidadeCaldoEtanol // [BM AF28]
  const fechado = caldoAcucarTh <= caldoTotalTh // [BM V35]
  if (!fechado) {
    avisos.push({
      nivel: 'erro',
      setor: 'Balanço',
      mensagem:
        'O caldo para açúcar é maior que o caldo total disponível. Reduza a vazão de caldo para açúcar.',
    })
  }

  // ---- Evaporação: totais (método abreviado) [C1 C22, C23]
  const brixXarope = e.evaporacao.brixXarope
  const evaporadoTotal = caldoAcucarTh * (1 - dec.brix / brixXarope)
  const xaropeTh = caldoAcucarTh - evaporadoTotal

  // ---- Cozimento: balanço de sólidos reais [CZ AU5:AU16]
  const cz = e.cozimento
  const solidosXarope = xaropeTh * (brixXarope / 100) // [CZ AU6]
  const polXarope = (solidosXarope * cz.purezaXarope) / 100 // [CZ AU10]
  const pzMelFinal = cz.melFinal.pureza
  const sjm =
    (p.purezaAcucar * (cz.purezaXarope - pzMelFinal)) /
    (cz.purezaXarope * (p.purezaAcucar - pzMelFinal)) // [CZ AU9]
  const acucarTh = (sjm * polXarope) / (p.purezaAcucar / 100) // [CZ AU8]
  const solidosMelFinal = solidosXarope - acucarTh // [CZ AU7]
  const melFinalM3h = solidosMelFinal / (cz.melFinal.brix / 100) / p.densidadeMel // [CZ AW7]
  const solidosMassaB =
    ((cz.magma.pureza - cz.massaB.pureza + (cz.massaB.pureza - pzMelFinal)) /
      (cz.magma.pureza - cz.massaB.pureza)) *
    solidosMelFinal // [CZ AU12]
  const solidosMagma = solidosMassaB - solidosMelFinal // [CZ AU13]
  const sementeSolidos =
    (solidosMassaB * (cz.massaB.pureza - pzMelFinal)) / (cz.semente.pureza - pzMelFinal) // [CZ AU16]
  const sementeXarope =
    (sementeSolidos * (cz.semente.pureza - cz.melA.pureza)) /
    (cz.purezaXarope - cz.semente.pureza + (cz.semente.pureza - cz.melA.pureza)) // [CZ W17]
  const sementeMelA = sementeSolidos - sementeXarope // [CZ W18]
  const melAParaMassaB = solidosMassaB - sementeXarope - sementeMelA // [CZ W21]

  const xaropeMassaA = solidosXarope - sementeXarope // [CZ E17]
  const massaASolidos = solidosXarope - sementeXarope + solidosMelFinal - sementeMelA // [CZ E20]
  const melAProduzido = massaASolidos - acucarTh // [CZ E21]
  const aguaXaropeA = xaropeMassaA * (100 / brixXarope - 100 / cz.brixMassaA) // [CZ AX30]
  const aguaMagmaA = solidosMagma * (100 / cz.magma.brix - 100 / cz.brixMassaA) // [CZ AX31]
  const aguaMassaA = aguaXaropeA + aguaMagmaA // [CZ AX32]
  const vaporMassaA = aguaMassaA * p.fatorVaporMassaA // [CZ AX33]
  const aguaXaropeB = sementeXarope * (100 / brixXarope - 100 / cz.semente.brix) // [CZ AX43]
  const aguaMelASemente = sementeMelA * (100 / cz.melA.brix - 100 / cz.semente.brix) // [CZ AX44]
  const aguaMelAB = melAParaMassaB * (100 / cz.melA.brix - 100 / cz.massaB.brix) // [CZ AX45]
  const aguaMassaB = aguaXaropeB + aguaMelASemente
  const vaporMassaB = aguaMassaB * p.fatorVaporMassaB // [CZ AX46]
  const massaAVazao = massaASolidos / (cz.brixMassaA / 100)
  const massaBVazao = solidosMassaB / (cz.massaB.brix / 100)
  const volumeTachosA = (massaAVazao / p.densidadeMassaCozida) * p.tempoCozimentoA // [CP C25]
  const volumeTachosB = (massaBVazao / p.densidadeMassaCozida) * p.tempoCozimentoB // [CP C26]
  const cozimentoCoerente =
    Math.min(
      sementeXarope,
      sementeMelA,
      melAParaMassaB,
      melAProduzido,
      aguaMagmaA,
      aguaXaropeB,
      aguaMelASemente,
      aguaMelAB,
    ) >= 0 // [CZ B12]
  if (!cozimentoCoerente) {
    avisos.push({
      nivel: 'erro',
      setor: 'Cozimento',
      mensagem: 'Vazão negativa no cozimento. Revise as purezas e os Brix informados.',
    })
  }

  // ---- Produção de açúcar e etanol [BM R34:R37, AF34:AF36, B35:B39]
  const ef = e.eficiencias
  const acucarTdia = acucarTh * 24
  const acucarSacasDia = (acucarTdia * 1000) / p.kgPorSaca
  const artEntrada = (artCana / 100) * moagemTcd * 1000 // kg/dia [BM B35]
  const artAcucar = (acucarTdia * 1000 * p.polAcucarArt) / p.fatorSacaroseArt // [BM B36]
  const anidro = e.etanol.anidro
  const hidratado = Math.max(
    0,
    (((artEntrada *
      (ef.extracao / 100) *
      (ef.tratamento / 100) *
      (1 - ef.perdasIndeterminadas / 100) -
      artAcucar) *
      p.litrosEtanolPorKgArt *
      (ef.fermentacao / 100) *
      (ef.destilacao / 100)) /
      1000 -
      anidro * p.teorAnidro) /
      p.teorHidratado,
  ) // [BM AF34]
  const hidratadoEquivalente = hidratado + (anidro * p.teorAnidro) / p.teorHidratado // [BM AF36]
  const artHidratado = (hidratado / p.litrosEtanolPorKgArt) * p.teorHidratado * 1000 // [BM B37]
  const artAnidro = (anidro / p.litrosEtanolPorKgArt) * p.teorAnidro * 1000 // [BM B38]
  const artRecuperado = artAcucar + artHidratado + artAnidro // [BM B39]
  const mixAcucar = artRecuperado > 0 ? artAcucar / artRecuperado : 0 // [BM R37]
  const recuperacaoArt = (artRecuperado / artEntrada) * 100 // [BM Y41]
  const rtc =
    ((acucarSacasDia * p.rtcPolAcucar * p.rtcKgArtPorSaca +
      (anidro * 1000 * p.teorAnidro + hidratado * 1000 * p.teorHidratado) /
        p.rtcLitrosEtanolPorKgArt) /
      artEntrada) *
    100 // [BM Y42]
  const moagemAcucarTch = (mixAcucar * moagemTcd) / 24 // [BM E11]
  const etanolMilho = (e.milho.moagem * e.milho.rendimento) / 1000 // m³/dia

  // ---- Extração: aquecimento [DF M27:M33, AP21:AP30, AV6:AV11]
  const aqMisto = e.extracao.aquecimentoCaldoMisto
  const vaporAquecimentoCaldoMisto =
    aqMisto.vapor === 'parado'
      ? 0
      : (caldoTotalTh * cpMisto * (aqMisto.tSaida - e.extracao.tempCaldoMisto)) /
        calorLatente(tVaporDe(aqMisto.vapor), p)
  const aqDif = e.extracao.aquecedorDifusor
  const aquecedorDifusor = calcularAquecedor(
    {
      nome: 'Aquecedor de caldo do difusor',
      vapor: aqDif.vapor,
      vazao: caldoTotalTh,
      brix: brixMisto,
      velocidade: caldoTotalM3h / aqDif.secao / 3600,
      tVapor: tVaporDe(aqDif.vapor),
      tEntrada: aqDif.tEntrada,
      tSaida: aqDif.tSaida,
      areaInstalada: aqDif.areaInstalada,
    },
    p,
  )
  const emb = e.extracao.embebicao
  const flegmaca = ((hidratado + anidro) * p.flegmacaPorLitro) / 24 // [DF BH7]
  const aguaBruta = aguaEmbebicao - emb.condensado - flegmaca // [DF BH8]
  const tEmbebicao =
    aguaEmbebicao > 0
      ? (emb.condensado * emb.tCondensado + flegmaca * emb.tFlegmaca + aguaBruta * emb.tAguaBruta) /
        aguaEmbebicao
      : 0 // [DF AV7]
  const vaporEmbebicao =
    emb.vapor === 'parado'
      ? 0
      : (aguaEmbebicao * (emb.tSaida - tEmbebicao)) / calorLatente(tVaporDe(emb.vapor), p) // [DF AV11]
  const difusorPorFonte = (fonte: 'V1' | 'V2'): number =>
    (aqDif.vapor === fonte ? aquecedorDifusor.consumoVapor : 0) +
    (aqMisto.vapor === fonte ? vaporAquecimentoCaldoMisto : 0) +
    (emb.vapor === fonte ? vaporEmbebicao : 0) +
    (cap.vapor === fonte ? vaporCaptadores : 0) // [DF BG23, BG24]

  // ---- Tratamento de caldo: aquecimento antes do decantador [TC]
  const tr = e.tratamento
  const fase1Th = caldoTotalTh * (tr.fracaoFase1 / 100) // [TC H6]
  const fase1M3h = fase1Th / densidadeCaldoMisto // [TC H5]
  const fase2Th = caldoTotalTh - fase1Th // [TC S6]
  const fase2M3h = fase2Th / densidadeCaldoMisto // [TC S5]
  const fase1 = calcularSerie(
    'Caldo misto – Fase 1',
    tr.fase1.aquecedores.map((_, i) => `Fase 1, aquecedor ${i + 1}`),
    tr.fase1.aquecedores,
    {
      vazaoMassa: fase1Th,
      vazaoVolume: fase1M3h,
      brix: brixMisto,
      tEntrada: tr.fase1.tEntrada,
      velocidade: fase1M3h / tr.fase1.linhas / 3600 / tr.fase1.secao, // [TC F43]
    },
    tVaporDe,
    p,
  )
  const fase2 = calcularSerie(
    'Caldo misto – Fase 2',
    tr.fase2.aquecedores.map((_, i) => `Fase 2, aquecedor ${i + 1}`),
    tr.fase2.aquecedores,
    {
      vazaoMassa: fase2Th,
      vazaoVolume: fase2M3h,
      brix: brixMisto,
      tEntrada: tr.fase2.tEntrada,
      // DECISÃO PENDENTE: a planilha v2.2 calcula a velocidade da Fase 2 com a vazão
      // da Fase 1 [TC AH19 usa $H$5]. Mantido igual à planilha; para usar a vazão da
      // própria Fase 2, troque `fase1M3h` por `fase2M3h` na linha abaixo.
      velocidade: fase1M3h / 3600 / tr.fase2.secao,
    },
    tVaporDe,
    p,
  )
  const caldoEtanol = calcularSerie(
    'Caldo para etanol',
    tr.caldoEtanol.aquecedores.map((_, i) => `Caldo de etanol, aquecedor ${i + 1}`),
    tr.caldoEtanol.aquecedores,
    {
      vazaoMassa: caldoEtanolTh,
      vazaoVolume: caldoEtanolM3h,
      brix: tr.caldoEtanol.brix,
      tEntrada: tr.caldoEtanol.temperatura,
      velocidade: caldoEtanolM3h / 3600 / tr.caldoEtanol.secao, // [TC AH43]
    },
    tVaporDe,
    p,
  )

  // ---- Aquecimento após o decantador (caldo decantado) [TC BR44:BR48]
  const aquecedorDecantado = calcularAquecedor(
    {
      nome: 'Aquecedor de caldo decantado',
      vapor: dec.vapor,
      vazao: caldoAcucarTh,
      brix: dec.brix,
      velocidade: e.caldo.caldoAcucar / dec.linhas / 3600 / dec.secao,
      tVapor: tVaporDe(dec.vapor),
      tEntrada: dec.temperatura,
      tSaida: dec.tSaida,
      areaInstalada: dec.areaInstalada,
    },
    p,
  )
  const decantado: GrupoAquecimento = {
    nome: 'Caldo decantado',
    vazaoMassa: caldoAcucarTh,
    vazaoVolume: e.caldo.caldoAcucar,
    brix: dec.brix,
    aquecedores: [aquecedorDecantado],
    areaTotal: somar([aquecedorDecantado.area]),
    vaporTotal: aquecedorDecantado.consumoVapor,
  }

  for (const a of [
    aquecedorDifusor,
    ...fase1.aquecedores,
    ...fase2.aquecedores,
    ...caldoEtanol.aquecedores,
    aquecedorDecantado,
  ]) {
    if (a.inviavel) {
      avisos.push({
        nivel: 'erro',
        setor: a.nome.includes('difusor') ? 'Extração' : 'Tratamento de caldo',
        mensagem: `${a.nome}: a temperatura do vapor (${a.tVapor.toFixed(1)} °C) precisa ser maior que a do caldo. Troque o vapor ou reduza a temperatura de saída.`,
      })
    }
  }

  // ---- Destilação: consumo de vapor [DS C32:C41, AC34]
  const consumoEspecificoCana =
    p.destilacaoVaporCoef * Math.pow(e.etanol.glVinho, -p.destilacaoVaporExp)
  const vaporDestCana = e.etanol.colunasABLigadas
    ? (consumoEspecificoCana * hidratadoEquivalente) / 24
    : 0
  const vaporColunaC = e.etanol.colunaCLigada ? (e.etanol.consumoColunaC * anidro) / 24 : 0
  const consumoEspecificoMilho =
    e.milho.glVinho > 0 ? p.destilacaoVaporCoef * Math.pow(e.milho.glVinho, -p.destilacaoVaporExp) : 0
  const vaporDestMilho = e.milho.destilacaoLigada
    ? consumoEspecificoMilho * (e.milho.moagem / 24) * (e.milho.rendimento / 1000)
    : 0
  const vaporDestilacao = vaporDestCana + vaporColunaC + vaporDestMilho
  const vaporPlantaMilho = (e.milho.vaporV1 / 1000) * (e.milho.moagem / 24) // [EV R14]

  // ---- Sangrias de vapor vegetal [EV R8:AD14 / C1 C13:K19]
  const gruposAcucar = [fase1, fase2, decantado]
  const sangrias: LinhaSangria[] = [
    {
      consumidor: 'Aquecimento do caldo (açúcar)',
      V1: vaporPorFonte(gruposAcucar, 'V1'),
      V2: vaporPorFonte(gruposAcucar, 'V2'),
      V3: vaporPorFonte(gruposAcucar, 'V3'),
    },
    {
      consumidor: 'Aquecimento do caldo (etanol)',
      V1: vaporPorFonte([caldoEtanol], 'V1'),
      V2: vaporPorFonte([caldoEtanol], 'V2'),
      V3: vaporPorFonte([caldoEtanol], 'V3'),
    },
    { consumidor: 'Cozimento – massa A', V1: 0, V2: vaporMassaA, V3: 0 },
    {
      consumidor: 'Cozimento – massa B',
      V1: 0,
      V2: cz.vaporMassaB === 'V2' ? vaporMassaB : 0,
      V3: cz.vaporMassaB === 'V3' ? vaporMassaB : 0,
    },
    { consumidor: 'Destilaria', V1: vaporDestilacao, V2: 0, V3: 0 },
    { consumidor: 'Extração (difusor)', V1: difusorPorFonte('V1'), V2: difusorPorFonte('V2'), V3: 0 },
    { consumidor: 'Planta de milho', V1: vaporPlantaMilho, V2: 0, V3: 0 },
  ]
  const sangriaTotal = {
    V1: somar(sangrias.map((s) => s.V1)),
    V2: somar(sangrias.map((s) => s.V2)),
    V3: somar(sangrias.map((s) => s.V3)),
  }

  // ---- Evaporação: distribuição por efeito [C1 C6:K12, K23]
  const n = e.evaporacao.numeroEfeitos
  const sangriaEfeito = [sangriaTotal.V1, sangriaTotal.V2, sangriaTotal.V3, 0, 0, 0]
  const ponderada = sangriaEfeito.reduce((s, v, i) => s + v * (i + 1), 0) // [C1 K23]
  const ultimo = (evaporadoTotal - ponderada) / n // [C1 J8 / K8]
  const evaporado: number[] = new Array<number>(n).fill(0)
  evaporado[n - 1] = ultimo
  for (let i = n - 2; i >= 0; i--) evaporado[i] = evaporado[i + 1] + sangriaEfeito[i]
  if (ultimo < 0) {
    avisos.push({
      nivel: 'erro',
      setor: 'Evaporação',
      mensagem:
        'As sangrias de vapor vegetal pedem mais evaporação do que o caldo permite. Reduza sangrias ou aumente o caldo para açúcar.',
    })
  }

  const efeitos: ResultadoEfeito[] = []
  let entrada = caldoAcucarTh
  let brixEntrada = dec.brix
  for (let i = 0; i < n; i++) {
    const cfg = e.evaporacao.efeitos[i]
    const area = cfg.caixas * cfg.areaPorCaixa
    const saida = entrada - evaporado[i]
    const brixSaida = (entrada * brixEntrada) / saida
    const ultimoEfeito = i === n - 1
    efeitos.push({
      numero: i + 1,
      pressaoAbs: ultimoEfeito ? pVacuo : pAbs[i],
      temperatura: ultimoEfeito ? tVacuo : tVeg[i],
      entrada,
      saida,
      evaporado: evaporado[i],
      brixEntrada,
      brixSaida,
      taxa: area > 0 ? (evaporado[i] * 1000) / area : Number.NaN,
      taxaMaxima: cfg.taxaMaxima,
      areaInstalada: area,
      areaNecessaria: cfg.taxaMaxima > 0 ? (evaporado[i] * 1000) / cfg.taxaMaxima : Number.NaN,
      sangria: sangriaEfeito[i],
    })
    entrada = saida
    brixEntrada = brixSaida
  }
  const vaporEscape = evaporado[0] // 1 kg de vapor por kg evaporado [EV L28]
  const vaporCondensador = evaporado[n - 1] // [EV AU16]
  const aguaCondensador =
    (p.condensadorConstante * vaporCondensador) /
    (e.evaporacao.tAguaSaida - e.evaporacao.tAguaEntrada) // [EV AU21]
  const xaropeTemperatura = (n === 5 ? tVacuo : tVeg[4]) + 4 // [EV F43]

  // ---- Capacidade: necessário × instalado [CP]
  const lim = e.limites
  const itens: ItemCapacidade[] = [
    itemCapacidade('Extração', 'Moagem', tch, e.extracao.capacidadeNominal, 'tch', lim.extracao, tch),
    itemCapacidade(
      'Extração',
      aquecedorDifusor.nome,
      aquecedorDifusor.area,
      aquecedorDifusor.areaInstalada,
      'm²',
      lim.extracao,
      tch,
    ),
    ...[...fase1.aquecedores, ...fase2.aquecedores, ...caldoEtanol.aquecedores, aquecedorDecantado].map(
      (a) =>
        itemCapacidade('Tratamento de caldo', a.nome, a.area, a.areaInstalada, 'm²', lim.tratamento, tch),
    ),
    ...efeitos.map((f) =>
      itemCapacidade(
        'Evaporação',
        `${f.numero}º efeito (taxa de evaporação)`,
        f.taxa,
        f.taxaMaxima,
        'kg/m²·h',
        lim.evaporacao,
        tch,
      ),
    ),
    itemCapacidade(
      'Cozimento',
      'Tachos de massa A (volume)',
      volumeTachosA,
      cz.volumeTachosA,
      'm³',
      lim.cozimento,
      tch,
    ),
    itemCapacidade(
      'Cozimento',
      'Tachos de massa B (volume)',
      volumeTachosB,
      cz.volumeTachosB,
      'm³',
      lim.cozimento,
      tch,
    ),
    itemCapacidade('Cozimento', 'Secador de açúcar', acucarTh, cz.capacidadeSecador, 't/h', lim.cozimento, tch),
    itemCapacidade(
      'Destilaria',
      'Destilaria (hidratado equivalente)',
      hidratadoEquivalente,
      e.etanol.capacidadeDestilaria,
      'm³/dia',
      lim.destilaria,
      tch,
    ),
  ]
  const ocupacoes = itens.map((i) => i.ocupacao).filter((o): o is number => o !== null)
  const maiorOcupacao = ocupacoes.length ? Math.max(...ocupacoes) : 0
  const maximas = itens.map((i) => i.moagemMaxima).filter((m): m is number => m !== null)
  const moagemMaxima = maximas.length ? Math.min(...maximas) : null
  const limiteExcedido = moagemMaxima !== null && moagemMaxima < tch
  if (limiteExcedido) {
    avisos.push({
      nivel: 'erro',
      setor: itens.find((i) => i.moagemMaxima === moagemMaxima)?.setor ?? 'Balanço',
      mensagem: `Limite excedido: a moagem máxima estimada pelos setores com limite ativo é ${Math.floor(moagemMaxima)} tch.`,
    })
  }
  for (const item of itens) {
    if (item.situacao === 'acima') {
      avisos.push({
        nivel: 'atencao',
        setor: item.setor,
        mensagem: `${item.equipamento}: ${((item.ocupacao ?? 0) * 100).toFixed(0)}% de ocupação (necessário acima do instalado).`,
      })
    }
  }

  return {
    balanco: {
      moagemTcd,
      diasSafra,
      artCana,
      aguaEmbebicao,
      bagacoKgTc,
      bagacoTh,
      lodoTh,
      caldoTotalTh,
      caldoTotalM3h,
      densidadeCaldoMisto,
      polCaldoMisto,
      artCaldoMisto,
      caldoAcucarTh,
      caldoAcucarM3h,
      caldoAcucarMaximo: caldoTotalTh / densidadeDecantado,
      caldoEtanolTh,
      caldoEtanolM3h,
      fechado,
    },
    producao: {
      acucarTh,
      acucarTdia,
      acucarSacasDia,
      acucarSafra: acucarTdia * diasSafra,
      hidratadoM3dia: hidratado,
      anidroM3dia: anidro,
      hidratadoEquivalenteM3dia: hidratadoEquivalente,
      etanolSafra: (hidratado + anidro) * diasSafra,
      etanolMilhoM3dia: etanolMilho,
      mixAcucar,
      recuperacaoArt,
      rtc,
      moagemAcucarTch,
      moagemEtanolTch: tch - moagemAcucarTch,
      artEntrada,
      artAcucar,
      artHidratado,
      artAnidro,
    },
    vapor: { tEscape, tV1, tV2, tV3 },
    extracao: {
      vaporCaptadores,
      vaporAquecimentoCaldoMisto,
      aquecedorDifusor,
      vaporEmbebicao,
      tEmbebicao,
      flegmaca,
    },
    aquecimento: {
      fase1,
      fase2,
      caldoEtanol,
      decantado,
      antesDecantador: {
        area: fase1.areaTotal + fase2.areaTotal + caldoEtanol.areaTotal,
        vapor: fase1.vaporTotal + fase2.vaporTotal + caldoEtanol.vaporTotal,
      },
      aposDecantador: { area: decantado.areaTotal, vapor: decantado.vaporTotal },
    },
    destilacao: {
      consumoEspecificoCana,
      vaporCana: vaporDestCana,
      vaporColunaC,
      consumoEspecificoMilho,
      vaporMilho: vaporDestMilho,
      vaporTotal: vaporDestilacao,
    },
    evaporacao: {
      efeitos,
      caldoEntrada: caldoAcucarTh,
      brixEntrada: dec.brix,
      evaporadoTotal,
      vaporEscape,
      sangrias,
      sangriaTotal,
      xaropeTh,
      xaropeBrix: brixXarope,
      xaropeTemperatura,
      vaporCondensador,
      aguaCondensador,
      areaInstaladaTotal: somar(efeitos.map((f) => f.areaInstalada)),
      areaNecessariaTotal: somar(efeitos.map((f) => f.areaNecessaria)),
    },
    cozimento: {
      solidosXarope,
      polXarope,
      sjm,
      acucar: acucarTh,
      solidosMelFinal,
      melFinalM3h,
      solidosMassaB,
      solidosMagma,
      massaA: {
        xaropeSolidos: xaropeMassaA,
        magmaSolidos: solidosMagma,
        massaSolidos: massaASolidos,
        melASolidos: melAProduzido,
        xaropeVazao: (xaropeMassaA / brixXarope) * 100, // [CZ E32]
        magmaVazao: (solidosMagma / cz.magma.brix) * 100, // [CZ E33]
        melAVazao: (melAProduzido / cz.melA.brix) * 100, // [CZ I51]
        aguaEvaporada: aguaMassaA,
        vapor: vaporMassaA,
        massaVazao: massaAVazao,
        volumeNecessario: volumeTachosA,
      },
      massaB: {
        sementeSolidos,
        sementeXaropeSolidos: sementeXarope,
        sementeMelASolidos: sementeMelA,
        melASolidos: melAParaMassaB,
        massaSolidos: solidosMassaB,
        melFinalSolidos: solidosMelFinal,
        magmaSolidos: solidosMagma,
        // DECISÃO PENDENTE: a planilha divide o mel A pelo Brix do mel final [CZ R44 usa R12].
        melAVazao: (melAParaMassaB / cz.melFinal.brix) * 100,
        sementeVazao: (sementeSolidos / cz.semente.brix) * 100, // [CZ R45]
        melFinalVazao: (solidosMelFinal / cz.melFinal.brix) * 100, // [CZ AI44]
        magmaVazao: (solidosMagma / cz.magma.brix) * 100, // [CZ AI45]
        aguaEvaporada: aguaMassaB,
        vapor: vaporMassaB,
        massaVazao: massaBVazao,
        volumeNecessario: volumeTachosB,
      },
      coerente: cozimentoCoerente,
    },
    capacidade: { itens, maiorOcupacao, moagemMaxima, limiteExcedido },
    avisos,
  }
}
