## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2026-11-04 - Optimizing Zustand selection in WorkspacePanel
**Learning:** Destructuring multiple properties from a Zustand store directly without `useShallow` causes unnecessary component re-renders when unrelated store state changes. This is critical for large, frequently updated stores.
**Action:** Bundle multiple state slice subscriptions efficiently using `useShallow` from `zustand/react/shallow`.
