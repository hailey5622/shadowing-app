/// <reference types="node" />
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';

function getServerEnv(key: string): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
}

const defaultServerCookies: CookieMethodsServer = {
  getAll() {
    return [];
  },
  setAll() {
    // No-op when no response cookie handler is provided
  },
};

export function createClient(cookies: CookieMethodsServer = defaultServerCookies) {
  const supabaseUrl =
    getServerEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    getServerEnv('VITE_SUPABASE_URL');

  const supabaseKey =
    getServerEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    getServerEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getServerEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
    getServerEnv('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase server environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY).'
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies,
  });
}

export function createServiceRoleClient() {
  const supabaseUrl =
    getServerEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    getServerEnv('VITE_SUPABASE_URL');

  const serviceRoleKey = getServerEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase service role environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).'
    );
  }

  return createSupabaseJsClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
