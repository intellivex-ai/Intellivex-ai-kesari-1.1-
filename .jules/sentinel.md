## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-11-04 - Manual Authorization in Vite Dev API Plugin
**Vulnerability:** The GET /api/messages endpoint lacked ownership verification, allowing unauthorized access to any chat by its ID (IDOR).
**Learning:** The Vite dev server mock (`vite-api-plugin.ts`) connects to Supabase using the `service_role` key, bypassing Row Level Security (RLS). Consequently, all endpoints defined in this file must manually implement explicit authorization checks.
**Prevention:** Always perform explicit array and length checks (e.g., `Array.isArray(data) && data.length > 0`) when verifying resource ownership via `sbFetch` to prevent fail-open vulnerabilities.
