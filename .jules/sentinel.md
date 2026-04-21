## 2026-04-15 - [Fix IDOR in api/generate-image.ts]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where any authenticated user could insert image messages into any other user's chat.
**Learning:** The application was missing explicit authorization checks (resource ownership verification) on the server side when performing operations via API endpoints that accept identifiers (like `chatId`) from the client.
**Prevention:** Always verify resource ownership (e.g., query the `chats` table to match the `user_id` with the authenticated `userId`) before allowing modifications or creations on that resource.

## 2024-04-21 - [Fix XSS / HTML Injection in iframe srcdoc Sandbox]
**Vulnerability:** The application was vulnerable to HTML injection/XSS because user-provided code was directly interpolated into a template string assigned to `iframe.srcdoc` inside a `<script>` block. This allowed an attacker to prematurely close the script tag (e.g., `</script>`) and execute arbitrary code in the iframe context.
**Learning:** Directly interpolating user-controlled strings into HTML context (even inside JS strings within HTML) exposes the app to script tag breakout vulnerabilities.
**Prevention:** When injecting user code into dynamically generated HTML (like `iframe.srcdoc`), URL-encode the string (e.g., `encodeURIComponent`) on the host side, and evaluate it dynamically inside the iframe (e.g., `eval(decodeURIComponent(encodedCode))`) to prevent premature script tag closing.
