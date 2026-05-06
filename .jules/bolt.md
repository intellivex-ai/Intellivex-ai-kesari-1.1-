## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2026-05-06 - Client-side IndexedDB Optimization
**Learning:** Sequential DB writes and tokenization in a long loop can severely block the main thread causing UI jank, and repeatedly opening IndexedDB connections adds massive unnecessary overhead.
**Action:** Always memoize IndexedDB connection promises (handling resets on failure) and use `Promise.all()` with periodic main-thread yielding (`await new Promise(r => setTimeout(r, 0))`) for large processing chunks.
