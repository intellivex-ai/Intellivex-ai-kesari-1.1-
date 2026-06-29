## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2025-02-28 - [Fix IDOR in vite-api-plugin.ts messages endpoint]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user in the local development environment could read or insert messages into any other user's chat. The `GET /api/messages` and `POST /api/messages` handlers lacked resource ownership verification.
**Learning:** Because `vite-api-plugin.ts` mimics the production Vercel serverless environment but inherently uses `SUPABASE_SERVICE_ROLE_KEY` (bypassing RLS), explicit manual resource ownership validation must be replicated in local dev to mirror production security correctly and prevent security regression false positives in development.
**Prevention:** Always implement explicit user ID ownership checks manually when writing database queries in endpoints that act as proxies or utilize a service role, mirroring the security that RLS would usually enforce.
