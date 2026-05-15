// Serves the wellness SPA (public/index.html) at the root URL.
// Using a route handler at app/route.ts instead of a Next.js rewrite because
// rewriting / to a public file can interact unpredictably with the app/
// layout tree. A raw Response bypasses the layout entirely and returns the
// static HTML directly.

import fs from 'node:fs'
import path from 'node:path'

let cachedHtml: string | null = null

function loadHtml() {
  if (cachedHtml !== null) return cachedHtml
  try {
    cachedHtml = fs.readFileSync(
      path.join(process.cwd(), 'public', 'index.html'),
      'utf-8',
    )
  } catch (err) {
    console.error('[wellness-spa] could not load public/index.html', err)
    cachedHtml = MINIMAL_FALLBACK
  }
  return cachedHtml
}

export async function GET() {
  return new Response(loadHtml(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}

const MINIMAL_FALLBACK = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>LongevityIQ</title>
    <style>
      body { background: #050608; color: #E8E4D9; font-family: system-ui, sans-serif; padding: 4rem 2rem; text-align: center; }
      a { color: #C8A84B; }
    </style>
  </head>
  <body>
    <h1>LongevityIQ</h1>
    <p>The wellness SPA failed to load. <a href="/portal">Open the Sovereign OS</a>.</p>
  </body>
</html>`
