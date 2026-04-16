import { createBrowserClient } from "@supabase/ssr";

// Usa cookies (compatible con el middleware de Next.js)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Instancia singleton para componentes cliente
export const supabase = createClient();
