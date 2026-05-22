## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2025-02-28 - [Fix IDOR in vite-api-plugin.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could read or write messages to any other user's chat.
**Learning:** The Vite local dev plugin (`vite-api-plugin.ts`) simulates the Vercel backend using `SUPABASE_SERVICE_ROLE_KEY` directly via `sbFetch`, which bypasses Row Level Security (RLS). Because it was blindly trusting client-provided `chatId`s without verifying ownership against the authenticated user, it opened up a full IDOR on local API environments that mirror prod.
**Prevention:** Whenever bypassing RLS (e.g. via Service Role Keys in simulated environments), you must explicitly implement access control checks (like `verifyChatOwnership`) manually on all endpoints that interact with user-owned data.
