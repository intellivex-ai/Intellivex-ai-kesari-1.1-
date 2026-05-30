## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2025-02-27 - [Fix IDOR in vite-api-plugin.ts]
**Vulnerability:** IDOR in local Vite API dev server plugin where `GET` and `POST` to `/api/messages` used `chat_id` from user input without verifying if the authenticated user owned the chat.
**Learning:** Even though this is local dev infrastructure, it bypasses RLS (by using the service role key). Relying on the client to send the right `chat_id` allows any user to read/write messages in other chats if they happen to know the `chat_id` or if it's deployed to an environment where dev tools are exposed.
**Prevention:** Always implement explicit ownership checks for any resource passed by ID, even in local dev plugins, when RLS is bypassed. Query the `chats` table to verify `user_id` matches the authenticated user before allowing read/write operations.
