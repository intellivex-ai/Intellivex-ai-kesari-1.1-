## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2024-05-18 - Missing Authorization in Vite API Mock
**Vulnerability:** Missing authorization checks in the /api/messages GET and POST endpoints.
**Learning:** The Vite dev server mock (vite-api-plugin.ts) connects to Supabase using the service_role key, bypassing Row Level Security. All endpoints must manually implement authorization.
**Prevention:** Ensure explicit ownership checks (e.g., verifying user_id matches) are added to all data-fetching endpoints when using service_role keys.
