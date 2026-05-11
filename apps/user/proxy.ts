import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextRequest } from 'next/server';

const nextIntlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  // next-intl middleware handles locale detection based on Accept-Language
  // and cookies. With localePrefix: 'never', it won't redirect to /[locale].
  return nextIntlMiddleware(req);
}

export const config = {
  // Match all pathnames except for
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - all files inside /public (e.g. /favicon.ico)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
