## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-04-15 - [Fix IDOR in api/memory.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert memories into any other user's chat database, poisoning their RAG context.
**Learning:** The application initialized Supabase with `SUPABASE_SERVICE_ROLE_KEY` in `api/memory.ts`, bypassing Row Level Security entirely. When handlers use service roles, all resource ownership must be manually verified in the application code. This was missed for the `store` action.
**Prevention:** Always query the resource (e.g. `chats`) directly to verify the associated `user_id` matches the authenticated user token before inserting related objects, particularly when bypassing RLS with a service role.
