## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2025-02-28 - [CRITICAL] Fix XSS vulnerability in Workspace sandbox
**Vulnerability:** HTML injection/XSS vulnerability inside `runCode` in `src/stores/workspaceStore.ts`.
**Learning:** Directly interpolating user code into a template literal inside an iframe (`<script>${code}</script>`) allows attackers to use `</script>` tags to break out of the context and execute arbitrary code.
**Prevention:** Securely serialize the code using `eval(${JSON.stringify(code).replace(/</g, '\\u003c')})`. This ensures the code is treated as a string, escaping `<` prevents HTML injection.
