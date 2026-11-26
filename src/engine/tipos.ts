/**
 * Tipos do motor de cálculo.
 *
 * O motor não importa nada de React nem do navegador: recebe `Entradas`,
 * devolve `Resultado`. Pode ser movido para o servidor sem alteração.
 */

export type FonteVapor = 'V1' | 'V2' | 'V3' | 'parado'
export type FonteVaporDifusor = 'V1' | 'V2' | 'parado'

/** Aquecedor de caldo (casco e tubos). */
export interface Aquecedor {
  vapor: FonteVapor
  /** °C. `null` = usa a saída do aquecedor anterior (ou a temperatura do fluxo, no primeiro). */
  tEntrada: number | null
  /** °C */
  tSaida: number
  /** m² instalados (para a ocupação). */
  areaInstalada: number
}

export interface EfeitoEvaporacao {
  caixas: number
  /** m² por caixa */
  areaPorCaixa: number
  /** kg/m²·h */
  taxaMaxima: number
}

export interface CorrenteCozimento {
  /** % */
  pureza: number
  /** % */
  brix: number
}

export interface Premissas {
  /** L de etanol por tonelada de cana equivalente (milho → cana) */
  litrosEtanolPorTcEquivalente: number
  /** ART do caldo misto = (a × pureza + b) × Brix / 100 */
  artCaldoMistoA: number
  artCaldoMistoB: number
  /** L de flegmaça por L de etanol */
  flegmacaPorLitro: number
  /** kg de sacarose por kg de ART */
  fatorSacaroseArt: number
  /** Pol do açúcar no cálculo de ART (fração) */
  polAcucarArt: number
  /** L de etanol absoluto por kg de ART (estequiométrico) */
  litrosEtanolPorKgArt: number
  rtcPolAcucar: number
  rtcKgArtPorSaca: number
  rtcLitrosEtanolPorKgArt: number
  /** fração v/v */
  teorHidratado: number
  /** fração v/v */
  teorAnidro: number
  /** kcal/kg — água do condensador */
  condensadorConstante: number
  /** % — pureza do açúcar na fórmula SJM */
  purezaAcucar: number
  /** t/m³ */
  densidadeMel: number
  /** kg de vapor por kg de água evaporada */
  fatorVaporMassaA: number
  fatorVaporMassaB: number
  /** t/m³ */
  densidadeMassaCozida: number
  /** h — índice de tempo de cozimento */
  tempoCozimentoA: number
  tempoCozimentoB: number
  /** Vapor da destilação = coef × °GL ^ −expoente (t/m³) */
  destilacaoVaporCoef: number
  destilacaoVaporExp: number
  /** Calor latente = A − B × t (kcal/kg) */
  calorLatenteA: number
  calorLatenteBAquecedor: number
  /** t sat = exp(−A·ln²P + B·lnP + C), P em kgf/cm² abs */
  tsatA: number
  tsatB: number
  tsatC: number
  /** cp = 1 − coef × Brix */
  cpBrix: number
  /** Densidade (Lyle) */
  lyleA: number
  lyleB: number
  lyleC: number
  /** K = coef × t vapor × (u / uRef)^exp, em W/m²·K (Rein, eq. 9.18) */
  kCoefW: number
  kVelocidadeRef: number
  kExpoente: number
  /** W/m²·K → kcal/m²·h·°C */
  wParaKcal: number
  /** kg por saca */
  kgPorSaca: number
}

