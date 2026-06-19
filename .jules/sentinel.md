## 2026-04-15 - [Fix IDOR in /api/messages local plugin]
**Vulnerability:** The local dev server plugin (`vite-api-plugin.ts`) handles `/api/messages` creation without verifying that the `chatId` belongs to the requesting `userId`. Since it uses the `SUPABASE_SERVICE_ROLE_KEY`, it bypasses RLS, resulting in an Insecure Direct Object Reference (IDOR) where a local user could inject messages into another user's chat.
**Learning:** Even when simulating serverless functions locally via Vite dev server plugins, you must enforce resource authorization manually when using a service key. The dev plugin must implement the same ownership checks as the production Vercel functions (e.g. `api/messages.ts`).
**Prevention:** Never use a service role key to insert data on behalf of a user without first explicitly querying the database to ensure the user actually owns the parent resource.

## 2026-04-15 - [Fix fail-open check in dev server]
**Vulnerability:** A previous fix for IDOR incorrectly used `if (!chatCheck || (Array.isArray(chatCheck) && chatCheck.length === 0))` which causes a fail-open condition if the API returns an error object, allowing unauthorized access.
**Learning:** Security checks must fail securely (closed). If an error occurs (the returned object is not an array, or empty), access should be denied.
**Prevention:** Always write conditions such as `if (!Array.isArray(chatCheck) || chatCheck.length === 0) { return 403 }` to ensure any non-array result or error results in a 403 Forbidden.
