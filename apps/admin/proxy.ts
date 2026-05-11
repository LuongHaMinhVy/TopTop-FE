import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const nextIntlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale && pathname === '/') {
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry');
    const acceptLanguage = req.headers.get('accept-language');

    let locale = 'en';

    if (country === 'VN') {
      locale = 'vi';
    } else if (acceptLanguage?.toLowerCase().includes('vi')) {
      locale = 'vi';
    }

    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  return nextIntlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
