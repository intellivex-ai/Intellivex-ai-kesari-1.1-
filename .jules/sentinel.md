## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-05-27 - [Fix Overly Permissive CORS Configuration]
**Vulnerability:** Several backend endpoints (`api/chats.ts`, `api/messages.ts`, `api/generate-image.ts`, and `vite-api-plugin.ts`) were globally allowing any origin via `res.setHeader('Access-Control-Allow-Origin', '*')`, and `dev-server.ts` initialized `cors()` without restrictions.
**Learning:** Hardcoded wildcard `*` CORS bypasses same-origin policies entirely, increasing the risk of CSRF and unauthorized cross-origin data exposure.
**Prevention:** Use a predefined `ALLOWED_ORIGINS` whitelist. When setting the header dynamically, always pair it with `res.setHeader('Vary', 'Origin')` to ensure intermediary caches serve correct CORS headers per origin.