export interface Entradas {
  cana: {
    /** t/safra */
    moagemSafra: number
    /** t/h */
    moagemTch: number
    /** % */
    disponibilidade: number
    /** % cana */
    fibra: number
    /** PC da cana, % */
    pc: number
    /** AR da cana, % */
    ar: number
    /** Embebição % fibra */
    embebicaoFibra: number
  }
  bagaco: {
    /** % */
    umidade: number
    /** Pureza do caldo do último terno, % */
    purezaUltimoTerno: number
    /** Pol do bagaço, % */
    pol: number
  }
  caldo: {
    /** Caldo decantado enviado à fábrica de açúcar, m³/h */
    caldoAcucar: number
    /** Lodo % cana */
    lodo: number
    /** Brix do caldo misto, % */
    brixMisto: number
    /** Pureza do caldo misto, % */
    purezaMisto: number
  }
  /** Tudo em % */
  eficiencias: {
    extracao: number
    tratamento: number
    fermentacao: number
    destilacao: number
    perdasIndeterminadas: number
  }
  etanol: {
    /** Produção de anidro, m³/dia (entrada) */
    anidro: number
    /** °GL do vinho bruto */
    glVinho: number
    /** Capacidade da destilaria, m³/dia de hidratado equivalente */
    capacidadeDestilaria: number
    colunasABLigadas: boolean
    colunaCLigada: boolean
    /** t de vapor por m³ de anidro */
    consumoColunaC: number
  }
  milho: {
    /** t/dia */
    moagem: number
    /** °GL do vinho */
    glVinho: number
    /** L de hidratado por t de milho */
    rendimento: number
    /** kg de V1 por t de milho */
    vaporV1: number
    destilacaoLigada: boolean
  }
  extracao: {
    /** tch */
    capacidadeNominal: number
    /** Temperatura do caldo misto na saída da extração, °C */
    tempCaldoMisto: number
    captadores: {
      quantidade: number
      /** m³/h por captador */
      vazaoPorCaptador: number
      tEntrada: number
      tSaida: number
      vapor: FonteVaporDifusor
    }
    /** Aquecimento do caldo misto (sem cálculo de área na planilha). Entrada = tempCaldoMisto. */
    aquecimentoCaldoMisto: {
      tSaida: number
      vapor: FonteVaporDifusor
    }
    /** Aquecedor de caldo do difusor (com cálculo de área). */
    aquecedorDifusor: {
      tEntrada: number
      tSaida: number
      vapor: FonteVaporDifusor
      /** m² de seção de passagem */
      secao: number
      areaInstalada: number
    }
    embebicao: {
      vapor: FonteVaporDifusor
      /** t/h de condensado na embebição */
      condensado: number
      tCondensado: number
      tFlegmaca: number
      tAguaBruta: number
      tSaida: number
    }
  }
  tratamento: {
    /** % do caldo misto enviada à Fase 1 (o restante vai para a Fase 2) */
    fracaoFase1: number
    fase1: {
      tEntrada: number
      linhas: number
      /** m² por linha */
      secao: number
      aquecedores: Aquecedor[]
    }
    fase2: {
      tEntrada: number
      secao: number
      aquecedores: Aquecedor[]
    }
    caldoEtanol: {
      temperatura: number
      brix: number
      secao: number
      aquecedores: Aquecedor[]
    }
    /** Aquecedor de caldo decantado (após o decantador, antes da evaporação). */
    decantado: {
      temperatura: number
      brix: number
      tSaida: number
      vapor: 'V1' | 'parado'
      linhas: number
      secao: number
      areaInstalada: number
    }
  }
  evaporacao: {
    /** kgf/cm² man. */
    pressaoEscape: number
    /** kgf/cm² man. — vapor vegetal dos efeitos 1 a 5 */
    pressoes: [number, number, number, number, number]
    /** polHg no último corpo */
    vacuo: number
    /** Brix do xarope, % */
    brixXarope: number
    numeroEfeitos: 5 | 6
    tAguaEntrada: number
    tAguaSaida: number
    efeitos: EfeitoEvaporacao[]
  }
  cozimento: {
    purezaXarope: number
    brixMassaA: number
    massaB: CorrenteCozimento
    magma: CorrenteCozimento
    semente: CorrenteCozimento
    melA: CorrenteCozimento
    melFinal: CorrenteCozimento
    vaporMassaB: 'V2' | 'V3'
    /** m³ instalados */
    volumeTachosA: number
    volumeTachosB: number
    /** t/h */
    capacidadeSecador: number
  }
  /** true = o setor limita a moagem máxima; false = só indica a ocupação */
  limites: {
    extracao: boolean
    tratamento: boolean
    evaporacao: boolean
    cozimento: boolean
    destilaria: boolean
  }
  premissas: Premissas
}

// ---------------------------------------------------------------- Resultado

export type Setor = 'Extração' | 'Tratamento de caldo' | 'Evaporação' | 'Cozimento' | 'Destilaria'
export type Situacao = 'ok' | 'atencao' | 'acima' | 'sem-dado'

export interface ItemCapacidade {
  setor: Setor
  equipamento: string
  necessario: number
  instalado: number
  unidade: string
  /** fração (1 = 100%). `null` quando não há instalado informado. */
  ocupacao: number | null
  situacao: Situacao
  limiteAtivo: boolean
  /** tch, só quando o limite do setor está ativo */
  moagemMaxima: number | null
}

export interface ResultadoAquecedor {
  nome: string
  vapor: FonteVapor
  tEntrada: number
  tSaida: number
  tVapor: number
  /** m/s */
  velocidade: number
  /** kcal/m²·h·°C */
  k: number
  /** m² necessários */
  area: number
  areaInstalada: number
  /** t/h */
  consumoVapor: number
  /** Temperatura de saída ≥ temperatura do vapor: não há troca possível */
  inviavel: boolean
}

export interface GrupoAquecimento {
  nome: string
  /** t/h */
  vazaoMassa: number
  /** m³/h */
  vazaoVolume: number
  brix: number
  aquecedores: ResultadoAquecedor[]
  areaTotal: number
  vaporTotal: number
}

