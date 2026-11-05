## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-11-05 - Missing Resource Ownership Validation in Dev Server API
**Vulnerability:** Dev server endpoints in vite-api-plugin.ts bypassed resource checks, allowing cross-user data access.
**Learning:** The dev server connects to Supabase using the service_role key, which bypasses Row Level protections. Because it relies on the same REST API as the frontend, it incorrectly assumes the database will enforce user isolation.
**Prevention:** Endpoints using service_role keys must manually implement explicit resource ownership checks (e.g., verifying user_id) on all operations to ensure safe data isolation.
