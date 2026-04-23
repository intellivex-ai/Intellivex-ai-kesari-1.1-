## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-04-23 - [Fix XSS in workspaceStore JS sandbox]
**Vulnerability:** Cross-Site Scripting (XSS) via premature script tag closing. The user-provided code was directly interpolated into the `srcdoc` property of an iframe containing a `<script>` tag. An attacker could inject `</script><script>alert("XSS")</script>` to escape the sandbox.
**Learning:** Direct string interpolation of user input inside a `<script>` block, especially inside an iframe's `srcdoc`, is highly vulnerable to HTML injection.
**Prevention:** Always escape user input when injecting into a script context. Using `encodeURIComponent` before injection and `eval(decodeURIComponent(...))` inside the script execution block ensures the code is treated as a string payload, preventing it from breaking out of the script tag context.
