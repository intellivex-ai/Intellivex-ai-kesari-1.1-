## 2026-07-03 - Added IDOR protection to api/memory.ts
**Vulnerability:** IDOR in API `store` endpoint, where user could supply arbitrary `chatId` to inject memories into another user's chat.
**Learning:** Usage of `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and means we must explicitly check resource ownership (`chat.user_id === userId`) on the server.
**Prevention:** Always verify resource ownership when processing inputs that map to resources, especially when the database client is initialized with the service role key.
