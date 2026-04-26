## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2024-05-24 - [Iframe Sandbox Escape via HTML Injection]
**Vulnerability:** Code injection/XSS vulnerability found in `src/stores/workspaceStore.ts` where raw user input `${code}` was directly injected into an iframe `<script>` block. This allowed premature tag closing (`</script>`) to escape the generated error-handling context and execute arbitrary JS outside the intended `try/catch` wrapper, or perform HTML injection.
**Learning:** Directly interpolating user-provided code strings into script tags within an iframe is unsafe, even in a sandboxed iframe (`allow-scripts`), as it breaks structural integrity if the input contains closing tags.
**Prevention:** Always serialize and properly encode injected code (e.g., via `eval(decodeURIComponent(encodeURIComponent(code)))`) instead of directly embedding raw variables to guarantee boundary separation between the host wrapper and the user code.
