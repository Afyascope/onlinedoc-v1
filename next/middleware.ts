import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { i18n } from '@/i18n.config'

import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

function getLocale(request: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  const locales: string[] = i18n.locales
  const languages = new Negotiator({ headers: negotiatorHeaders })
    .languages()
    .filter(l => l !== '*')

  const locale = matchLocale(languages, locales, i18n.defaultLocale)
  return locale
}

function getLocaleFromPath(pathname: string): string | null {
  for (const locale of i18n.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return null;
}

const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

const patientRoutes = ['/dashboard/patient'];
const clinicianRoutes = ['/dashboard/clinician'];
const adminRoutes = ['/dashboard/admin'];

function isRouteMatch(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => pathname.startsWith(pattern));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    locale => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Layer 1: i18n (existing logic)
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url
      )
    )
  }

  // Layer 2: Auth protection — only for routes WITH a locale prefix
  const locale = getLocaleFromPath(pathname);
  if (!locale) {
    return NextResponse.next();
  }

  // Strip locale to check the actual route
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // Public routes — always accessible
  if (publicRoutes.some(route => pathWithoutLocale.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected routes — check session cookie existence
  const sessionCookie = request.cookies.get('better-auth.session_token') 
    || request.cookies.get('__Secure-better-auth.session_token')
    || request.cookies.get('__session');

  const isProtectedRoute = patientRoutes.some(r => pathWithoutLocale.startsWith(r))
    || clinicianRoutes.some(r => pathWithoutLocale.startsWith(r))
    || adminRoutes.some(r => pathWithoutLocale.startsWith(r));

  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|robots.txt|sitemap.xml).*)']
}
