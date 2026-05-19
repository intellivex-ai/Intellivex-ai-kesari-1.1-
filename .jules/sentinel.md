## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2025-05-19 - [Fix IDOR in vite-api-plugin.ts dev server]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where the Vite dev server endpoints (/api/chat, /api/messages, /api/generate-image) did not check resource ownership, allowing users to modify or view other users' chats locally.
**Learning:** Because the dev server plugin uses `SUPABASE_SERVICE_ROLE_KEY`, it completely bypasses Supabase Row Level Security (RLS). This means explicit resource ownership verification in the local API endpoints is required to mirror the security of production backend endpoints.
**Prevention:** Always implement explicit authorization checks (e.g., verifying `user_id` matches the authenticated `userId`) in any environment or script that uses a service role key to bypass RLS.
