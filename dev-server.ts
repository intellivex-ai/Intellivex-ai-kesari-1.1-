/**
 * Local Express dev server — mirrors the Vercel /api/* serverless functions.
 * Run with: npm run dev:api
 * The Vite dev server proxies /api/* to this server (port 3001).
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local (Vite convention for local secrets)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
dotenv.config({ path: resolve(__dirname, '.env.local') })
dotenv.config({ path: resolve(__dirname, '.env') }) // fallback

import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { createClerkClient } from '@clerk/backend'

const app = express()
app.use(cors())
app.use(express.json())

// ── Clients ────────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

// ── System Prompt ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Kesari 1.0, an advanced AI assistant created by Intellivex AI.

Your personality:
- Clear and intelligent
- Direct and helpful
- No unnecessary fluff
- Strong reasoning ability
- Excellent at coding, business, and problem-solving

Rules:
- Always give structured answers
- Prefer clarity over creativity
- Avoid vague responses
- Think step-by-step when needed`

// ── NVIDIA model map ───────────────────────────────────────────────────────────
const MODEL_MAP: Record<string, string> = {
  'Intellivex Default':     'nvidia/llama-3.1-nemotron-70b-instruct',
  'Nemotron 70B':           'nvidia/llama-3.1-nemotron-70b-instruct',
  'Llama 3.1 405B':         'meta/llama-3.1-405b-instruct',
  'Mistral NeMo 12B':       'mistralai/mistral-nemo-12b-instruct',
  'Phi-3 Mini':             'microsoft/phi-3-mini-4k-instruct',
}

// ── Auth helper ────────────────────────────────────────────────────────────────
async function getUserId(req: express.Request): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const payload = await clerk.verifyToken(token)
    return payload.sub ?? null
  } catch {
    return null
  }
}

async function verifyChatOwnership(chatId: string, userId: string): Promise<boolean> {
  const { data } = await supabase.from('chats').select('user_id').eq('id', chatId).single()
  return !!data && data.user_id === userId
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat — NVIDIA streaming
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { chatId, messages, model: modelLabel = 'Intellivex Default' } = req.body as {
    chatId: string
    messages: Array<{ role: string; content: string }>
    model?: string
  }

  if (!chatId || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing chatId or messages' })
  }

  // Verify chat ownership
  const { data: chat, error: chatErr } = await supabase
    .from('chats').select('id, user_id').eq('id', chatId).single()

  if (chatErr || !chat || chat.user_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Upsert user
  await supabase.from('users').upsert({ id: userId }, { onConflict: 'id' })

  const nvidiaModel = MODEL_MAP[modelLabel] ?? MODEL_MAP['Intellivex Default']
  const apiMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

  // Call NVIDIA API with streaming
  let nvidiaRes: Response
  try {
    nvidiaRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: nvidiaModel,
        messages: apiMessages,
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 0.95,
        stream: true,
      }),
    })
  } catch (err) {
    console.error('[/api/chat] NVIDIA fetch error:', err)
    return res.status(502).json({ error: 'AI service unavailable' })
  }

  if (!nvidiaRes.ok) {
    const body = await nvidiaRes.text()
    console.error('[/api/chat] NVIDIA API error:', nvidiaRes.status, body)
    return res.status(502).json({ error: 'AI service error', detail: body })
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const reader = nvidiaRes.body!.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      res.write(chunk)

      // Accumulate for DB save
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content ?? ''
            if (token) fullContent += token
          } catch { /* skip */ }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  // Save assistant response to DB
  if (fullContent) {
    await supabase.from('messages').insert({ chat_id: chatId, role: 'assistant', content: fullContent })
    await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId)
  }

  res.write('data: [DONE]\n\n')
  res.end()
})

// ─────────────────────────────────────────────────────────────────────────────
// /api/chats — GET, POST, PATCH, DELETE
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/chats', async (req, res) => {
  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  await supabase.from('users').upsert({ id: userId }, { onConflict: 'id' })

  const { data, error } = await supabase
    .from('chats').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  return res.json(data ?? [])
})

app.post('/api/chats', async (req, res) => {
  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  await supabase.from('users').upsert({ id: userId }, { onConflict: 'id' })

  const { title = 'New chat' } = req.body as { title?: string }
  const { data, error } = await supabase
    .from('chats').insert({ user_id: userId, title }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
})

app.patch('/api/chats', async (req, res) => {
  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id, title } = req.body as { id: string; title: string }
  if (!id || !title) return res.status(400).json({ error: 'Missing id or title' })

  const { data: chat } = await supabase.from('chats').select('user_id').eq('id', id).single()
  if (!chat || chat.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

  const { error } = await supabase
    .from('chats').update({ title, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ ok: true })
})

app.delete('/api/chats', async (req, res) => {
  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const id = req.query.id as string
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const { data: chat } = await supabase.from('chats').select('user_id').eq('id', id).single()
  if (!chat || chat.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

  const { error } = await supabase.from('chats').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────────────────────────
// /api/messages — GET, POST
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/messages', async (req, res) => {
  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const chat_id = req.query.chat_id as string
  if (!chat_id) return res.status(400).json({ error: 'Missing chat_id' })

  const owned = await verifyChatOwnership(chat_id, userId)
  if (!owned) return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabase
    .from('messages').select('*').eq('chat_id', chat_id).order('created_at', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  return res.json(data ?? [])
})

app.post('/api/messages', async (req, res) => {
  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { chat_id, role, content } = req.body as { chat_id: string; role: string; content: string }
  if (!chat_id || !role || !content) return res.status(400).json({ error: 'Missing fields' })

  const owned = await verifyChatOwnership(chat_id, userId)
  if (!owned) return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabase
    .from('messages').insert({ chat_id, role, content }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
})

// ─────────────────────────────────────────────────────────────────────────────
const PORT = 3001
app.listen(PORT, () => {
  console.log(`\n  ✅ Intellivex API dev server running at http://localhost:${PORT}\n`)
})
