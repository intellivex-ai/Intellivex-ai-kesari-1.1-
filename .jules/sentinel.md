## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2024-05-18 - [Fix Code Sandbox HTML Injection / XSS]
**Vulnerability:** The JavaScript sandbox code in `src/stores/workspaceStore.ts` inserted raw user input directly into an iframe `<script>` block (`${code}`). This allowed attackers or malicious output to inject `</script>` to prematurely end the JS context and inject arbitrary HTML/JS (XSS).
**Learning:** Even if an iframe has `sandbox="allow-scripts"`, HTML script injections allow malicious scripts to break out of logical execution contexts (like `try/catch` error handlers), potentially manipulating postMessage outputs or exploiting the app. `JSON.stringify()` is not sufficient to prevent this because it doesn't escape `<` or `/`.
**Prevention:** Always serialize code being placed inside a script tag within an HTML string. `encodeURIComponent` correctly encodes all HTML control characters (like `<`), which can then be safely reconstructed using `eval(decodeURIComponent(encodedCode))` at runtime.
