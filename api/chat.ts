import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@clerk/backend'

console.log('API_MODULE_LOADED')

// ── Shared Tools (Inlined for Vercel bundling stability) ──────────────────────
const availableTools = [
  {
    type: "function",
    function: {
      name: "execute_python",
      description: "Execute Python code in a secure sandboxed environment. Use this to perform calculations, data analysis, or run algorithms.",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "The python code to execute. MUST be valid python."
          }
        },
        required: ["code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate a new image based on a prompt.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "A highly descriptive prompt for the image."
          },
          style: {
            type: "string",
            description: "Optional style ID (e.g. realistic, anime)."
          }
        },
        required: ["prompt"]
      }
    }
  }
];

// ── Environment Variables ───────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const CLERK_SECRET = process.env.CLERK_SECRET_KEY || ''
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENAI_KEY = process.env.OPENAI_API_KEY || ''

// ── Clients (Lazy) ────────────────────────────────────────────────────────────
let supabaseClient: any = null
function getSupabase() {
  if (supabaseClient) return supabaseClient
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Server configuration error: Supabase keys missing')
  }
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)
  return supabaseClient
}

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Kesari 1.2, an AI assistant made by Intellivex AI.

Keep responses short and conversational unless the user asks for something detailed.
Do NOT use headers or excessive bullet points for simple questions — just answer naturally.
Only use markdown formatting (code blocks, lists) when it genuinely helps.
Be direct, friendly, and clear. Answer the question first, then explain if needed.`

// ── OpenRouter model ──────────────────────────────────────────────────────────
const OPENROUTER_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'

async function embed(text: string): Promise<number[]> {
  if (!OPENAI_KEY) throw new Error('Missing OPENAI_API_KEY')
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  })
  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`)
  const json = await res.json()
  return json.data[0].embedding
}

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getUserId(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  
  if (!CLERK_SECRET) {
    console.error('Missing CLERK_SECRET_KEY')
    return null
  }

  try {
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET })
    return payload.sub ?? null
  } catch (err) {
    console.error('Identity verification failed:', err)
    return null
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('HANDLER_INVOKED', { method: req.method, url: req.url })
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Safety check for critical config managed via getter
    const supabase = getSupabase()

    // Identity Check
    console.log('AUTH_START')
    const userId = await getUserId(req)
    console.log('AUTH_COMPLETE', { userId: !!userId })
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { chatId, messages: rawMessages, model: modelLabel = OPENROUTER_MODEL, systemPrompt, webSearch } = req.body as {
    chatId: string
    messages: Array<{ role: string; content: string }>
    model?: string
    systemPrompt?: string
    webSearch?: boolean
  }

  // Limit to last 3 messages and truncate lengths to stay under free tier 5k limits
  let messages = (rawMessages ?? []).slice(-3)
  
  // Truncate overly long messages
  messages = messages.map(m => ({
    ...m,
    content: m.content.length > 1000 ? m.content.slice(0, 1000) + '... (truncated)' : m.content
  }))

  let activePrompt = systemPrompt?.trim() || SYSTEM_PROMPT
  if (activePrompt.length > 12000) {
    activePrompt = activePrompt.slice(0, 12000) + "\n... (System prompt truncated)"
  }

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

  // ── Retrieve Memories (RAG) ────────────────────────────────────────────────
  let contextAddon = ''
  if (lastMsg?.role === 'user') {
    try {
      const queryEmbedding = await embed(lastMsg.content)
      const { data: memories, error: memErr } = await supabase.rpc('match_memories', {
        query_embedding: queryEmbedding,
        match_threshold: 0.72,
        match_count: 5,
        filter_user_id: userId,
      })

      if (!memErr && memories && memories.length > 0) {
        contextAddon = "\n\n# Relevant Context/Memories:\n" + memories.map((m: any) => `- ${m.content}`).join('\n')
      }
    } catch (e) {
      console.error('Failed to retrieve memories', e)
    }
  }

  // Build message array: system + conversation history
  const apiMessages = [
    { role: 'system', content: activePrompt + contextAddon },
    ...messages,
  ]

  // ── Stream from OpenRouter API or OpenAI API ────────────────────────────
  let nvidiaRes: Response
  try {
    if (webSearch) {
      nvidiaRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: apiMessages,
          stream: true,
          tools: availableTools,
        }),
      })
    } else {
      if (!OPENROUTER_KEY) {
        return res.status(500).json({ error: 'Server configuration error: OpenRouter key missing' })
      }
      nvidiaRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://intellivexai.com',
          'X-Title': 'Intellivex AI',
        },
        body: JSON.stringify({
          model: modelLabel, // Use label passed from FE if different
          messages: apiMessages,
          max_tokens: 800,
          temperature: 0.7,
          top_p: 0.95,
          stream: true,
          tools: availableTools,
        }),
      })
    }
  } catch (err) {
    console.error('AI fetch error', err)
    return res.status(502).json({ error: 'AI service connectivity issue', detail: String(err) })
  }

  if (!nvidiaRes.ok) {
    const errorBody = await nvidiaRes.text().catch(() => 'No body')
    console.error('AI API error', nvidiaRes.status, errorBody)
    return res.status(502).json({ 
      error: `AI service error (${nvidiaRes.status})`, 
      detail: errorBody.length > 500 ? errorBody.slice(0, 500) + '...' : errorBody 
    })
  }

  // ── Pipe SSE stream to client ──────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const reader = nvidiaRes.body?.getReader()
  if (!reader) return res.status(502).json({ error: 'OpenRouter stream initialization failed' })

  const decoder = new TextDecoder()
  let fullContent = ''
  let inToolCall = false

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      
      const lines = chunk.split('\n')
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6)
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n')
            continue
          }
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta

            // Handle native tool calls -> Map to <tool> XML format for our frontend parser
            if (delta?.tool_calls) {
              let fakeContent = ''
              for (const tc of delta.tool_calls) {
                if (tc.function?.name) {
                  inToolCall = true
                  fakeContent += `\n<tool name="${tc.function.name}">\n${tc.function.arguments || ''}`
                } else if (tc.function?.arguments) {
                  fakeContent += tc.function.arguments
                }
              }
              if (fakeContent) {
                fullContent += fakeContent
                res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: fakeContent } }] })}\n\n`)
              }
            } else if (delta?.content) {
              fullContent += delta.content
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: delta.content } }] })}\n\n`)
            }

            // Close the tool block when finish_reason is 'tool_calls'
            if (parsed.choices?.[0]?.finish_reason === 'tool_calls' && inToolCall) {
              const closeTag = `\n</tool>\n`
              fullContent += closeTag
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: closeTag } }] })}\n\n`)
              inToolCall = false
            }
          } catch (e) { 
             // skip malformed chunks or forward raw if not in tool call
             console.warn('Failed to parse SSE line', trimmedLine, e)
          }
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
  } catch (error: any) {
    console.error('CHAT_API_CRASH:', error)
    // If we already started streaming, we can't send a JSON response.
    // But Vercel functions generally don't stream like this without issues if they crash.
    if (!res.writableEnded) {
      res.status(500).json({ 
        error: 'API failure', 
        detail: error.message || 'Unknown server error' 
      })
    }
  }
}
