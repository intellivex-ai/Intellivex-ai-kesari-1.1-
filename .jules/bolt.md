## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-22 - Optimizing IndexedDB and Async Operations in Memory Store
**Learning:** Found that `openDB` was not caching the IndexedDB connection promise, causing repeated connection requests. Additionally, `addMemory` was running heavy CPU-bound tokenization operations without yielding to the main thread and performing sequential database writes/deletes.
**Action:** Applied promise caching to `openDB` to ensure the connection is created only once. Introduced a 0ms timeout yield (`await new Promise(r => setTimeout(r, 0))`) in the `addMemory` loop to prevent UI jank, and parallelized database operations using `Promise.all` for both writes and deletions.
