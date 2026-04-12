// ── Types ─────────────────────────────────────────────────────────────────────
export interface Chat {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

// ── Token helper ──────────────────────────────────────────────────────────────
type TokenGetter = () => Promise<string | null>

let _getToken: TokenGetter = async () => null

export function setTokenGetter(fn: TokenGetter) {
  _getToken = fn
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await _getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Chats ─────────────────────────────────────────────────────────────────────
export async function fetchChats(): Promise<Chat[]> {
  const headers = await authHeaders()
  const res = await fetch('/api/chats', { headers })
  if (!res.ok) throw new Error(`fetchChats failed: ${res.status}`)
  return res.json()
}

export async function createChat(title: string): Promise<Chat> {
  const headers = await authHeaders()
  const res = await fetch('/api/chats', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error(`createChat failed: ${res.status}`)
  return res.json()
}

export async function deleteChat(chatId: string): Promise<void> {
  const headers = await authHeaders()
  const res = await fetch(`/api/chats?id=${chatId}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`deleteChat failed: ${res.status}`)
}

export async function renameChat(chatId: string, title: string): Promise<void> {
  const headers = await authHeaders()
  const res = await fetch(`/api/chats`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: chatId, title }),
  })
  if (!res.ok) throw new Error(`renameChat failed: ${res.status}`)
}

// ── Messages ──────────────────────────────────────────────────────────────────
export async function fetchMessages(chatId: string): Promise<Message[]> {
  const headers = await authHeaders()
  const res = await fetch(`/api/messages?chat_id=${chatId}`, { headers })
  if (!res.ok) throw new Error(`fetchMessages failed: ${res.status}`)
  return res.json()
}

export async function postMessage(chatId: string, role: Message['role'], content: string): Promise<Message> {
  const headers = await authHeaders()
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, role, content }),
  })
  if (!res.ok) throw new Error(`postMessage failed: ${res.status}`)
  return res.json()
}

// ── Streaming Chat ───────────────────────────────────────────────────────────
export interface StreamChatOptions {
  chatId: string
  messages: Array<{ role: string; content: string }>
  model?: string
  systemPrompt?: string
  signal?: AbortSignal
  onToken: (token: string) => void
  onDone: (fullContent: string) => void
  onError: (err: Error) => void
}

export async function streamChat({
  chatId,
  messages,
  model,
  systemPrompt,
  signal,
  onToken,
  onDone,
  onError,
}: StreamChatOptions): Promise<void> {
  const headers = await authHeaders()

  let response: Response
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, messages, model, systemPrompt }),
      signal,
    })
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)))
    return
  }

  if (!response.ok) {
    onError(new Error(`API error: ${response.status}`))
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onError(new Error('No response body'))
    return
  }

  const decoder = new TextDecoder()
  let fullContent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      // SSE format: "data: <token>\n\n"
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onDone(fullContent)
            return
          }
          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content ?? ''
            if (token) {
              fullContent += token
              onToken(token)
            }
          } catch {
            // skip malformed SSE frames
          }
        }
      }
    }
    onDone(fullContent)
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)))
  } finally {
    reader.releaseLock()
  }
}
