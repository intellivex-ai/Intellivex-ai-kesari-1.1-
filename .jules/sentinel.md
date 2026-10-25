## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2025-05-24 - API Messages IDOR Vulnerability
**Vulnerability:** IDOR in `GET /api/messages` and `POST /api/messages` endpoints allowed unauthorized access to view and create messages in other users' chats.
**Learning:** The endpoints utilized `sbFetch` which bypassed Row Level Security (RLS) by using the service role key. The endpoints extracted `chat_id` from query/body but failed to manually validate that the associated chat belonged to the authenticated `userId` before executing the queries, thus relying solely on the client-provided `chat_id`.
**Prevention:** Whenever bypassing RLS via service key or elevated privileges in API routes, always explicitly validate resource ownership. Before performing operations on a child resource (like `messages`), fetch the parent resource (`chats`) by both its `id` and the current `user_id` to ensure the user actually owns the parent.
