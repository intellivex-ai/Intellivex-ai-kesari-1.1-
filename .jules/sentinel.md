## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-05-01 - [Fix XSS in workspaceStore.ts]
**Vulnerability:** XSS vulnerability where user code injected directly into an iframe via `${code}` could break out of the script tag and execute arbitrary code outside the intended execution sandbox.
**Learning:** Even isolated sandbox iframes can be exploited if the injected content itself isn't securely serialized, particularly allowing script tag breakout.
**Prevention:** Always properly serialize injected user code inside templates (e.g., using `JSON.stringify(code).replace(/</g, '\\u003c')`) and evaluate it using `eval()` to safely pass strings that might contain `</script>` tags while preserving single quote integrity.
