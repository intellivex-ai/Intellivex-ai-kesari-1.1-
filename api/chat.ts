import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@clerk/backend'

// ── Clients ───────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Kesari 1.1, an AI assistant made by Intellivex AI.

Keep responses short and conversational unless the user asks for something detailed.
Do NOT use headers or excessive bullet points for simple questions — just answer naturally.
Only use markdown formatting (code blocks, lists) when it genuinely helps.
Be direct, friendly, and clear. Answer the question first, then explain if needed.`

// ── OpenRouter model ──────────────────────────────────────────────────────────
const OPENROUTER_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getUserId(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! })
    return payload.sub ?? null
  } catch {
    return null
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { chatId, messages: rawMessages, model: modelLabel = OPENROUTER_MODEL, systemPrompt } = req.body as {
    chatId: string
    messages: Array<{ role: string; content: string }>
    model?: string
    systemPrompt?: string
  }

  const messages = (rawMessages ?? []).slice(-20)
  const activePrompt = systemPrompt?.trim() || SYSTEM_PROMPT

  if (!chatId || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing chatId or messages' })
  }

  // Verify chat belongs to this user
  const { data: chat, error: chatErr } = await supabase
    .from('chats')
    .select('id, user_id')
    .eq('id', chatId)
    .single()

  if (chatErr || !chat || chat.user_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Upsert user record
  await supabase.from('users').upsert({ id: userId }, { onConflict: 'id' })


  // Build message array: system + conversation history
  const apiMessages = [
    { role: 'system', content: activePrompt },
    ...messages,
  ]

  // Save the last user message to DB (the frontend may have done this too,
  // but this ensures DB consistency if the FE fails)
  const lastMsg = messages[messages.length - 1]
  if (lastMsg?.role === 'user') {
    await supabase.from('messages').upsert({
      chat_id: chatId,
      role: 'user',
      content: lastMsg.content,
    })
  }

  // ── Stream from OpenRouter API ───────────────────────────────────────────
  let nvidiaRes: Response
  try {
    nvidiaRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://intellivexai.com',
        'X-Title': 'Intellivex AI',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: apiMessages,
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 0.95,
        stream: true,
      }),
    })
  } catch (err) {
    console.error('OpenRouter fetch error', err)
    return res.status(502).json({ error: 'AI service unavailable' })
  }

  if (!nvidiaRes.ok) {
    const body = await nvidiaRes.text()
    console.error('OpenRouter API error', nvidiaRes.status, body)
    return res.status(502).json({ error: 'AI service error', detail: body })
  }

  // ── Pipe SSE stream to client ──────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const reader = nvidiaRes.body!.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      // Forward raw SSE chunk to client
      res.write(chunk)

      // Also accumulate for DB save
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

  // ── Save assistant response to DB ─────────────────────────────────────────
  if (fullContent) {
    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'assistant',
      content: fullContent,
    })
    // Update chat updated_at
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)
  }

  res.write('data: [DONE]\n\n')
  res.end()
}
