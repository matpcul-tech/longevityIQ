// Anonymizer for the Sovereign Training Bus. Strips PII before any event
// crosses the app boundary, hashing identifiers with a per-app salt so the
// central bus can correlate longitudinally without seeing names or emails.
//
// Hash uses SHA-256. Available in Node (>=15) and the browser via Web Crypto.

import type { AgeBand, Sex } from './events'

export type AnonymizerConfig = {
  appSalt: string // long random string set in env, distinct per app
}

const EMAIL_RX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
const PHONE_RX = /\b\d{3}[- .]?\d{3}[- .]?\d{4}\b/g
const SSN_RX = /\b\d{3}-\d{2}-\d{4}\b/g
const STREET_RX =
  /\b\d{1,6}\s+([A-Z][a-z]+\s){1,4}(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Ln|Lane|Dr|Drive|Ct|Court|Way|Pl|Place|Pkwy|Parkway)\b/g

export function ageToBand(years: number | null | undefined): AgeBand {
  const y = typeof years === 'number' ? Math.floor(years) : NaN
  if (Number.isNaN(y)) return 'under_25'
  if (y < 25) return 'under_25'
  if (y < 35) return '25_34'
  if (y < 45) return '35_44'
  if (y < 55) return '45_54'
  if (y < 65) return '55_64'
  if (y < 75) return '65_74'
  return '75_plus'
}

export function normalizeSex(input: string | null | undefined): Sex {
  if (!input) return 'unknown'
  const v = input.trim().toLowerCase()
  if (v === 'm' || v === 'male' || v === 'man') return 'm'
  if (v === 'f' || v === 'female' || v === 'woman') return 'f'
  if (v === 'unknown' || v === '') return 'unknown'
  return 'other'
}

export function scrubText(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(EMAIL_RX, '[email]')
    .replace(PHONE_RX, '[phone]')
    .replace(SSN_RX, '[ssn]')
    .replace(STREET_RX, '[address]')
    .slice(0, 2000)
}

async function sha256Hex(input: string): Promise<string> {
  // Uses Web Crypto from globalThis. Available in modern browsers, Node 19+,
  // Bun, Deno and every Next.js runtime (Edge and Node).
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error(
      'Web Crypto (globalThis.crypto.subtle) is required. Upgrade to Node 19+ or run on the Edge runtime.',
    )
  }
  const buf = await subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashSubject(
  userId: string,
  config: AnonymizerConfig,
): Promise<string> {
  return sha256Hex(`${config.appSalt}::${userId}`)
}

export async function canonicalDigest(event: unknown): Promise<string> {
  return sha256Hex(JSON.stringify(event))
}
