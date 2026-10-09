import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // CSRF defence for cookie-authenticated (admin) mutations: same-origin only.
  if (req.nextUrl.pathname.startsWith('/api') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    if (origin && new URL(origin).host !== host) return new NextResponse('Bad origin', { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
