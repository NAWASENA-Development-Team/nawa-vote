import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. Protect Admin Routes (/admin/*)
  if (path.startsWith('/admin')) {
    // Gunakan getSession() alih-alih getUser() di Edge Middleware untuk menghindari timeout jaringan
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const adminRole = user?.app_metadata?.role || '';

    if (!user) {
      url.pathname = '/login';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }

    if (adminRole !== 'admin' && adminRole !== 'supervisor') {
      url.pathname = '/login';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  // 2. Voter Routing: / is the unified bilik suara kiosk.
  // Redirect legacy /vote path to / so everything stays on the robust single-page kiosk.
  if (path === '/vote') {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/success')) {
    const voterToken = request.cookies.get('nawa_voter_token')?.value;
    const voterId = request.cookies.get('nawa_voter_id')?.value;

    if (!voterToken || !voterId) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // 3. Redirect authenticated admins away from admin login (/login)
  if (path === '/login') {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const adminRole = user?.app_metadata?.role || '';
    
    if (user && (adminRole === 'admin' || adminRole === 'supervisor')) {
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
