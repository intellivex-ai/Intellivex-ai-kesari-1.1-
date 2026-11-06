## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-11-06 - Missing Resource Ownership Checks with service_role API bypass
**Vulnerability:** IDOR (Insecure Direct Object Reference) vulnerabilities on /api/chat, /api/messages, and /api/generate-image where any user could read or modify another user's chat messages.
**Learning:** The custom Vite API uses the Supabase service_role key, which completely bypasses Row Level Security (RLS) protections configured in the database.
**Prevention:** Always implement explicit ownership verification (e.g., verifying user_id against the resource) when using service_role keys to interact with databases on behalf of users.
