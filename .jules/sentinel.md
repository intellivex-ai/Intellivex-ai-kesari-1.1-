## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-04-15 - [Fix IDOR in vite-api-plugin.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could read or post messages, or generate images, into any other user's chat on the local dev server.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the local development proxy endpoints `/api/messages` and `/api/generate-image` that accept `chatId` from the client, similar to the already patched `api/generate-image.ts` serverless function.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) in local proxy servers using `sbFetch` before allowing access or modifications on that resource.
