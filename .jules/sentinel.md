## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2025-02-27 - [Fix IDOR in Memory API and Protect Local Dev Mocks]
**Vulnerability:** IDOR in the POST `/api/memory` route on the `store` action, allowing users to associate memories with chats they don't own. Also, local dev mocks were removed inappropriately.
**Learning:** `api/memory.ts` was bypassing chat ownership verification for `memories` insertion, unlike the messages API. Additionally, `vite-api-plugin.ts` relies on returning a string (e.g. `'dev-user'`) from `getUserId()` to fallback during dev testing without Clerk configured locally, and setting it to `null` breaks local build and testing.
**Prevention:** Ensure any mutation associated with a chat explicitly verifies ownership against the DB first. When working with dev server mocks, preserve the fallback logic unless explicitly migrating to strict authentication checks.
