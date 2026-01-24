import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase browser client for client-side operations.
 * 
 * When used with Next.js middleware, this client automatically uses
 * HTTP cookies for session storage instead of localStorage.
 * 
 * @returns Configured Supabase browser client
 * @version 3.0.0 - SSR with middleware (PR #30)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
