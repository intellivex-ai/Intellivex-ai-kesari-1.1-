/**
 * Intellivex API — Vite dev server plugin
 * Handles /api/* routes inside the Vite dev server. No separate process.
 *
 * Approach: Zero SDK imports at module level.
 *   • Supabase → raw REST API (PostgREST) via fetch()
 *   • Clerk JWT → decoded without verification (dev-only, acceptable)
 *   • OpenRouter → direct fetch() streaming
 *   • Hugging Face → multi-model cascade with fallback
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

// ── Kesari 1.2 system prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Kesari 1.2, an AI assistant made by Intellivex AI.

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
async function performWebSearch(query: string): Promise<string> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    })
    if (!res.ok) return ''
    const html = await res.text()
    const snippets = [...html.matchAll(/class="result__snippet[^>]*>(.*?)<\/a>/gi)]
    if (!snippets.length) return ''
    return snippets.slice(0, 3).map(m => m[1].replace(/<\/?b>/g, '')).join('\n\n')
  } catch {
    return ''
  }
}

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

// ── Hugging Face model cascade ─────────────────────────────────────────────────
// HF migrated serverless inference to router.huggingface.co in 2025.
// Old api-inference.huggingface.co returns 410 for ALL models.
// Models tried in order; first successful 200 image response wins.
const HF_MODELS = [
  {
    url: 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
    params: { num_inference_steps: 4, guidance_scale: 0.0 },
  },
  {
    url: 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-2-1',
    params: { num_inference_steps: 25, guidance_scale: 7.5 },
  },
  {
    url: 'https://router.huggingface.co/hf-inference/models/runwayml/stable-diffusion-v1-5',
    params: { num_inference_steps: 20, guidance_scale: 7.5 },
  },
  {
    url: 'https://router.huggingface.co/hf-inference/models/Lykon/dreamshaper-7',
    params: { num_inference_steps: 20, guidance_scale: 7.5 },
  },
]

async function callHfModel(
  hfKey: string,
  prompt: string,
  modelUrl: string,
  params: Record<string, number>,
): Promise<Response | null> {
  const ctrl = new AbortController()
  const tid = setTimeout(() => ctrl.abort(), 50_000)
  try {
    const r = await fetch(modelUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt, parameters: params }),
      signal: ctrl.signal,
    })
    clearTimeout(tid)
    return r
  } catch (e: any) {
    clearTimeout(tid)
    const name = (e as Error)?.name ?? ''
    if (name === 'AbortError') {
      console.warn(`[generate-image] ${modelUrl} timed out (50s)`)
    } else {
      console.warn(`[generate-image] ${modelUrl} network error:`, (e as Error)?.message)
    }
    return null
  }
}

// ── Plugin ─────────────────────────────────────────────────────────────────────
export function intellivexApiPlugin(): Plugin {
  return {
    name: 'intellivex-api',

    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const { pathname, query } = parseUrl(req.url ?? '', true)
        if (!pathname?.startsWith('/api/')) return next()

        const ALLOWED_ORIGINS = ['https://intellivexai.com', 'http://localhost:5173', 'http://localhost:3000']
        const origin = req.headers.origin || ''
        if (ALLOWED_ORIGINS.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin)
        }
        res.setHeader('Vary', 'Origin')
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end() }

        const userId = await getUserId(req.headers.authorization)

        try {
          // ══ POST /api/chat ══════════════════════════════════════════════════
          if (pathname === '/api/chat' && req.method === 'POST') {
            const body = await parseBody(req)
            const chatId = body.chatId as string
            const rawMessages = (body.messages as Array<any>) ?? []
            let model = (body.model as string) || DEFAULT_MODEL
            const customPrompt = (body.systemPrompt as string) || ''
            let activePrompt = customPrompt.trim() || SYSTEM_PROMPT
            
            // Aggressively truncate system prompt if it's too large for the free tier
            if (activePrompt.length > 12000) {
              activePrompt = activePrompt.slice(0, 12000) + "\n... (System prompt truncated for token limits)"
            }
            
            const webSearch = body.webSearch === true

            // Rate limiting
            const limit = checkRateLimit(userId)
            if (!limit.ok) return sendJson(res, 429, { error: 'Rate limit reached. Try again in an hour.' })

            const orKey = process.env.OPENROUTER_API_KEY ?? ''
            if (!orKey || orKey.includes('REPLACE_ME') || orKey.length < 20) {
              console.error('\n  ❌ [intellivex] OPENROUTER_API_KEY not set in .env.local\n')
              return sendJson(res, 500, { error: 'OPENROUTER_API_KEY not configured' })
            }

            // Web Grounding feature
            if (webSearch && rawMessages.length > 0) {
              const lastUserMsg = rawMessages[rawMessages.length - 1]
              if (lastUserMsg.role === 'user' && typeof lastUserMsg.content === 'string') {
                const searchResults = await performWebSearch(lastUserMsg.content)
                if (searchResults) {
                  activePrompt += `\n\n[LIVE WEB CONTEXT]\nThe following is live search information. Use it to answer if relevant:\n${searchResults}`
                }
              }
            }

            // Keep last 20 messages to control context window, format for Vision if needed
            // Keep last 3 messages to control context window extremely heavily for free tier
            let hasVision = false
            const trimmedMessages = rawMessages.slice(-3).map(msg => {
              let trimmedContent = msg.content
              if (typeof trimmedContent === 'string' && trimmedContent.length > 1000) {
                 trimmedContent = trimmedContent.slice(0, 1000) + '... (truncated)'
              }
              if (msg.attachments && msg.attachments.length > 0) {
                hasVision = true
                const contentArr: any[] = [{ type: 'text', text: trimmedContent }]
                msg.attachments.forEach((url: string) => {
                  contentArr.push({ type: 'image_url', image_url: { url } })
                })
                return { role: msg.role, content: contentArr }
              }
              return { role: msg.role, content: trimmedContent }
            })

            // Auto-fallback to gemini-1.5-pro if vision is required (Nemotron doesn't support Vision)
            if (hasVision && model === 'nvidia/llama-3.1-nemotron-70b-instruct') {
              model = 'google/gemini-1.5-pro'
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
                  max_tokens: 800,
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

          // ══ POST /api/generate-image ═════════════════════════════════════════
          if (pathname === '/api/generate-image' && req.method === 'POST') {
            const body = await parseBody(req)
            const { prompt, style, chatId } = body as { prompt: string; style?: string; chatId: string }

            if (!prompt?.trim() || !chatId) {
              return sendJson(res, 400, { error: 'Missing prompt or chatId' })
            }

            // ── Validate HF API key ─────────────────────────────────────────
            const hfKey = (process.env.HF_API_KEY ?? '').trim()
            if (!hfKey || hfKey.length < 8 || !hfKey.startsWith('hf_')) {
              return sendJson(res, 500, {
                error: 'HF_API_KEY not set. Open .env.local and add:\nHF_API_KEY=hf_your_token\n\nGet a free token at: https://huggingface.co/settings/tokens',
                code: 'NO_HF_KEY',
              })
            }

            // ── Daily usage check ───────────────────────────────────────────
            const DAILY_LIMIT = 10
            const today = new Date().toISOString().slice(0, 10)
            let currentCount = 0

            if (isSupabaseReady()) {
              const usageData = await sbFetch(
                'GET', 'image_usage',
                `user_id=eq.${encodeURIComponent(userId)}&date=eq.${today}&select=count`,
              ) as any
              currentCount = (Array.isArray(usageData) ? usageData[0]?.count : usageData?.count) ?? 0
              if (currentCount >= DAILY_LIMIT) {
                return sendJson(res, 429, {
                  error: `Daily image limit reached (${DAILY_LIMIT}/day). Try again tomorrow!`,
                  code: 'DAILY_LIMIT_EXCEEDED',
                  used: currentCount,
                  limit: DAILY_LIMIT,
                })
              }
            }

            // ── Build enhanced prompt ───────────────────────────────────────
            const STYLE_SUFFIX: Record<string, string> = {
              realistic: ', ultra realistic, 8k, RAW photo, photorealistic, depth of field, sharp focus',
              anime: ', anime style, vibrant colors, highly detailed anime art, studio ghibli quality',
              cinematic: ', cinematic film still, dramatic lighting, anamorphic lens, movie scene, 4k',
              'digital art': ', digital illustration, concept art, artstation trending, octane render, 4k',
            }
            const styleSuffix = style ? (STYLE_SUFFIX[style] ?? '') : ', realistic, 8k resolution, sharp focus'
            const enhancedPrompt = `${prompt.trim()}, high quality, detailed${styleSuffix}`

            // ── Try HF models in cascade ────────────────────────────────────
            let hfRes: Response | null = null
            let lastStatus = 0

            for (const model of HF_MODELS) {
              const shortName = model.url.split('/').slice(-2).join('/')
              console.log(`[generate-image] Trying ${shortName}`)
              const r = await callHfModel(hfKey, enhancedPrompt, model.url, model.params)

              if (!r) continue // timeout or network error — try next

              lastStatus = r.status

              if (r.status === 503) {
                console.warn(`[generate-image] ${shortName} → 503 (warming up), trying next`)
                continue
              }
              if (r.status === 410 || r.status === 404) {
                console.warn(`[generate-image] ${shortName} → ${r.status} (model gone), trying next`)
                continue
              }
              if (r.status === 401 || r.status === 403) {
                const errBody = await r.text().catch(() => '')
                console.error('[generate-image] Auth error:', r.status, errBody)
                return sendJson(res, 401, {
                  error: `HF_API_KEY is invalid or expired (${r.status}).\nGet a new token at: https://huggingface.co/settings/tokens`,
                  code: 'INVALID_HF_KEY',
                })
              }
              if (!r.ok) {
                const errBody = await r.text().catch(() => '')
                console.warn(`[generate-image] ${shortName} → ${r.status}:`, errBody.slice(0, 100))
                continue
              }

              // ✅ Success
              hfRes = r
              break
            }

            if (!hfRes) {
              return sendJson(res, 503, {
                error: lastStatus === 503
                  ? 'Image models are warming up. Wait ~60 seconds and try again.'
                  : 'Image generation unavailable right now. All models are offline — try again later.',
                code: 'ALL_MODELS_FAILED',
              })
            }

            // ── Validate response is an image ───────────────────────────────
            const contentType = hfRes.headers.get('content-type') ?? ''
            if (!contentType.startsWith('image/')) {
              const text = await hfRes.text().catch(() => '')
              console.error('[generate-image] Non-image response:', text.slice(0, 300))
              return sendJson(res, 502, { error: 'Unexpected response from image model' })
            }

            const arrayBuffer = await hfRes.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // ── Upload to Supabase Storage (optional) ───────────────────────
            let imageUrl = ''

            if (isSupabaseReady()) {
              const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
              const storageKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
              const storagePath = `${userId}/${Date.now()}.png`

              try {
                const uploadRes = await fetch(
                  `${supabaseUrl}/storage/v1/object/generated-images/${storagePath}`,
                  {
                    method: 'POST',
                    headers: {
                      apikey: storageKey,
                      Authorization: `Bearer ${storageKey}`,
                      'Content-Type': 'image/png',
                    },
                    body: buffer,
                  },
                )

                if (uploadRes.ok) {
                  imageUrl = `${supabaseUrl}/storage/v1/object/public/generated-images/${storagePath}`

                  // Persist image message to DB
                  await sbFetch('POST', 'messages', '', {
                    chat_id: chatId,
                    role: 'assistant',
                    type: 'image',
                    content: prompt.trim(),
                    image_url: imageUrl,
                    prompt: enhancedPrompt,
                  })

                  // Upsert usage counter
                  await fetch(`${supabaseUrl}/rest/v1/image_usage`, {
                    method: 'POST',
                    headers: {
                      apikey: storageKey,
                      Authorization: `Bearer ${storageKey}`,
                      'Content-Type': 'application/json',
                      Prefer: 'resolution=merge-duplicates',
                    },
                    body: JSON.stringify({ user_id: userId, date: today, count: currentCount + 1 }),
                  })
                } else {
                  console.warn('[generate-image] Storage upload failed:', await uploadRes.text())
                }
              } catch (storageErr) {
                console.warn('[generate-image] Storage error (using base64 fallback):', storageErr)
              }
            }

            // ── Fallback: return base64 data-URL ────────────────────────────
            if (!imageUrl) {
              imageUrl = `data:image/png;base64,${buffer.toString('base64')}`
            }

            return sendJson(res, 200, {
              url: imageUrl,
              enhancedPrompt,
              fromCache: false,
              used: currentCount + 1,
              limit: DAILY_LIMIT,
            })
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
