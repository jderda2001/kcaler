import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const PUBLIC_PATHS = ['/login', '/register', '/privacy', '/terms'];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);
  const path = nextUrl.pathname;

  const isPublic =
    PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`)) ||
    path.startsWith('/api/auth') ||
    path.startsWith('/_next') ||
    path.startsWith('/icons') ||
    path === '/manifest.json' ||
    path === '/sw.js' ||
    path === '/favicon.ico';

  if (isPublic) {
    // If logged in and visiting /login or /register → bounce to home
    if (isLoggedIn && (path === '/login' || path === '/register')) {
      return NextResponse.redirect(new URL('/', nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const url = new URL('/login', nextUrl);
    url.searchParams.set('callbackUrl', path + nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
};
