import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { createClerkClient } from '@clerk/backend'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

async function getUserId(req: VercelRequest): Promise<string | null> {
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
  const { data } = await supabase
    .from('chats')
    .select('user_id')
    .eq('id', chatId)
    .single()
  return !!data && data.user_id === userId
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  // ── GET /api/messages?chat_id=xxx ─────────────────────────────────────────
  if (req.method === 'GET') {
    const { chat_id } = req.query as { chat_id: string }
    if (!chat_id) return res.status(400).json({ error: 'Missing chat_id' })

    const owned = await verifyChatOwnership(chat_id, userId)
    if (!owned) return res.status(403).json({ error: 'Forbidden' })

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data ?? [])
  }

  // ── POST /api/messages ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { chat_id, role, content } = req.body as {
      chat_id: string
      role: 'user' | 'assistant' | 'system'
      content: string
    }

    if (!chat_id || !role || !content) {
      return res.status(400).json({ error: 'Missing chat_id, role, or content' })
    }

    const owned = await verifyChatOwnership(chat_id, userId)
    if (!owned) return res.status(403).json({ error: 'Forbidden' })

    const { data, error } = await supabase
      .from('messages')
      .insert({ chat_id, role, content })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
