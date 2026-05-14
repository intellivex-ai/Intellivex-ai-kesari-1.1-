## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2025-02-13 - [Isolated iframe XSS Vulnerability]
**Vulnerability:** The code execution sandbox in `src/stores/workspaceStore.ts` directly interpolated user-provided code into an iframe's `<script>` tag via the `srcdoc` property using template literals (e.g., `${code}`). This could allow HTML injection/XSS vulnerabilities if the code contained `</script>`.
**Learning:** Even inside isolated sandboxes (like iframes with `allow-scripts`), direct string interpolation into `<script>` tags can lead to breakout vulnerabilities if the inserted string closes the tag early.
**Prevention:** Always serialize injected code securely before evaluation. In `srcdoc` contexts, serialize using `eval(${JSON.stringify(code).replace(/</g, '\\u003c')})` to prevent script tags from breaking out without breaking valid user code containing single quotes.
