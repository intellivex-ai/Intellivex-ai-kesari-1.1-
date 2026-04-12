/**
 * Intellivex API — Vite dev server plugin
 * Handles /api/* routes inside the Vite dev server. No separate process.
 *
 * Approach: Zero SDK imports at module level.
 *   • Supabase → raw REST API (PostgREST) via fetch()
 *   • Clerk JWT → decoded without verification (dev-only, acceptable)
 *   • OpenRouter → direct fetch() streaming
 *
 * Production: Vercel api/*.ts functions take over with full SDK + JWT verification.
 */

import type { Plugin } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { parse as parseUrl } from 'url'

// ── Load .env.local using only Node.js built-ins ───────────────────────────────
;(function loadDotEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq < 0) continue
        const key = trimmed.slice(0, eq).trim()
        const val = trimmed.slice(eq + 1).trim()
        if (key && !(key in process.env)) process.env[key] = val
      }
    } catch { /* file may not exist */ }
  }
})()

// ── Kesari 1.1 system prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Kesari 1.1, an AI assistant made by Intellivex AI.

Keep responses short and conversational unless the user asks for something detailed.
Do NOT use headers or excessive bullet points for simple questions — just answer naturally.
Only use markdown formatting (code blocks, lists) when it genuinely helps.
Be direct, friendly, and clear. Answer the question first, then explain if needed.`

// ── OpenRouter model ────────────────────────────────────────────────────────────
const DEFAULT_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'

// ── Rate limiter (20 req / user / hour) ──────────────────────────────────────
const rateLimits = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(userId: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  let entry = rateLimits.get(userId) ?? { count: 0, resetAt: now + 3_600_000 }
  if (now > entry.resetAt) entry = { count: 0, resetAt: now + 3_600_000 }
  if (entry.count >= 20) { rateLimits.set(userId, entry); return { ok: false, remaining: 0 } }
  entry.count++
  rateLimits.set(userId, entry)
  return { ok: true, remaining: 20 - entry.count }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseBody(req: any): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c: Buffer) => { raw += c.toString() })
    req.on('end', () => { try { resolve(JSON.parse(raw)) } catch { resolve({}) } })
    req.on('error', () => resolve({}))
  })
}

function sendJson(res: any, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

/** Decode Clerk JWT payload without verification (dev-only shortcut). */
function decodeClerkJwt(token: string): string {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    return payload.sub ?? 'dev-user'
  } catch { return 'dev-user' }
}

async function getUserId(authHeader: string | undefined): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) return 'dev-user'
  return decodeClerkJwt(authHeader.slice(7))
}

// ── Supabase REST helpers (no SDK — pure fetch) ────────────────────────────────
function sbHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

function sbUrl(table: string, qs = '') {
  const base = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
  return `${base}/rest/v1/${table}${qs ? '?' + qs : ''}`
}

function isSupabaseReady() {
  const url = process.env.VITE_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return url.startsWith('https://') && key.length > 20
}

async function sbFetch(method: string, table: string, qs = '', body?: unknown) {
  if (!isSupabaseReady()) return null
  try {
    const res = await fetch(sbUrl(table, qs), {
      method,
      headers: sbHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) { console.warn(`[supabase] ${method} ${table} → ${res.status}`); return null }
    if (method === 'DELETE' || method === 'PATCH') return {}
    return await res.json()
  } catch (e) { console.warn('[supabase] fetch error:', e); return null }
}

// ── Plugin ─────────────────────────────────────────────────────────────────────
export function intellivexApiPlugin(): Plugin {
  return {
    name: 'intellivex-api',

    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const { pathname, query } = parseUrl(req.url ?? '', true)
        if (!pathname?.startsWith('/api/')) return next()

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end() }

        const userId = await getUserId(req.headers.authorization)

        try {
          // ══ POST /api/chat ══════════════════════════════════════════════════
          if (pathname === '/api/chat' && req.method === 'POST') {
            const body = await parseBody(req)
            const chatId = body.chatId as string
            const messages = (body.messages as Array<{ role: string; content: string }>) ?? []
            const model = (body.model as string) || DEFAULT_MODEL
            const customPrompt = (body.systemPrompt as string) || ''
            const activePrompt = customPrompt.trim() || SYSTEM_PROMPT

            // Keep last 20 messages to control context window
            const trimmedMessages = messages.slice(-20)

            // Rate limiting
            const limit = checkRateLimit(userId)
            if (!limit.ok) return sendJson(res, 429, { error: 'Rate limit reached. Try again in an hour.' })

            const orKey = process.env.OPENROUTER_API_KEY ?? ''
            if (!orKey || orKey.includes('REPLACE_ME') || orKey.length < 20) {
              console.error('\n  ❌ [intellivex] OPENROUTER_API_KEY not set in .env.local\n')
              return sendJson(res, 500, { error: 'OPENROUTER_API_KEY not configured' })
            }

            const apiMessages = [{ role: 'system', content: activePrompt }, ...trimmedMessages]

            let orRes: Response
            try {
              orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${orKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'https://intellivexai.com',
                  'X-Title': 'Intellivex AI',
                },
                body: JSON.stringify({
                  model,
                  messages: apiMessages,
                  max_tokens: 2048,
                  temperature: 0.4,
                  top_p: 0.9,
                  stream: true,
                }),
              })
            } catch (err) {
              console.error('[intellivex] OpenRouter fetch error:', err)
              return sendJson(res, 502, { error: 'Could not reach OpenRouter. Check internet connection.' })
            }

            if (!orRes.ok) {
              const detail = await orRes.text()
              console.error('[intellivex] OpenRouter error:', orRes.status, detail)
              return sendJson(res, 502, { error: `OpenRouter error (${orRes.status})`, detail })
            }

            res.statusCode = 200
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')
            res.setHeader('X-Accel-Buffering', 'no')

            const reader = orRes.body!.getReader()
            const dec = new TextDecoder()
            let full = ''

            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = dec.decode(value, { stream: true })
                res.write(chunk)
                for (const line of chunk.split('\n')) {
                  if (!line.startsWith('data: ')) continue
                  const d = line.slice(6); if (d === '[DONE]') continue
                  try { const t = JSON.parse(d).choices?.[0]?.delta?.content ?? ''; if (t) full += t } catch {}
                }
              }
            } finally { reader.releaseLock() }

            // Persist to Supabase (best-effort, no-op if not configured)
            if (isSupabaseReady() && chatId && full) {
              await sbFetch('POST', 'messages', '', { chat_id: chatId, role: 'assistant', content: full })
              await sbFetch('PATCH', 'chats', `id=eq.${chatId}`, { updated_at: new Date().toISOString() })
            }

            res.write('data: [DONE]\n\n')
            return res.end()
          }

          // ══ GET /api/chats ══════════════════════════════════════════════════
          if (pathname === '/api/chats' && req.method === 'GET') {
            if (!isSupabaseReady()) return sendJson(res, 200, [])
            await sbFetch('POST', 'users', 'on_conflict=id', { id: userId })
            const data = await sbFetch('GET', 'chats', `user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`)
            return sendJson(res, 200, data ?? [])
          }

          // ══ POST /api/chats ═════════════════════════════════════════════════
          if (pathname === '/api/chats' && req.method === 'POST') {
            const body = await parseBody(req)
            const title = (body.title as string) || 'New chat'
            if (!isSupabaseReady()) {
              return sendJson(res, 201, {
                id: crypto.randomUUID(), user_id: userId, title,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              })
            }
            await sbFetch('POST', 'users', 'on_conflict=id', { id: userId })
            const data = await sbFetch('POST', 'chats', 'select=*', { user_id: userId, title })
            const chat = Array.isArray(data) ? data[0] : data
            return sendJson(res, 201, chat ?? { id: crypto.randomUUID(), user_id: userId, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          }

          // ══ PATCH /api/chats ════════════════════════════════════════════════
          if (pathname === '/api/chats' && req.method === 'PATCH') {
            const body = await parseBody(req)
            await sbFetch('PATCH', 'chats', `id=eq.${body.id}&user_id=eq.${encodeURIComponent(userId)}`, { title: body.title, updated_at: new Date().toISOString() })
            return sendJson(res, 200, { ok: true })
          }

          // ══ DELETE /api/chats ═══════════════════════════════════════════════
          if (pathname === '/api/chats' && req.method === 'DELETE') {
            const id = query.id as string
            if (id) await sbFetch('DELETE', 'chats', `id=eq.${id}&user_id=eq.${encodeURIComponent(userId)}`)
            return sendJson(res, 200, { ok: true })
          }

          // ══ GET /api/messages ═══════════════════════════════════════════════
          if (pathname === '/api/messages' && req.method === 'GET') {
            const chat_id = query.chat_id as string
            if (!isSupabaseReady() || !chat_id) return sendJson(res, 200, [])
            const data = await sbFetch('GET', 'messages', `chat_id=eq.${encodeURIComponent(chat_id)}&order=created_at.asc`)
            return sendJson(res, 200, data ?? [])
          }

          // ══ POST /api/messages ══════════════════════════════════════════════
          if (pathname === '/api/messages' && req.method === 'POST') {
            const body = await parseBody(req)
            if (!isSupabaseReady()) {
              return sendJson(res, 201, { id: crypto.randomUUID(), ...body, created_at: new Date().toISOString() })
            }
            const data = await sbFetch('POST', 'messages', 'select=*', body)
            const msg = Array.isArray(data) ? data[0] : data
            return sendJson(res, 201, msg ?? { id: crypto.randomUUID(), ...body, created_at: new Date().toISOString() })
          }

          next()
        } catch (err) {
          console.error('[intellivex-api] Unhandled error:', err)
          return sendJson(res, 500, { error: 'Internal server error', detail: String(err) })
        }
      })
    },
  }
}
