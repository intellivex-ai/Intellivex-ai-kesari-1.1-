## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-04-16 - [Fix IDOR in vite-api-plugin.ts /api/messages endpoint]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could query or insert messages into any other user's chat.
**Learning:** In the Vite dev server `vite-api-plugin.ts`, the Supabase client `sbFetch` uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses Row Level Security. Therefore, manual explicit resource ownership validation checks must be performed. In addition, when dealing with arrays on success, validation checks like `!chatData` were insufficient.
**Prevention:** Always perform a manual DB lookup to match the `user_id` of the resource with the currently authenticated user's ID and safely validate arrays using `!Array.isArray(data) || data.length === 0` to fail securely.
