## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-04-24 - [Fix Overly Permissive CORS Configuration]
**Vulnerability:** Several backend API endpoints (`api/chats.ts`, `api/messages.ts`, `api/generate-image.ts`) and the dev server plugin (`vite-api-plugin.ts`) were configured with `Access-Control-Allow-Origin: *`. This is overly permissive and potentially exposes sensitive APIs to malicious origins.
**Learning:** Returning a wildcard `*` for CORS opens the application to Cross-Origin Resource Sharing vulnerabilities. It violates the principle of least privilege, especially if API endpoints handle sensitive information or actions.
**Prevention:** Always restrict `Access-Control-Allow-Origin` dynamically based on a strict whitelist of allowed origins (e.g., `['https://intellivexai.com', 'http://localhost:5173', 'http://localhost:3000']`). Crucially, when setting the origin dynamically based on the request header, always include `res.setHeader('Vary', 'Origin')` to ensure correct caching behavior by proxies or CDNs.
