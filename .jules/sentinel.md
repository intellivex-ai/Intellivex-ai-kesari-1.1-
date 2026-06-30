## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2025-02-19 - [Fix XSS via insecure code injection in sandbox iframe]
**Vulnerability:** In `src/stores/workspaceStore.ts`, user-provided code was directly injected into the iframe's `srcdoc` property via a TypeScript template literal: `sandboxFrame.srcdoc = \`<script>\${script}</script>\``.
**Learning:** An attacker could craft user-provided code with `</script><script>alert(1)</script>` to prematurely close the script tag, breaking out of the iframe sandbox string injection context and executing arbitrary code in the main application's context (XSS breakout), because the user string wasn't correctly serialized before being evaluated.
**Prevention:** Always securely serialize code using `eval(${JSON.stringify(code).replace(/</g, '\u003c')})` instead of raw string injection within `srcdoc`, ensuring malicious characters like `<` are escaped properly and script tag closing is impossible.
