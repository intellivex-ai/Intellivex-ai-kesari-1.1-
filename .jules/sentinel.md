## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-04-14 - IDOR in Memory Storage Endpoint
**Vulnerability:** The `/api/memory` endpoint allowed users to store memories (`action === 'store'`) and associate them with any `chatId` because there was no authorization check verifying that the authenticated user actually owned the target chat.
**Learning:** While other API endpoints (like `chat.ts` and `chats.ts`) correctly verified chat ownership by querying the `chats` table to match the `user_id`, this check was overlooked in the memory creation endpoint, likely due to oversight or copy-pasting code without porting security checks.
**Prevention:** Always verify resource ownership (e.g., querying `user_id` from the database matching the authenticated `userId`) before creating or modifying records on behalf of a user to prevent Insecure Direct Object Reference (IDOR) vulnerabilities, even in auxiliary endpoints like memory or logging.
