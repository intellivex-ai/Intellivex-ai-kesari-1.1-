## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-06-06 - [Fix Overly Permissive CORS Configuration]
**Vulnerability:** Several backend API endpoints and the local development proxy had overly permissive CORS configurations (`Access-Control-Allow-Origin: *`), allowing any domain to send cross-origin requests to the API.
**Learning:** The application had previously configured CORS with a wildcard, creating a security risk for data leakage via CSRF-style attacks if authentication was handled via cookies or other automatic mechanisms.
**Prevention:** Use an `ALLOWED_ORIGINS` whitelist to dynamically check and set `Access-Control-Allow-Origin`, and ensure to include `res.setHeader('Vary', 'Origin')` to prevent caching misconfigurations.
