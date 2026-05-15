import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Only run middleware on routes that actually use Supabase auth. The wellness
// SPA at / and its static assets do not need session refresh; matching them
// just causes a 500 if Supabase env vars are missing in a preview deploy.
export const config = {
  matcher: [
    '/portal/:path*',
    '/consumer/:path*',
    '/franchise/:path*',
    '/clinical/:path*',
    '/api/:path*',
  ],
}
