import { createBrowserClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

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
        return cookie ? cookie.split('=')[1] : null;
      },
      set(name: string, value: string, options: CookieOptions) {
        let cookieString = `${name}=${value}; path=/; SameSite=Lax`;
        
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
        let cookieString = `${name}=; path=/; max-age=0`;
        
        if (options.domain) {
          cookieString += `; domain=${options.domain}`;
        }
        
        document.cookie = cookieString;
      }
    }
  });
}
