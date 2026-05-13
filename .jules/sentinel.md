## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-13 - [Fix Overly Permissive CORS Configuration]
**Vulnerability:** The backend API handlers and dev server plugin were configured with `res.setHeader('Access-Control-Allow-Origin', '*')`, allowing any origin to make requests to sensitive endpoints if an attacker could trick an authenticated user into visiting a malicious site or if the route was unauthenticated.
**Learning:** Standard security architecture for API handlers requires an explicit whitelist of allowed origins (`ALLOWED_ORIGINS`). Furthermore, when dynamically setting the `Access-Control-Allow-Origin` header based on the incoming request, the `Vary: Origin` header must be included to ensure proper browser and CDN caching behavior.
**Prevention:** Always restrict `Access-Control-Allow-Origin` to known trusted domains rather than using `*`, and strictly configure the `Vary: Origin` header alongside dynamically assigned origins.
