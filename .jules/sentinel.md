## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2025-02-28 - Missing Resource Ownership Checks
**Vulnerability:** The dev server bypasses Row Level Security by using a service role key.
**Learning:** The issue existed because endpoints in vite-api-plugin.ts did not manually verify ownership when querying the messages table.
**Prevention:** Endpoints using service role keys must always manually fetch the associated resource and verify the user_id matches the authenticated user.