export interface ResultadoEfeito {
  numero: number
  /** kgf/cm² abs do vapor gerado */
  pressaoAbs: number
  /** °C do vapor gerado */
  temperatura: number
  entrada: number
  saida: number
  evaporado: number
  brixEntrada: number
  brixSaida: number
  /** kg/m²·h */
  taxa: number
  taxaMaxima: number
  areaInstalada: number
  /** m² para evaporar a carga na taxa máxima */
  areaNecessaria: number
  /** t/h de vapor vegetal sangrado deste efeito */
  sangria: number
}

export interface LinhaSangria {
  consumidor: string
  V1: number
  V2: number
  V3: number
}

export type NivelAviso = 'erro' | 'atencao'
export interface Aviso {
  nivel: NivelAviso
  setor: Setor | 'Balanço'
  mensagem: string
}

export interface Resultado {
  balanco: {
    moagemTcd: number
    diasSafra: number
    artCana: number
    aguaEmbebicao: number
    bagacoKgTc: number
    bagacoTh: number
    lodoTh: number
    caldoTotalTh: number
    caldoTotalM3h: number
    densidadeCaldoMisto: number
    polCaldoMisto: number
    artCaldoMisto: number
    caldoAcucarTh: number
    caldoAcucarM3h: number
    /** Maior vazão de caldo decantado para açúcar que o caldo total comporta, m³/h */
    caldoAcucarMaximo: number
    caldoEtanolTh: number
    caldoEtanolM3h: number
    fechado: boolean
  }
  producao: {
    acucarTh: number
    acucarTdia: number
    acucarSacasDia: number
    acucarSafra: number
    hidratadoM3dia: number
    anidroM3dia: number
    hidratadoEquivalenteM3dia: number
    etanolSafra: number
    etanolMilhoM3dia: number
    /** fração */
    mixAcucar: number
    recuperacaoArt: number
    rtc: number
    moagemAcucarTch: number
    moagemEtanolTch: number
    /** kg/dia */
    artEntrada: number
    artAcucar: number
    artHidratado: number
    artAnidro: number
  }
  vapor: {
    /** °C */
    tEscape: number
    tV1: number
    tV2: number
    tV3: number
  }
  extracao: {
    vaporCaptadores: number
    vaporAquecimentoCaldoMisto: number
    aquecedorDifusor: ResultadoAquecedor
    vaporEmbebicao: number
    tEmbebicao: number
    flegmaca: number
  }
  aquecimento: {
    fase1: GrupoAquecimento
    fase2: GrupoAquecimento
    caldoEtanol: GrupoAquecimento
    decantado: GrupoAquecimento
    antesDecantador: { area: number; vapor: number }
    aposDecantador: { area: number; vapor: number }
  }
  destilacao: {
    consumoEspecificoCana: number
    vaporCana: number
    vaporColunaC: number
    consumoEspecificoMilho: number
    vaporMilho: number
    vaporTotal: number
  }
  evaporacao: {
    efeitos: ResultadoEfeito[]
    caldoEntrada: number
    brixEntrada: number
    evaporadoTotal: number
    vaporEscape: number
    sangrias: LinhaSangria[]
    sangriaTotal: { V1: number; V2: number; V3: number }
    xaropeTh: number
    xaropeBrix: number
    xaropeTemperatura: number
    vaporCondensador: number
    aguaCondensador: number
    areaInstaladaTotal: number
    areaNecessariaTotal: number
  }
  cozimento: {
    solidosXarope: number
    polXarope: number
    sjm: number
    acucar: number
    solidosMelFinal: number
    melFinalM3h: number
    solidosMassaB: number
    solidosMagma: number
    massaA: {
      xaropeSolidos: number
      magmaSolidos: number
      massaSolidos: number
      melASolidos: number
      xaropeVazao: number
      magmaVazao: number
      melAVazao: number
      aguaEvaporada: number
      vapor: number
      /** t/h de massa cozida */
      massaVazao: number
      volumeNecessario: number
    }
    massaB: {
      sementeSolidos: number
      sementeXaropeSolidos: number
      sementeMelASolidos: number
      melASolidos: number
      massaSolidos: number
      melFinalSolidos: number
      magmaSolidos: number
      melAVazao: number
      sementeVazao: number
      melFinalVazao: number
      magmaVazao: number
      aguaEvaporada: number
      vapor: number
      massaVazao: number
      volumeNecessario: number
    }
    coerente: boolean
  }
  capacidade: {
    itens: ItemCapacidade[]
    maiorOcupacao: number
    /** tch — menor moagem máxima entre os setores com limite ativo */
    moagemMaxima: number | null
    limiteExcedido: boolean
  }
  avisos: Aviso[]
}
