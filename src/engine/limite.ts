import { calcular } from './calcular'
import type { Entradas } from './tipos'

/**
 * Trava automática: encontra a maior moagem em que nenhum equipamento dos
 * setores com limite ativo passa de 100% de ocupação.
 *
 * A moagem e o caldo para açúcar são reduzidos na mesma proporção (o mix é
 * mantido). Reduzir só a moagem não alivia a fábrica de açúcar, porque a carga
 * dela vem do caldo para açúcar, que é uma entrada.
 *
 * Devolve `null` quando não há limite excedido ou quando a redução não resolve
 * (por exemplo, um consumo fixo que não depende da moagem).
 */
export function reduzirAoLimite(e: Entradas): Entradas | null {
  if (!calcular(e).capacidade.limiteExcedido) return null

  const escalar = (fator: number): Entradas => {
    const copia = structuredClone(e)
    copia.cana.moagemTch = e.cana.moagemTch * fator
    copia.caldo.caldoAcucar = e.caldo.caldoAcucar * fator
    return copia
  }
  const dentro = (fator: number): boolean => !calcular(escalar(fator)).capacidade.limiteExcedido

  let baixo = 0.01
  let alto = 1
  if (!dentro(baixo)) return null
  for (let i = 0; i < 40; i++) {
    const meio = (baixo + alto) / 2
    if (dentro(meio)) baixo = meio
    else alto = meio
  }

  // arredonda a moagem para baixo (tch inteiro) e aplica o mesmo fator ao caldo
  const moagem = Math.floor(e.cana.moagemTch * baixo)
  if (moagem <= 0) return null
  const fator = moagem / e.cana.moagemTch
  const ajustado = escalar(fator)
  ajustado.cana.moagemTch = moagem
  ajustado.caldo.caldoAcucar = Math.floor(e.caldo.caldoAcucar * fator * 10) / 10
  return ajustado
}
