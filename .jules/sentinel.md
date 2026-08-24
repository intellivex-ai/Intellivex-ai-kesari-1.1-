## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-04-16 - [Fix IDOR in api/messages endpoints]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could retrieve or create messages in any other user's chat via the `vite-api-plugin.ts` `GET` and `POST` `/api/messages` endpoints.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the local dev server endpoints, similar to the previously discovered vulnerability in the `generate-image` endpoint.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or retrievals on that resource, especially when Supabase Service Role keys are used, which bypass RLS. Ensure array and length checks are strict when verifying Supabase PostgREST array responses.
