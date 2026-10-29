## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2024-05-18 - [IDOR in Message Retrieval/Creation]
**Vulnerability:** Insecure Direct Object Reference (IDOR) on `/api/messages` GET and POST endpoints in `vite-api-plugin.ts`. Any authenticated user could read or append messages to any chat if they knew or guessed the `chat_id`.
**Learning:** The endpoints blindly accepted a `chat_id` from the query or request body and used it directly in the Supabase PostgREST query (`sbFetch`) without verifying that the authenticated `userId` was actually the owner of the `chats` record.
**Prevention:** Always enforce resource ownership validation checks (e.g., verifying `user_id` matches on the parent resource) prior to allowing data retrieval or modification on sub-resources (like messages) associated with that parent resource.
