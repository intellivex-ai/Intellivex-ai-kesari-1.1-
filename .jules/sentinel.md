## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2026-04-30 - [Fix XSS in workspaceStore sandbox iframe injection]
**Vulnerability:** The application was vulnerable to XSS inside the code execution sandbox (a sandboxed `<iframe>`) because user code was directly interpolated into a string and evaluated as `srcdoc`. If the user code contained `</script>`, it could break out of the generated script block.
**Learning:** Template string interpolation for executing user-provided JS code inside dynamically constructed HTML (like `srcdoc`) creates an HTML injection and XSS vulnerability.
**Prevention:** Securely serialize the JS string utilizing `JSON.stringify(code).replace(/</g, '\\u003c')` before evaluating it with `eval()` inside the sandbox script, instead of directly appending unescaped user string into the HTML `srcdoc`.
