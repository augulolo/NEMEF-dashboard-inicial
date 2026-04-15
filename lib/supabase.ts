import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente singleton para uso en componentes cliente
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Función helper (retrocompatible con componentes que llaman createClient())
export function createClient() {
  return supabase;
}
