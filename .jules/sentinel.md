## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2023-10-24 - Missing Ownership Validation on Service Role Endpoints
**Vulnerability:** IDOR (Insecure Direct Object Reference) in `api/memory.ts` where memories could be inserted into other users' chats.
**Learning:** The use of `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS). When endpoints use the service role key, implicit RLS protections are lost and must be manually replaced with explicit ownership validation logic.
**Prevention:** Always verify resource ownership (e.g., checking if `chat.user_id === userId`) on any Vercel serverless function or API endpoint that initializes a Supabase client with the service role key before performing mutations.
