## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-06-02 - [Fix IDOR in local dev server /api/messages endpoint]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could query or insert messages into any other user's chat on the local Vite dev server.
**Learning:** Local development endpoints relying on a shared proxy or `SUPABASE_SERVICE_ROLE_KEY` bypass Supabase's Row Level Security (RLS) protections. Even if Vercel serverless functions handle this securely, local dev server plugins can introduce security flaws if they do not explicitly perform manual resource ownership checks (e.g. comparing the `userId` in `chats` against the authenticated user).
**Prevention:** Always implement explicit, manual authorization checks (e.g., matching authenticated `userId` against resource owner in the database) in custom local development server endpoints, mimicking the production security environment or utilizing explicit logic if relying on an admin connection token.
