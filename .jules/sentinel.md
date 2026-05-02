## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-02 - [Fix Overly Permissive CORS]
**Vulnerability:** The serverless API functions and the dev server used an overly permissive CORS configuration (`res.setHeader('Access-Control-Allow-Origin', '*')`). This allowed any website to make cross-origin requests to the API, potentially leading to unauthorized data access or actions.
**Learning:** In a production environment, APIs should explicitly restrict origins. When dynamically setting the `Access-Control-Allow-Origin` header based on the incoming `Origin`, the `Vary: Origin` header must also be set to ensure HTTP caches correctly cache the response for different origins.
**Prevention:** Always use an allowlist of trusted origins for CORS configuration. If dynamic origin checking is used, ensure the `Vary: Origin` header is present.
