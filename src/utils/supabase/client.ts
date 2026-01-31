import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 1. Asegúrate de tener estas variables en tu archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan las variables de entorno de Supabase (URL o Key)')
}

// 2. Creamos y exportamos el cliente de Supabase
export const createClient = () => createSupabaseClient(supabaseUrl, supabaseAnonKey)
