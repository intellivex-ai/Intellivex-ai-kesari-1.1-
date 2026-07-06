## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## $(date +%Y-%m-%d) - [Fix IDOR in api/memory.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert memory embeddings into any other user's chat.
**Learning:** Endpoints that use the service role key bypass Row Level Security (RLS) entirely, meaning all authorization checks must be implemented explicitly in the application logic. The missing check allowed users to specify arbitrary `chatId`s when storing memories.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource when using a service role key.
