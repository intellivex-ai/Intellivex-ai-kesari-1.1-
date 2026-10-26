## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2024-10-24 - [Fix IDOR in api/memory.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert memory embeddings into any other user's chat.
**Learning:** Similar to `generate-image.ts`, the `memory.ts` endpoint used the Supabase service role key to store memories, bypassing Row Level Security. It accepted a `chatId` from the client without explicitly verifying if the `chatId` belonged to the authenticated `userId`.
**Prevention:** Any endpoint initialized with `SUPABASE_SERVICE_ROLE_KEY` that performs CRUD operations based on a client-provided object ID must explicitly query the database to verify the `user_id` matches the authenticated `userId` before proceeding.
