import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Cliente Supabase (autenticação, PostgreSQL e Storage).
 * Fica `null` quando as variáveis de ambiente não foram definidas: o app
 * entra em modo demonstração e guarda as simulações no navegador.
 */
export const supabase: SupabaseClient | null = url && chave ? createClient(url, chave) : null

export const modoDemonstracao = supabase === null
