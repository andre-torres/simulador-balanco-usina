import { CampoNumero } from '@/components/campo-numero'
import type { Entradas } from '@/engine'
import { useSimulador } from '@/features/simulador/simulador-provider'

/** Caminhos de `Entradas` que apontam para um número, ex.: "cana.fibra". */
type CaminhoNumerico<T> = T extends readonly unknown[]
  ? never
  : T extends object
    ? {
        [K in keyof T & string]: T[K] extends number
          ? K
          : T[K] extends readonly unknown[]
            ? never
            : T[K] extends object
              ? `${K}.${CaminhoNumerico<T[K]>}`
              : never
      }[keyof T & string]
    : never

export type CaminhoEntrada = CaminhoNumerico<Entradas>

function ler(objeto: unknown, caminho: string): number {
  return caminho.split('.').reduce<unknown>((o, chave) => (o as Record<string, unknown>)[chave], objeto) as number
}

function escrever(objeto: unknown, caminho: string, valor: number): void {
  const chaves = caminho.split('.')
  const ultima = chaves.pop()!
  const alvo = chaves.reduce<unknown>((o, chave) => (o as Record<string, unknown>)[chave], objeto)
  ;(alvo as Record<string, unknown>)[ultima] = valor
}

/** Campo de digitação ligado direto a um valor das entradas da simulação. */
export function CampoEntrada({
  caminho,
  rotulo,
  unidade,
  dica,
  className,
}: {
  caminho: CaminhoEntrada
  rotulo: string
  unidade?: string
  dica?: string
  className?: string
}) {
  const { entradas, alterar } = useSimulador()
  return (
    <CampoNumero
      rotulo={rotulo}
      unidade={unidade}
      dica={dica}
      className={className}
      valor={ler(entradas, caminho)}
      aoMudar={(v) => alterar((rascunho) => escrever(rascunho, caminho, v))}
    />
  )
}
