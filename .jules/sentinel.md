## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-05-12 - [Fix PostgREST Query Injection]
**Vulnerability:** PostgREST Query Injection in dev server plugin where user-provided IDs were directly interpolated into Supabase queries without URL encoding.
**Learning:** Raw string interpolation in URLs (e.g., `id=eq.${id}`) can allow an attacker to inject additional query parameters (like `&user_id=eq.attacker`), potentially bypassing authorization filters.
**Prevention:** Always use `encodeURIComponent()` for any dynamic parameter values inserted into a query string in REST API calls.
