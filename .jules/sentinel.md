## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-24 - [Fix XSS vulnerability in iframe sandbox]
**Vulnerability:** Code execution sandbox in `src/stores/workspaceStore.ts` used unescaped interpolation (`${code}`) within a `<script>` tag inside an iframe.
**Learning:** This allowed an attacker to break out of the script tag by passing code like `</script><script>alert(1)</script>` which would be evaluated as raw HTML and bypass the `try/catch` block.
**Prevention:** Always serialize untrusted input in JS contexts using `JSON.stringify()` and securely replace `<` with `\u003c` to avoid closing `<script>` tags, then execute with `eval()` if string interpolation in a script block is strictly necessary.
