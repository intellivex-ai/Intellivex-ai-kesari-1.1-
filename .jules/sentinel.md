## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2024-05-18 - [Fix IDOR in vite-api-plugin.ts /api/messages]
**Vulnerability:** The dev server endpoints `GET /api/messages` and `POST /api/messages` used `sbFetch` which bypassed RLS due to `SUPABASE_SERVICE_ROLE_KEY`. They lacked proper verification that the `chat_id` provided belonged to the authenticated `userId`, causing an IDOR.
**Learning:** Dev server API mockups must mirror the production endpoints in explicitly verifying resource ownership when RLS is bypassed. Failing to do so creates security regressions in local development APIs.
**Prevention:** Always implement an explicit ownership validation check (e.g., `await sbFetch('GET', 'chats', ...)`) that enforces fail-closed logic (`if (!Array.isArray(...) || !userId_match) return 403`) before serving or modifying records.
