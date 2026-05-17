// Server-side proxy for the wellness SPA's AI Longevity Coach chat.
//
// The previous implementation called https://api.anthropic.com/v1/messages
// directly from inline browser JS, which would have exposed ANTHROPIC_API_KEY
// to anyone viewing source. This route keeps the key on the server.

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT =
  'You are LongevityIQ, a premium AI longevity and wellness advisor built by Sovereign Shield Technologies LLC. You specialize in biological age optimization and evidence-based wellness protocols including cold therapy, red light therapy, IV nutrient therapy, infrared sauna, peptide therapy, NAD+ infusion, sleep restoration, and anti-inflammatory nutrition. You are warm, precise, and knowledgeable. Keep responses to 2-4 sentences unless detail is requested. Never use em dashes. Always note that clinical interventions require professional medical consultation.'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const FALLBACK_REPLY =
  'I cannot reach the coach service right now. Please try again in a moment or open the Sovereign OS for clinical-grade guidance.'

function isMessage(v: unknown): v is ChatMessage {
  if (!v || typeof v !== 'object') return false
  const m = v as { role?: unknown; content?: unknown }
  return (
    (m.role === 'user' || m.role === 'assistant') &&
    typeof m.content === 'string' &&
    m.content.length > 0 &&
    m.content.length < 8000
  )
}

export async function POST(request: Request) {
  let payload: { messages?: unknown } = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const raw = Array.isArray(payload.messages) ? payload.messages : []
  const messages: ChatMessage[] = raw.filter(isMessage).slice(-20)
  if (messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided.' }, { status: 400 })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return NextResponse.json(
      { reply: FALLBACK_REPLY, fallback: true },
      { status: 200 },
    )
  }

  try {
    const client = new Anthropic({ apiKey: key })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages,
    })
    const reply = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join(' ')
      .replace(/—|–/g, ',')
      .trim()
    if (!reply) {
      return NextResponse.json({ reply: FALLBACK_REPLY, fallback: true })
    }
    return NextResponse.json({ reply })
  } catch (err) {
    return NextResponse.json(
      {
        reply: FALLBACK_REPLY,
        fallback: true,
        error: err instanceof Error ? err.message : 'Unknown coach error.',
      },
      { status: 200 },
    )
  }
}
