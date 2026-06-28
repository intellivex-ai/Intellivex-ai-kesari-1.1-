## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2025-02-27 - IDOR in Local Dev Server Messages Endpoint
**Vulnerability:** Missing authorization check in `GET /api/messages` and `POST /api/messages` inside the Vite local dev server (`vite-api-plugin.ts`). Malicious users could read or write messages to `chat_id`s belonging to other users.
**Learning:** The dev server relies on `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security. Because of this, explicit resource ownership checks must be implemented manually at the handler level. The production endpoints (`api/messages.ts`) had this check (`verifyChatOwnership`), but the local dev equivalent missed it.
**Prevention:** Whenever bypassing RLS with a service role key in an API layer, always enforce strict manual ownership checks (`user_id === userId`) on the exact resource being accessed before yielding or mutating data. Ensure `encodeURIComponent` is used to prevent PostgREST injection.
