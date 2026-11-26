import { RotateCcw } from 'lucide-react'

import { CampoNumero } from '@/components/campo-numero'
import { GradeCampos, Pagina, Secao } from '@/components/apresentacao'
import { Button } from '@/components/ui/button'
import { PREMISSAS_PADRAO, type Premissas as TipoPremissas } from '@/engine'
import { useSimulador } from '@/features/simulador/simulador-provider'

type Item = [chave: keyof TipoPremissas, rotulo: string, unidade?: string]

const GRUPOS: { titulo: string; descricao?: string; itens: Item[] }[] = [
  {
    titulo: 'ART, açúcar e etanol',
    itens: [
      ['fatorSacaroseArt', 'Sacarose por kg de ART', 'kg/kg'],
      ['polAcucarArt', 'Pol do açúcar no cálculo de ART', 'fração'],
      ['litrosEtanolPorKgArt', 'Etanol absoluto por kg de ART', 'L/kg'],
      ['teorHidratado', 'Teor do etanol hidratado', 'v/v'],
      ['teorAnidro', 'Teor do etanol anidro', 'v/v'],
      ['kgPorSaca', 'Peso da saca de açúcar', 'kg'],
      ['rtcPolAcucar', 'RTC: pol do açúcar', 'fração'],
      ['rtcKgArtPorSaca', 'RTC: ART por saca', 'kg/saca'],
      ['rtcLitrosEtanolPorKgArt', 'RTC: etanol por kg de ART', 'L/kg'],
      ['artCaldoMistoA', 'ART do caldo misto: coeficiente da pureza'],
      ['artCaldoMistoB', 'ART do caldo misto: termo constante'],
      ['litrosEtanolPorTcEquivalente', 'Etanol por t de cana equivalente', 'L/tc'],
    ],
  },
  {
    titulo: 'Cozimento',
    itens: [
      ['purezaAcucar', 'Pureza do açúcar na fórmula SJM', '%'],
      ['densidadeMel', 'Densidade do mel', 't/m³'],
      ['densidadeMassaCozida', 'Densidade da massa cozida', 't/m³'],
      ['fatorVaporMassaA', 'Massa A: vapor por kg evaporado', 'kg/kg'],
      ['fatorVaporMassaB', 'Massa B: vapor por kg evaporado', 'kg/kg'],
      ['tempoCozimentoA', 'Índice de tempo de cozimento, massa A', 'h'],
      ['tempoCozimentoB', 'Índice de tempo de cozimento, massa B', 'h'],
    ],
  },
  {
    titulo: 'Evaporação, destilação e extração',
    itens: [
      ['condensadorConstante', 'Condensador: calor por kg de vapor', 'kcal/kg'],
      ['destilacaoVaporCoef', 'Vapor da destilação: coeficiente', 't/m³'],
      ['destilacaoVaporExp', 'Vapor da destilação: expoente'],
      ['flegmacaPorLitro', 'Flegmaça por litro de etanol', 'L/L'],
    ],
  },
  {
    titulo: 'Propriedades do vapor e do caldo',
    descricao:
      'Calor latente = A − B × t. Temperatura de saturação = exp(−A·ln²P + B·lnP + C), P em kgf/cm² abs. Calor específico = 1 − coef. × Brix. Densidade pela equação de Lyle.',
    itens: [
      ['calorLatenteA', 'Calor latente: A', 'kcal/kg'],
      ['calorLatenteBAquecedor', 'Calor latente: B', 'kcal/kg·°C'],
      ['tsatA', 'Saturação: A'],
      ['tsatB', 'Saturação: B'],
      ['tsatC', 'Saturação: C'],
      ['cpBrix', 'Calor específico: coef. do Brix'],
      ['lyleA', 'Lyle: termo somado ao Brix'],
      ['lyleB', 'Lyle: divisor'],
      ['lyleC', 'Lyle: coef. de temperatura'],
    ],
  },
  {
    titulo: 'Coeficiente K dos aquecedores',
    descricao: 'K = coef. × t vapor × (u ÷ u ref.)^expoente, em W/m²·K (Rein, eq. 9.18).',
    itens: [
      ['kCoefW', 'Coeficiente', 'W/m²·K/°C'],
      ['kVelocidadeRef', 'Velocidade de referência', 'm/s'],
      ['kExpoente', 'Expoente da velocidade'],
      ['wParaKcal', 'W/m²·K → kcal/m²·h·°C'],
    ],
  },
]

export function Premissas() {
  const { entradas: e, alterar } = useSimulador()
  const alteradas = (Object.keys(PREMISSAS_PADRAO) as (keyof TipoPremissas)[]).filter(
    (k) => e.premissas[k] !== PREMISSAS_PADRAO[k],
  ).length

  return (
    <Pagina
      titulo="Premissas"
      descricao="Constantes de processo e correlações usadas no cálculo. Altere somente se tiver base para isso; valem só para esta simulação."
      acoes={
        <Button
          variant="outline"
          size="sm"
          disabled={alteradas === 0}
          onClick={() => alterar((d) => void (d.premissas = structuredClone(PREMISSAS_PADRAO)))}
        >
          <RotateCcw />
          Restaurar padrão{alteradas > 0 ? ` (${alteradas} alterada${alteradas > 1 ? 's' : ''})` : ''}
        </Button>
      }
    >
      {GRUPOS.map((g) => (
        <Secao key={g.titulo} titulo={g.titulo} descricao={g.descricao}>
          <GradeCampos>
            {g.itens.map(([chave, rotulo, unidade]) => (
              <CampoNumero
                key={chave}
                rotulo={rotulo}
                unidade={unidade}
                valor={e.premissas[chave]}
                aoMudar={(v) => alterar((d) => void (d.premissas[chave] = v))}
              />
            ))}
          </GradeCampos>
        </Secao>
      ))}
    </Pagina>
  )
}
