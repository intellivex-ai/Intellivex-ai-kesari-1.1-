## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-18 - IDOR in Vite Dev API Plugin
**Vulnerability:** Insecure Direct Object Reference (IDOR) in `/api/messages` routes within `vite-api-plugin.ts` where chat ownership was not verified before querying or inserting messages via Supabase PostgREST.
**Learning:** `sbFetch` relies on the `service_role` key, which completely bypasses Row Level Security (RLS). Ensuring ownership in the dev API mock is just as critical as the production endpoints (`api/messages.ts`), because dev environments can sometimes be exposed. Furthermore, PostgREST empty responses must be explicitly handled with `Array.isArray(data) && data.length > 0` to prevent fail-open evaluations.
**Prevention:** Always verify resource ownership when retrieving or modifying child resources, and validate PostgREST responses with strict array/length checks instead of basic truthiness checks.
