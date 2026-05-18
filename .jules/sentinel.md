## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2025-02-27 - Restrict Wildcard CORS Configuration in Serverless APIs
**Vulnerability:** Found multiple Vercel serverless function handlers (`api/chats.ts`, `api/generate-image.ts`, `api/messages.ts`) and the dev server plugin (`vite-api-plugin.ts`) setting `Access-Control-Allow-Origin: *`.
**Learning:** This wildcard configuration allows any domain to read responses from these endpoints, which is overly permissive, especially since these endpoints handle user-specific data via Bearer tokens. Note: `api/chat.ts` and `api/memory.ts` did not have this configuration.
**Prevention:** Implement a whitelist approach for `Access-Control-Allow-Origin` and dynamically echo the requesting origin if it is allowed. Also, always add `res.setHeader('Vary', 'Origin')` when setting CORS headers dynamically to prevent intermediate caching layers from serving a CORS response intended for one origin to a different origin.
