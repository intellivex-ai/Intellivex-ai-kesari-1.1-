## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-30 - Fix IDOR in dev server plugin
**Vulnerability:** Insecure Direct Object Reference (IDOR) and missing authorization checks on the `/api/messages` endpoint in `vite-api-plugin.ts`.
**Learning:** The Vite dev server plugin uses the `SUPABASE_SERVICE_ROLE_KEY` via `sbFetch`, which completely bypasses Supabase Row Level Security (RLS). Because of this, API endpoints handled by the dev server must implement manual resource ownership verification to prevent users from accessing or modifying data that does not belong to them. This mirrors the security requirements of the Vercel backend endpoints in production.
**Prevention:** Whenever creating local API endpoints that interact with a database using a service key or bypassing RLS, ensure that ownership validation is explicitly implemented (e.g., fetching the associated record's `user_id` to ensure it matches the authenticated `userId`). Ensure you fail closed on unauthenticated states (`if (!userId) return 401;`) before checking ownership.
