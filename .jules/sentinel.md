## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-04-16 - [Fix IDOR in api/memory.ts]
**Vulnerability:** IDOR where any authenticated user could store memories in any other user's chat, since the `chat_id` wasn't verified against the authenticated user's chats.
**Learning:** Similar to api/generate-image.ts, any endpoint taking a chatId needs to verify ownership of the chat.
**Prevention:** Always verify resource ownership before insertion.
