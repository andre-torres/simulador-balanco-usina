import type { Opcao } from '@/components/apresentacao'
import type { FonteVapor, FonteVaporDifusor, Situacao } from '@/engine'

export const OPCOES_VAPOR: Opcao<FonteVapor>[] = [
  { valor: 'V1', rotulo: 'V1' },
  { valor: 'V2', rotulo: 'V2' },
  { valor: 'V3', rotulo: 'V3' },
  { valor: 'parado', rotulo: 'Parado' },
]

export const OPCOES_VAPOR_DIFUSOR: Opcao<FonteVaporDifusor>[] = [
  { valor: 'V1', rotulo: 'V1' },
  { valor: 'V2', rotulo: 'V2' },
  { valor: 'parado', rotulo: 'Parado' },
]

export const OPCOES_LIGADO: Opcao<'sim' | 'nao'>[] = [
  { valor: 'sim', rotulo: 'Ligada' },
  { valor: 'nao', rotulo: 'Parada' },
]

/** Ocupação = necessário ÷ instalado; mesmas faixas da aba Capacidade. */
export function situacaoDe(
  necessario: number,
  instalado: number,
): { ocupacao: number | null; situacao: Situacao } {
  if (!Number.isFinite(necessario) || !(instalado > 0)) return { ocupacao: null, situacao: 'sem-dado' }
  const ocupacao = necessario / instalado
  return { ocupacao, situacao: ocupacao > 1 ? 'acima' : ocupacao > 0.9 ? 'atencao' : 'ok' }
}
