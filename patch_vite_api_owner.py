import re

with open('vite-api-plugin.ts', 'r') as f:
    content = f.read()

# Add checkChatOwner helper function
check_owner_helper = """
async function checkChatOwner(chatId: string, userId: string): Promise<boolean> {
  if (!isSupabaseReady()) return true;
  const data = await sbFetch('GET', 'chats', `id=eq.${chatId}&select=user_id`);
  const chat = Array.isArray(data) ? data[0] : data;
  return chat && chat.user_id === userId;
}

// ── Plugin ─────────────────────────────────────────────────────────────────────"""

content = content.replace('// ── Plugin ─────────────────────────────────────────────────────────────────────', check_owner_helper)


# POST /api/chat check
post_chat_replace = """          // ══ POST /api/chat ══════════════════════════════════════════════════
          if (pathname === '/api/chat' && req.method === 'POST') {
            const body = await parseBody(req)
            const chatId = body.chatId as string

            if (chatId) {
                const isOwner = await checkChatOwner(chatId, userId);
                if (!isOwner) return sendJson(res, 403, { error: 'Forbidden' });
            }"""

content = re.sub(r'          // ══ POST /api/chat ══════════════════════════════════════════════════\n          if \(pathname === \'/api/chat\' && req.method === \'POST\'\) \{\n            const body = await parseBody\(req\)\n            const chatId = body\.chatId as string', post_chat_replace, content)


# GET /api/messages check
get_messages_replace = """          // ══ GET /api/messages ═══════════════════════════════════════════════
          if (pathname === '/api/messages' && req.method === 'GET') {
            const chat_id = query.chat_id as string
            if (!isSupabaseReady() || !chat_id) return sendJson(res, 200, [])
            const isOwner = await checkChatOwner(chat_id, userId);
            if (!isOwner) return sendJson(res, 403, { error: 'Forbidden' });
            const data = await sbFetch('GET', 'messages', `chat_id=eq.${encodeURIComponent(chat_id)}&order=created_at.asc`)"""

content = re.sub(r'          // ══ GET /api/messages ═══════════════════════════════════════════════\n          if \(pathname === \'/api/messages\' && req.method === \'GET\'\) \{\n            const chat_id = query\.chat_id as string\n            if \(\!isSupabaseReady\(\) \|\| \!chat_id\) return sendJson\(res, 200, \[\]\)\n            const data = await sbFetch\(\'GET\', \'messages\', `chat_id=eq\.\$\{encodeURIComponent\(chat_id\)\}&order=created_at\.asc`\)', get_messages_replace, content)


# POST /api/messages check
post_messages_replace = """          // ══ POST /api/messages ══════════════════════════════════════════════
          if (pathname === '/api/messages' && req.method === 'POST') {
            const body = await parseBody(req)
            const chat_id = body.chat_id as string;
            if (chat_id) {
               const isOwner = await checkChatOwner(chat_id, userId);
               if (!isOwner) return sendJson(res, 403, { error: 'Forbidden' });
            }
            if (!isSupabaseReady()) {"""

content = re.sub(r'          // ══ POST /api/messages ══════════════════════════════════════════════\n          if \(pathname === \'/api/messages\' && req.method === \'POST\'\) \{\n            const body = await parseBody\(req\)\n            if \(\!isSupabaseReady\(\)\) \{', post_messages_replace, content)

# POST /api/generate-image check
post_image_replace = """          // ══ POST /api/generate-image ═════════════════════════════════════════
          if (pathname === '/api/generate-image' && req.method === 'POST') {
            const body = await parseBody(req)
            const { prompt, style, chatId } = body as { prompt: string; style?: string; chatId: string }

            if (!prompt?.trim() || !chatId) {
              return sendJson(res, 400, { error: 'Missing prompt or chatId' })
            }

            const isOwner = await checkChatOwner(chatId, userId);
            if (!isOwner) return sendJson(res, 403, { error: 'Forbidden' });"""

content = re.sub(r'          // ══ POST /api/generate-image ═════════════════════════════════════════\n          if \(pathname === \'/api/generate-image\' && req.method === \'POST\'\) \{\n            const body = await parseBody\(req\)\n            const \{ prompt, style, chatId \} = body as \{ prompt: string; style\?: string; chatId: string \}\n\n            if \(\!prompt\?\.trim\(\) \|\| \!chatId\) \{\n              return sendJson\(res, 400, \{ error: \'Missing prompt or chatId\' \}\)\n            \}', post_image_replace, content)

with open('vite-api-plugin.ts', 'w') as f:
    f.write(content)
