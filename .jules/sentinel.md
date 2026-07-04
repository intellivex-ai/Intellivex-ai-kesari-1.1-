## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-07-04 - Fix IDOR in Memory Endpoint using Supabase Service Role Key
**Vulnerability:** IDOR vulnerability in `api/memory.ts` allowing a user to write memories to another user's chat.
**Learning:** `SUPABASE_SERVICE_ROLE_KEY` bypasses Supabase Row Level Security (RLS). When server endpoints use it, explicit manual ownership checks are required to ensure the user making the request has access to the target resource.
**Prevention:** Always manually verify resource ownership (`chat_id`, etc.) matches the authenticated `userId` before performing operations like `INSERT`, `UPDATE`, or `DELETE` when using the service role key.
