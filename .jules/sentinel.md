## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.
## 2026-04-19 - Fix XSS in workspaceStore sandbox
**Vulnerability:** Code injection via iframe srcdoc script tag
**Learning:** Injecting string literal user code directly into script tags leaves it vulnerable to closing tag breakout
**Prevention:** Encode user code with encodeURIComponent and use eval(decodeURIComponent) inside the script tag
