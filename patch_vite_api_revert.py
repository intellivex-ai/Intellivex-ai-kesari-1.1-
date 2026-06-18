import re

with open('vite-api-plugin.ts', 'r') as f:
    content = f.read()

content = content.replace("function decodeClerkJwt(token: string): string | null {\n  try {\n    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())\n    return payload.sub ?? null\n  } catch { return null }\n}", "function decodeClerkJwt(token: string): string {\n  try {\n    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())\n    return payload.sub ?? 'dev-user'\n  } catch { return 'dev-user' }\n}")
content = content.replace("async function getUserId(authHeader: string | undefined): Promise<string | null> {\n  if (!authHeader?.startsWith('Bearer ')) return null\n  return decodeClerkJwt(authHeader.slice(7))\n}", "async function getUserId(authHeader: string | undefined): Promise<string> {\n  if (!authHeader?.startsWith('Bearer ')) return 'dev-user'\n  return decodeClerkJwt(authHeader.slice(7))\n}")
content = content.replace("const userId = await getUserId(req.headers.authorization)\n        if (!userId) { return sendJson(res, 401, { error: 'Unauthorized' }) }", "const userId = await getUserId(req.headers.authorization)")

with open('vite-api-plugin.ts', 'w') as f:
    f.write(content)
