## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-04-15 - [Fix PostgREST Query Injection in vite-api-plugin.ts]
**Vulnerability:** PostgREST Query Injection in the Vite dev server plugin where unencoded user input was concatenated into Supabase raw string queries.
**Learning:** Raw string interpolation for Supabase queries (`id=eq.${id}`) without URL encoding allows attackers to inject additional PostgREST filter clauses (e.g. `123&user_id=eq.target_user`) to bypass Row Level Security (RLS) or manipulate queries.
**Prevention:** Always use `encodeURIComponent` for all user-provided data when constructing PostgREST query parameters (e.g., `id=eq.${encodeURIComponent(id)}`), or prefer using Supabase SDK methods like `.eq()` which handle encoding automatically.
