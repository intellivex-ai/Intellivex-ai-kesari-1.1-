## 2023-10-27 - [IDOR in Serverless Vercel endpoints]
**Vulnerability:** IDOR vulnerability found in `api/memory.ts` where memory embeddings were stored without verifying that the client user actually owns the `chatId` they provided.
**Learning:** `SUPABASE_SERVICE_ROLE_KEY` is heavily utilized in Vercel API endpoints across the codebase to execute administrative DB calls. Because this key completely bypasses RLS, any endpoint exposing mutations based on client-provided IDs must explicitly implement manual resource ownership validation.
**Prevention:** Always verify resource ownership (e.g. `user_id === userId`) before performing CRUD operations in any endpoint initialized with a service role key. Ensure failure checks explicitly return 403 Forbidden without leaking data existence.
