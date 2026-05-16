import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/consumer/dashboard'
  const authError = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Supabase returns ?error=... when the user denies or the link is bad.
  if (authError) {
    const target = new URL('/consumer', request.url)
    target.searchParams.set('error', errorDescription ?? authError)
    return NextResponse.redirect(target)
  }

  if (!code) {
    const target = new URL('/consumer', request.url)
    target.searchParams.set('error', 'Missing authentication code.')
    return NextResponse.redirect(target)
  }

  // Pattern recommended by Supabase docs for App Router callbacks:
  // create the redirect response up front, then have the cookies adapter
  // mutate that response so set-cookie headers land on the actual redirect.
  let response = NextResponse.redirect(new URL(next, request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.redirect(new URL(next, request.url))
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.redirect(new URL(next, request.url))
          response.cookies.set({ name, value: '', ...options })
        },
      },
    },
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    const target = new URL('/consumer', request.url)
    target.searchParams.set('error', exchangeError.message)
    return NextResponse.redirect(target)
  }

  return response
}
