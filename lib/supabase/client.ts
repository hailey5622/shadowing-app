import { createBrowserClient } from '@supabase/ssr';

function getClientEnv(key: string): string {
  const viteEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  if (viteEnv && viteEnv[key]) {
    return viteEnv[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
}

export function createClient() {
  const supabaseUrl =
    getClientEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    getClientEnv('VITE_SUPABASE_URL');

  const supabaseKey =
    getClientEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    getClientEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getClientEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
    getClientEnv('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase client environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY).'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
