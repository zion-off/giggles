import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred } from 'fumadocs-core/negotiation';

export default function middleware(request: NextRequest) {
  if (isMarkdownPreferred(request)) {
    // Rewrite root-level paths to /llms.mdx/docs/...
    const pathname = request.nextUrl.pathname;

    // Skip if already an llms route
    if (pathname.startsWith('/llms')) {
      return NextResponse.next();
    }

    // Rewrite to the LLM endpoint
    const rewriteUrl = new URL(`/llms.mdx/docs${pathname}`, request.nextUrl);
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|llms).*)'
  ]
};
