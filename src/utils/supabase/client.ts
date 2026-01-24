import { createBrowserClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

/**
 * Creates a Supabase browser client configured to use cookie-based session storage.
 * 
 * This client stores authentication sessions in HTTP cookies instead of localStorage,
 * enabling proper server-side authentication via cookies sent with fetch requests.
 * 
 * @returns Configured Supabase browser client with cookie storage
 * @version 2.0.0 - Cookie-based storage (PR #28)
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables (URL or Anon Key)');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`));
        if (!cookie) return null;
        const value = cookie.substring(name.length + 1);
        return decodeURIComponent(value);
      },
      set(name: string, value: string, options: CookieOptions) {
        const encodedValue = encodeURIComponent(value);
        let cookieString = `${name}=${encodedValue}; path=/; SameSite=Lax`;
        
        if (options.maxAge) {
          cookieString += `; max-age=${options.maxAge}`;
        }
        
        if (options.domain) {
          cookieString += `; domain=${options.domain}`;
        }
        
        if (options.secure) {
          cookieString += '; Secure';
        }
        
        document.cookie = cookieString;
      },
      remove(name: string, options: CookieOptions) {
        const path = options.path || '/';
        let cookieString = `${name}=; path=${path}; max-age=0`;
        
        if (options.domain) {
          cookieString += `; domain=${options.domain}`;
        }
        
        document.cookie = cookieString;
      }
    }
  });
}

// Force build cache invalidation - PR #29
// This ensures Next.js regenerates the bundle with cookie configuration
