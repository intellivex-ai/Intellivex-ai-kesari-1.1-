## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-18 - Prevent IDOR in local API dev server
**Vulnerability:** The local development API routes (`vite-api-plugin.ts`) were missing chat ownership verification on `/api/messages` endpoints (GET and POST). Because it acts as a proxy to Supabase using `SUPABASE_SERVICE_ROLE_KEY`, it bypassed Row Level Security (RLS) and would have allowed fetching and inserting messages into other users' chats if the `chat_id` was known/guessed.
**Learning:** Local API proxy plugins that use Service Role keys to mimic backend serverless functions are particularly vulnerable to IDOR because they naturally bypass database RLS that you might otherwise rely on.
**Prevention:** Always implement explicit ownership checks inside local API plugin handlers on all REST methods (`GET`, `POST`, `PATCH`, `DELETE`) before performing database interactions on behalf of a user.
