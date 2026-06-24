## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-06-24 - [Local Dev API IDOR Vulnerability]
**Vulnerability:** Insecure Direct Object Reference (IDOR) on `/api/messages` in `vite-api-plugin.ts`.
**Learning:** The local Vite dev server uses `SUPABASE_SERVICE_ROLE_KEY` for its `sbFetch` utility, which completely bypasses Row Level Security (RLS). Because the `GET` and `POST` message handlers did not explicitly verify that the `userId` making the request actually owned the `chat_id` being queried or mutated, any authenticated user could read or write messages to any chat.
**Prevention:** When building local mock endpoints or utilizing service role keys, always manually implement strict resource ownership checks before executing database queries.
