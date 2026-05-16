// Serves the wellness SPA at the root URL.
//
// The HTML is embedded as a base64 string at build time by
// scripts/embed-spa.mjs so it ships inside the route handler bundle.
// This avoids reading from the filesystem at request time, which is
// unreliable on Vercel serverless functions where process.cwd() does
// not always point at the project root.

import { WELLNESS_SPA_HTML } from '@/lib/wellness-spa-html'

export const dynamic = 'force-static'

export async function GET() {
  return new Response(WELLNESS_SPA_HTML, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}
