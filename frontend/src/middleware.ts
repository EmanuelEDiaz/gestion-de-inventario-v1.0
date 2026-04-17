import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de autenticación para Next.js.
 * Protege rutas privadas y redirige a login si no hay sesión.
 */

// Rutas que no requieren autenticación
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/_next',
  '/favicon.ico',
  '/fonts',
  '/api/auth',
];

// Rutas que requieren rol ADMIN
const adminOnlyPaths = [
  '/settings/users',
  '/settings/roles',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path));
}

function isAdminOnlyPath(pathname: string): boolean {
  return adminOnlyPaths.some(path => pathname.startsWith(path));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Verificar token de acceso
  const accessToken = request.cookies.get('accessToken')?.value 
    || request.headers.get('Authorization')?.replace('Bearer ', '');

  // Si no hay token, redirigir a login
  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar si el token tiene estructura JWT válida
  try {
    const [, payloadBase64] = accessToken.split('.');
    if (!payloadBase64) {
      throw new Error('Invalid token');
    }
    
    const payload = JSON.parse(atob(payloadBase64));
    const exp = payload.exp;
    
    // Si el token expiró, redirigir a login
    if (exp && Date.now() >= exp * 1000) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('reason', 'expired');
      
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      return response;
    }

    // Verificar permisos para rutas admin
    if (isAdminOnlyPath(pathname)) {
      const role = payload.role || payload.roles?.[0];
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

  } catch {
    // Token inválido
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
