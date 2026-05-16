## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-16 - [Fix overly permissive CORS configuration]
**Vulnerability:** The API endpoints were configured with a wildcard `Access-Control-Allow-Origin: *`, which could allow malicious websites to make cross-origin requests to the API.
**Learning:** The application was missing explicit allowed origins for its API endpoints.
**Prevention:** Always restrict `Access-Control-Allow-Origin` to known and trusted origins using a whitelist pattern.
