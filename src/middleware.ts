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
    // Refresh admin auth session if expired - required for Server Components
    const { data: { user } } = await supabase.auth.getUser();
    const adminRole = user?.app_metadata?.role || '';

    if (!user) {
      url.pathname = '/login';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }

    if (adminRole !== 'admin') {
      url.pathname = '/login';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  // 2. Protect Voter Routes (/vote and /success)
  if (path.startsWith('/vote') || path.startsWith('/success')) {
    const voterToken = request.cookies.get('nawa_voter_token')?.value;
    const voterId = request.cookies.get('nawa_voter_id')?.value;

    if (!voterToken || !voterId) {
      url.pathname = '/';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }

    // Direct check in voters database using service role/public API
    const { data: voter, error } = await supabase
      .from('voters')
      .select('id, token, has_voted, vote_token')
      .eq('id', voterId)
      .eq('token', voterToken)
      .maybeSingle();

    if (error || !voter) {
      // Invalid session cookies, clear them and redirect to landing page
      url.pathname = '/';
      url.searchParams.set('error', 'unauthorized');
      const errorResponse = NextResponse.redirect(url);
      errorResponse.cookies.delete('nawa_voter_token');
      errorResponse.cookies.delete('nawa_voter_id');
      return errorResponse;
    }

    // Voter flow redirects:
    // If voter has already voted, they cannot go to /vote, they are routed to /success
    if (voter.has_voted && path === '/vote') {
      url.pathname = '/success';
      if (voter.vote_token) {
        url.searchParams.set('token', voter.vote_token);
      }
      return NextResponse.redirect(url);
    }

    // If voter hasn't voted yet, they cannot go to /success, they are routed to /vote
    if (!voter.has_voted && path === '/success') {
      url.pathname = '/vote';
      return NextResponse.redirect(url);
    }
  }

  // 3. Redirect authenticated admins away from admin login (/login)
  if (path === '/login') {
    const { data: { user } } = await supabase.auth.getUser();
    const adminRole = user?.app_metadata?.role || '';
    if (user && adminRole === 'admin') {
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // 4. Redirect active voter sessions from landing page (/) to vote/success
  if (path === '/' && !url.searchParams.has('error')) {
    const voterToken = request.cookies.get('nawa_voter_token')?.value;
    const voterId = request.cookies.get('nawa_voter_id')?.value;

    if (voterToken && voterId) {
      const { data: voter } = await supabase
        .from('voters')
        .select('has_voted, vote_token')
        .eq('id', voterId)
        .eq('token', voterToken)
        .maybeSingle();

      if (voter) {
        if (voter.has_voted) {
          url.pathname = '/success';
          if (voter.vote_token) {
            url.searchParams.set('token', voter.vote_token);
          }
        } else {
          url.pathname = '/vote';
        }
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
