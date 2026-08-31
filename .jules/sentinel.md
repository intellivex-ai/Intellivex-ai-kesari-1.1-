## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-30 - [Fix IDOR in api/memory.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could store memories (embeddings) into any other user's chat.
**Learning:** The `api/memory.ts` endpoint is initialized with the `SUPABASE_SERVICE_ROLE_KEY`, which entirely bypasses Row Level Security (RLS) on the database side. Therefore, the endpoint must manually verify that the resource (the `chatId`) belongs to the authenticated user making the request.
**Prevention:** Whenever using the Supabase Service Role Key to perform operations on behalf of a user, always explicitly query the database to verify the ownership of the parent resource before executing the write/read operation.
