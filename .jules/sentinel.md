## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-05-18 - [Fix XSS / HTML Injection in Sandbox Iframe]
**Vulnerability:** A Cross-Site Scripting (XSS) / HTML Injection vulnerability was present in `src/stores/workspaceStore.ts`. User-supplied code was interpolated directly into a template literal used as the `srcdoc` of an iframe inside a `<script>` tag. This allowed an attacker to prematurely close the script tag (e.g., `</script>`) and inject arbitrary HTML or external scripts.
**Learning:** Directly interpolating unescaped strings into HTML contexts, especially inside `<script>` tags, is highly dangerous and allows breaking out of string literals or closing parent tags.
**Prevention:** Always encode user-supplied data before inserting it into an HTML context. For injecting executable JavaScript code as a string literal, use `encodeURIComponent` to safely encode it, and then decode and evaluate it at runtime using `eval(decodeURIComponent(encodedCode))`. This ensures the code is treated strictly as a string literal during HTML parsing.
