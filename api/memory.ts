import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@clerk/backend'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const OPENAI_KEY = process.env.OPENAI_API_KEY || ''

// ── Auth helper ─────────────────────────────────────────────────────────────
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

// ── Generate OpenAI embedding ───────────────────────────────────────────────
async function embed(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Truncate to model limit
    }),
  })
  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`)
  const json = await res.json()
  return json.data[0].embedding
}

// ── Main handler ────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { action, chatId, content, query, limit = 5 } = req.body as {
    action: 'store' | 'retrieve'
    chatId?: string
    content?: string
    query?: string
    limit?: number
  }

  if (action === 'store') {
    // Store a new memory: embed the content and upsert it
    if (!chatId || !content) {
      return res.status(400).json({ error: 'Missing chatId or content' })
    }

    // Verify chat ownership
    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('user_id')
      .eq('id', chatId)
      .single()

    if (chatErr || !chat || chat.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    try {
      const embedding = await embed(content)
      const { error } = await supabase.from('memories').insert({
        user_id: userId,
        chat_id: chatId,
        content,
        embedding,
        created_at: new Date().toISOString(),
      })
      if (error) {
        console.error('Memory store error:', error)
        return res.status(500).json({ error: 'Failed to store memory' })
      }
      return res.json({ ok: true })
    } catch (err) {
      console.error('Embedding error:', err)
      return res.status(502).json({ error: 'Embedding service unavailable' })
    }
  }

  if (action === 'retrieve') {
    // Retrieve relevant memories via semantic similarity (cosine distance)
    if (!query) return res.status(400).json({ error: 'Missing query' })
    try {
      const queryEmbedding = await embed(query)
      // Use pgvector's cosine similarity search via Supabase RPC
      const { data, error } = await supabase.rpc('match_memories', {
        query_embedding: queryEmbedding,
        match_threshold: 0.72,
        match_count: limit,
        filter_user_id: userId,
      })
      if (error) {
        console.error('Memory retrieve error:', error)
        return res.status(500).json({ error: 'Failed to retrieve memories' })
      }
      return res.json({ memories: data ?? [] })
    } catch (err) {
      console.error('Embedding error (retrieve):', err)
      return res.status(502).json({ error: 'Embedding service unavailable' })
    }
  }

  return res.status(400).json({ error: 'Unknown action' })
}
