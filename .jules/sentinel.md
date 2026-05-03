## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-18 - [Fix XSS/HTML Injection in workspaceStore sandbox]
**Vulnerability:** Code injection vulnerability in `src/stores/workspaceStore.ts` where unescaped user code string was interpolated directly into an iframe `<script>` block using template literals.
**Learning:** Using template literals to inject user code into an HTML context string (`<script>${code}</script>`) allows breaking out of the context if the input contains closing tags like `</script>`.
**Prevention:** Always serialize untrusted input properly for the target context. For script tag bodies, use `JSON.stringify()` combined with escaping HTML characters (like `.replace(/</g, '\\u003c')`), then execute using `eval()` to run safely inside the context without breaking the HTML parser.
