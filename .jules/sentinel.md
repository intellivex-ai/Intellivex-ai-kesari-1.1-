## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2024-05-18 - [Fix IDOR in api/messages endpoint]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could retrieve or insert messages into any other user's chat.
**Learning:** The `/api/messages` endpoint was missing explicit resource ownership verification on the server side when performing operations via API endpoints that accept identifiers (like `chat_id`) from the client. Additionally, checking for error conditions needed to be robust using `Array.isArray` instead of truthiness due to how Supabase fetch failures return object payloads.
**Prevention:** Always verify resource ownership by querying the parent table (e.g., `chats`) to match the `user_id` with the authenticated `userId` before allowing read or write access on that resource. Ensure that error checks on such validation fail securely.
