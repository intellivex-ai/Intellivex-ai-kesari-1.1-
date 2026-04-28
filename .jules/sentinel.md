## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-04-16 - [Fix overly permissive CORS configuration]
**Vulnerability:** The application was globally setting `Access-Control-Allow-Origin: *` across all API handlers and the dev server plugin, which poses a severe security risk by allowing any website to make unauthorized requests.
**Learning:** Due to how caching handles dynamic responses based on request headers, it's critical to include `Vary: Origin` to prevent CDN/cache poisoning with a cached response intended for a specific origin.
**Prevention:** Always explicitly define a whitelist of trusted origins and dynamically set the `Access-Control-Allow-Origin` response header only if the request's origin matches one from the list. Always remember to append `Vary: Origin` to avoid cache issues.
