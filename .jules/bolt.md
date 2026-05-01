## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-02-09 - Concurrent IndexedDB and CPU yielding
**Learning:** Found that `addMemory` in `src/lib/memory.ts` was waiting sequentially on DB I/O, which was slow. While switching to concurrent `Promise.all` processing, I learned that mapping CPU-intensive synchronous functions (like `tokenize` and `buildTFVector`) all at once could block the main thread and cause UI jank.
**Action:** Used an asynchronous `for` loop that uses `await new Promise(r => setTimeout(r, 0))` to yield to the main thread between processing chunks, accumulating promises to be awaited via `Promise.all` at the end. This prevents UI jank while still parallelizing the IndexedDB operations.
