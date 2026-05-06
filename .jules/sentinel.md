## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-04-15 - [Fix XSS in Code Execution Sandbox]
**Vulnerability:** Cross-Site Scripting (XSS) in the code execution sandbox where injecting user code directly into the iframe's `<script>` tag allowed breaking out of the script tag (e.g. `</script><script>alert(1)</script>`) and executing arbitrary HTML/XSS.
**Learning:** Directly injecting unsanitized template literal strings into an HTML context can lead to execution of unexpected code, especially when dealing with user-provided scripts. Even inside a sandboxed iframe, breaking out of the intended tag structure is a risk.
**Prevention:** Always serialize untrusted code before injecting it into an execution context. Using `JSON.stringify(code).replace(/</g, '\u003c')` ensures that the code is safely represented as a string without executable HTML tags, and using `eval()` on that safe string executes the logic as intended.
