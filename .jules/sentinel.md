## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-24 - [CRITICAL] Prevent HTML Injection/XSS in Sandbox iframe `srcdoc`
**Vulnerability:** The code execution sandbox in `src/stores/workspaceStore.ts` injected user-provided JavaScript directly into an iframe's `srcdoc` via a template literal (`<script>${code}</script>`). This allowed users to break out of the script tag by providing code like `</script><script>alert(1)</script>`, leading to XSS and arbitrary execution outside the intended sandbox evaluation block.
**Learning:** Even within sandboxed iframes, directly interpolating untrusted code into HTML strings (like `srcdoc`) creates parsing vulnerabilities if the content contains closing tags.
**Prevention:** When injecting user code into an iframe's `srcdoc` via TypeScript template literals, securely serialize it using `eval(${JSON.stringify(code).replace(/</g, '\u003c')})` (requiring a double backslash in the string replacement to ensure proper compilation) before evaluation to prevent HTML injection/XSS breakouts without breaking valid user code.
