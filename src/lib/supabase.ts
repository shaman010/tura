import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Клиент Supabase. Создаётся только если заданы env-ключи.
 * Пока ключей нет — `supabase === null`, и приложение работает на статических
 * данных (src/data/*). Это позволяет переключаться на бэкенд без поломок.
 */
export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } }) : null

export const hasBackend = supabase !== null
