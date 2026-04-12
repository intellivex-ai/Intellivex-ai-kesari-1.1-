import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@clerk/backend'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  // Upsert user
  await supabase.from('users').upsert({ id: userId }, { onConflict: 'id' })

  // ── GET /api/chats — list user's chats ─────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data ?? [])
  }

  // ── POST /api/chats — create new chat ─────────────────────────────────────
  if (req.method === 'POST') {
    const { title = 'New chat' } = req.body as { title?: string }
    const { data, error } = await supabase
      .from('chats')
      .insert({ user_id: userId, title })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  // ── PATCH /api/chats — rename chat ────────────────────────────────────────
  if (req.method === 'PATCH') {
    const { id, title } = req.body as { id: string; title: string }
    if (!id || !title) return res.status(400).json({ error: 'Missing id or title' })

    // Verify ownership
    const { data: chat } = await supabase.from('chats').select('user_id').eq('id', id).single()
    if (!chat || chat.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

    const { error } = await supabase
      .from('chats')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  // ── DELETE /api/chats?id=xxx — delete chat ────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query as { id: string }
    if (!id) return res.status(400).json({ error: 'Missing id' })

    // Verify ownership
    const { data: chat } = await supabase.from('chats').select('user_id').eq('id', id).single()
    if (!chat || chat.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

    const { error } = await supabase.from('chats').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
