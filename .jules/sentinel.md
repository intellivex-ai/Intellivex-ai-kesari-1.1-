## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-06-03 - [Fix PostgREST Query Injection in vite-api-plugin.ts]
**Vulnerability:** PostgREST Query Injection where unsanitized user inputs (such as `chatId` and `id`) were passed directly into Supabase REST API query strings via `sbFetch`, allowing an attacker to inject arbitrary query parameters.
**Learning:** When manually constructing query strings for REST APIs like Supabase/PostgREST, all user-provided data must be properly URL-encoded to prevent query parameter injection.
**Prevention:** Always use `encodeURIComponent()` on any user-provided data before interpolating it into a query string, even if the data is expected to be a UUID or simple string.
