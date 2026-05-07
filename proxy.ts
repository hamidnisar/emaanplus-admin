import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // if visiting login page and already has session → go to dashboard
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // if visiting any dashboard page without session → go to login
  if (pathname !== '/login' && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|app-ads.txt|privacy-policy|support).*)'],
};