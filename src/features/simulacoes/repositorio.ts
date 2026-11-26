import { ENTRADAS_PADRAO, type Entradas } from '@/engine'
import { supabase } from '@/lib/supabase'

export interface Simulacao {
  id: string
  nome: string
  entradas: Entradas
  criadoEm: string
  atualizadoEm: string
}

export interface Repositorio {
  listar(): Promise<Simulacao[]>
  obter(id: string): Promise<Simulacao | null>
  criar(nome: string, entradas: Entradas): Promise<Simulacao>
  salvar(id: string, dados: { nome: string; entradas: Entradas }): Promise<void>
  excluir(id: string): Promise<void>
}

/** Versão do modelo de cálculo gravada com cada simulação. */
export const VERSAO_MOTOR = '2.2'

/**
 * Completa uma simulação salva com os campos que faltarem (por exemplo, um
 * parâmetro criado depois que ela foi gravada), usando o cenário padrão.
 */
export function normalizarEntradas(salvo: unknown): Entradas {
  const entradas = mesclar(ENTRADAS_PADRAO, salvo) as Entradas
  // A entrada de cada aquecedor aceita `null` (= saída do aquecedor anterior),
  // que a mescla genérica não distingue de "campo ausente".
  const tratamento = (salvo as { tratamento?: Record<string, { aquecedores?: unknown }> } | null)?.tratamento
  for (const grupo of ['fase1', 'fase2', 'caldoEtanol'] as const) {
    const salvos = tratamento?.[grupo]?.aquecedores
    if (!Array.isArray(salvos)) continue
    entradas.tratamento[grupo].aquecedores.forEach((aquecedor, i) => {
      const t = (salvos[i] as { tEntrada?: unknown } | undefined)?.tEntrada
      if (t === null || typeof t === 'number') aquecedor.tEntrada = t
    })
  }
  return entradas
}

function mesclar(padrao: unknown, salvo: unknown): unknown {
  if (Array.isArray(padrao)) {
    if (!Array.isArray(salvo) || salvo.length !== padrao.length) return structuredClone(padrao)
    return padrao.map((item, i) => mesclar(item, salvo[i]))
  }
  if (padrao !== null && typeof padrao === 'object') {
    const origem = salvo !== null && typeof salvo === 'object' ? (salvo as Record<string, unknown>) : {}
    const saida: Record<string, unknown> = {}
    for (const [chave, valor] of Object.entries(padrao)) saida[chave] = mesclar(valor, origem[chave])
    return saida
  }
  if (padrao === null) return typeof salvo === 'number' ? salvo : null
  return typeof salvo === typeof padrao ? salvo : padrao
}

// ---------------------------------------------------------------- Supabase

interface Linha {
  id: string
  nome: string
  entradas: unknown
  criado_em: string
  atualizado_em: string
}

function deLinha(l: Linha): Simulacao {
  return {
    id: l.id,
    nome: l.nome,
    entradas: normalizarEntradas(l.entradas),
    criadoEm: l.criado_em,
    atualizadoEm: l.atualizado_em,
  }
}

const COLUNAS = 'id, nome, entradas, criado_em, atualizado_em'

function repositorioSupabase(): Repositorio {
  const db = supabase!
  return {
    async listar() {
      const { data, error } = await db
        .from('simulacoes')
        .select(COLUNAS)
        .order('atualizado_em', { ascending: false })
      if (error) throw new Error(error.message)
      return (data as Linha[]).map(deLinha)
    },
    async obter(id) {
      const { data, error } = await db.from('simulacoes').select(COLUNAS).eq('id', id).maybeSingle()
      if (error) throw new Error(error.message)
      return data ? deLinha(data as Linha) : null
    },
    async criar(nome, entradas) {
      // user_id é preenchido no banco com auth.uid()
      const { data, error } = await db
        .from('simulacoes')
        .insert({ nome, entradas, versao_motor: VERSAO_MOTOR })
        .select(COLUNAS)
        .single()
      if (error) throw new Error(error.message)
      return deLinha(data as Linha)
    },
    async salvar(id, dados) {
      const { error } = await db
        .from('simulacoes')
        .update({ nome: dados.nome, entradas: dados.entradas, versao_motor: VERSAO_MOTOR })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    async excluir(id) {
      const { error } = await db.from('simulacoes').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
  }
}

// ------------------------------------------------- navegador (demonstração)

const CHAVE = 'balanco-usina:simulacoes'

function lerLocal(): Simulacao[] {
  try {
    const bruto = localStorage.getItem(CHAVE)
    const lista = bruto ? (JSON.parse(bruto) as Simulacao[]) : []
    return lista.map((s) => ({ ...s, entradas: normalizarEntradas(s.entradas) }))
  } catch {
    return []
  }
}

function gravarLocal(lista: Simulacao[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista))
  } catch {
    // armazenamento indisponível: a simulação vale só enquanto a aba estiver aberta
  }
}

function repositorioLocal(): Repositorio {
  let memoria = lerLocal()
  return {
    async listar() {
      return [...memoria].sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
    },
    async obter(id) {
      return memoria.find((s) => s.id === id) ?? null
    },
    async criar(nome, entradas) {
      const agora = new Date().toISOString()
      const nova: Simulacao = { id: crypto.randomUUID(), nome, entradas, criadoEm: agora, atualizadoEm: agora }
      memoria = [nova, ...memoria]
      gravarLocal(memoria)
      return nova
    },
    async salvar(id, dados) {
      memoria = memoria.map((s) =>
        s.id === id ? { ...s, ...dados, atualizadoEm: new Date().toISOString() } : s,
      )
      gravarLocal(memoria)
    },
    async excluir(id) {
      memoria = memoria.filter((s) => s.id !== id)
      gravarLocal(memoria)
    },
  }
}

export const repositorio: Repositorio = supabase ? repositorioSupabase() : repositorioLocal()
