## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-04-16 - [Fix IDOR in POST /api/messages & GET /api/messages]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert messages into any other user's chat via the local dev server plugin `vite-api-plugin.ts` because `chat_id` was not verified.
**Learning:** The local Vite dev server used `SUPABASE_SERVICE_ROLE_KEY` via `sbFetch`, completely bypassing RLS. While this is acceptable for development *if* manual ownership checks are in place, the `POST /api/messages` and `GET /api/messages` handlers lacked these manual `chat.user_id === userId` checks.
**Prevention:** Mirror the security architecture of the production Vercel backend (`api/messages.ts`). Before modifying or accessing any resource (like a message) that belongs to a parent resource (like a chat), query the parent resource to ensure it belongs to the authenticated user.
