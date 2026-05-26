## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2025-02-28 - PostgREST IDOR & Query Injection in Vite Plugin
**Vulnerability:** IDOR (Insecure Direct Object Reference) and PostgREST Query Injection in local dev endpoints handled by `vite-api-plugin.ts` (`POST /api/chat`, `GET /api/messages`, `PATCH /api/chats`, etc).
**Learning:** `sbFetch` wrapper bypassed Row Level Security by using the `SUPABASE_SERVICE_ROLE_KEY`. User inputs in `id` and `chatId` were directly concatenated into queries without URI encoding or checking if the resource belonged to the requesting user, making the dev server completely vulnerable to IDORs and injection via query parameters.
**Prevention:** Always verify resource ownership (e.g. `verifyChatOwnership`) in dev handlers that use Service Role keys, and strictly wrap user-provided data with `encodeURIComponent` when assembling PostgREST query parameters.
