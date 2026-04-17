import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de autenticación.
 * Protege rutas privadas y redirige a login si no hay sesión.
 */

// Rutas que no requieren autenticación
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/refresh',
  '/_next',
  '/favicon.ico',
  '/fonts',
];

// Rutas que requieren rol específico
const adminPaths = ['/admin', '/api/v1/users', '/settings'];
const managerPaths = ['/reports', '/api/v1/imports', '/api/v1/exports'];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Verificar token de acceso
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    // Redirigir a login con URL de retorno
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // TODO: Validar JWT y verificar roles para rutas específicas
  // Por ahora, solo verificamos que exista el token

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplicar proxy a todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
