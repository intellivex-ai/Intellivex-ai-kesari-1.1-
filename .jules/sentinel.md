## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-18 - [Fix IDOR in vite-api-plugin.ts /api/messages]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could read or write messages to any chat by providing a `chat_id` in the local development server API (`vite-api-plugin.ts`).
**Learning:** Similar to the production API endpoints, the local development server uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses Row Level Security. We must explicitly verify resource ownership even in the local mock/plugin APIs.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource, regardless of whether it is a Vercel endpoint or a local Vite plugin endpoint.
