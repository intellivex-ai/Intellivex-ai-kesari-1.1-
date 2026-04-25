## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-04-25 - [Fix Overly Permissive CORS Configuration]
**Vulnerability:** The backend APIs and dev server used `Access-Control-Allow-Origin: *`, allowing any website to make requests to the API. If combined with credentials or unauthenticated endpoints, this could lead to Cross-Site Request Forgery (CSRF) or data exposure.
**Learning:** Hardcoded wildcard CORS headers are common in boilerplate but dangerous in production when sensitive user data is handled.
**Prevention:** Always restrict CORS to an explicitly approved whitelist of known frontend origins and include `Vary: Origin` to prevent caching attacks.
