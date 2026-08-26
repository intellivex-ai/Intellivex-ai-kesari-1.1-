## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-04-16 - [Fix IDOR in api/memory.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could store memories into any other user's chat.
**Learning:** The application was missing explicit authorization checks on the server side when performing memory storage via API endpoints that accept identifiers (like `chatId`) from the client, similar to a previously identified issue in image generation.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing data insertions or modifications on that resource.
