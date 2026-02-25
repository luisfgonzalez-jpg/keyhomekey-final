import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/type/supabase';

type UserRole = 'ADMIN' | 'PROVIDER' | 'OWNER' | 'TENANT' | null;

async function getUserRole(supabase: SupabaseClient<Database>, userId: string): Promise<UserRole> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single() as { data: { role?: UserRole } | null; error: unknown };

  if (!error && profile?.role) {
    return profile.role as UserRole;
  }

  return null;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res;
  }

  const userRole = await getUserRole(supabase, session.user.id);
  const currentPath = req.nextUrl.pathname;

  if (userRole === 'PROVIDER' && currentPath === '/') {
    return NextResponse.redirect(new URL('/provider', req.url));
  }

  if (userRole === 'ADMIN' && currentPath === '/') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  if (currentPath.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (currentPath.startsWith('/provider') && userRole !== 'PROVIDER') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/', '/admin/:path*', '/provider/:path*'],
};
