## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2024-03-12 - Insecure Direct Object Reference (IDOR) in `/api/messages`
**Vulnerability:** The GET and POST `/api/messages` endpoints in `vite-api-plugin.ts` fetched or inserted messages based on a user-provided `chat_id` without verifying if the requesting user owned that chat.
**Learning:** Relying solely on `user_id` from Clerk authentication is insufficient if we don't map the requested resource (chat) back to that `user_id`. In a system without RLS (Row Level Security), explicit ownership checks at the application level are mandatory for all protected resources to prevent unauthorized data access or tampering.
**Prevention:** Always verify resource ownership against the authenticated user's ID before performing operations (read, write, delete) on that resource. Ensure that array length checks are present when querying Supabase for resource ownership to avoid fail-open scenarios where empty arrays or unexpected data types might evaluate incorrectly.
