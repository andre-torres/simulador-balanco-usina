const cache = new Map<number, Intl.NumberFormat>()

function formatador(casas: number): Intl.NumberFormat {
  let f = cache.get(casas)
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    })
    cache.set(casas, f)
  }
  return f
}

/** Número em pt-BR com casas fixas. Valores inválidos viram "–". */
export function num(valor: number | null | undefined, casas = 1): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '–'
  // evita "-0,0"
  const v = Math.abs(valor) < 0.5 * Math.pow(10, -casas) ? 0 : valor
  return formatador(casas).format(v)
}

/** Fração (0,85) como percentual ("85%"). */
export function pct(fracao: number | null | undefined, casas = 0): string {
  if (fracao === null || fracao === undefined || !Number.isFinite(fracao)) return '–'
  return `${num(fracao * 100, casas)}%`
}

/** Lê um número digitado com vírgula ou ponto decimal. */
export function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, '')
  if (limpo === '' || limpo === '-' || limpo === ',' || limpo === '.') return null
  const normalizado =
    limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const valor = Number(normalizado)
  return Number.isFinite(valor) ? valor : null
}

/** Texto de edição: sem separador de milhar, vírgula decimal, sem zeros sobrando. */
export function textoEdicao(valor: number): string {
  if (!Number.isFinite(valor)) return ''
  return String(Number(valor.toPrecision(12))).replace('.', ',')
}

export function dataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
