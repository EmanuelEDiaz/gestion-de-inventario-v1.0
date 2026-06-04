import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy de autenticación.
 * Protege rutas privadas y redirige a login si no hay sesión.
 */

const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/refresh',
  '/_next',
  '/favicon.ico',
  '/fonts',
  '/sw.js',
  '/serwist/',
  '/manifest.json',
  '/icons/',
  '/robots.txt',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sw.js|serwist|manifest.json|icons|login).*)',
  ],
};