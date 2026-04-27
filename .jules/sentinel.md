## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-04-16 - Prevent XSS in iframe srcdoc by avoiding raw code interpolation

**Vulnerability:** The code execution sandbox in `src/stores/workspaceStore.ts` used an isolated iframe but interpolated raw user code directly into the `<script>` tag inside the iframe's `srcdoc`. This allowed HTML injection/XSS because code containing `</script>` could prematurely close the script tag and execute arbitrary scripts or HTML.
**Learning:** Even within a sandboxed iframe, injecting raw user input into an HTML context like `srcdoc` is dangerous if the input contains closing tags (`</script>`). The code can escape the intended script block.
**Prevention:** When injecting user code into an iframe's script tag via `srcdoc`, it must be URL-encoded (e.g., via `encodeURIComponent`) to sanitize it, and then evaluated dynamically (e.g., `eval(decodeURIComponent(...))`) within the script.
