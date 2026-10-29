## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Memoizing Zustand Selectors
**Learning:** Found that components like `WorkspacePanel`, `App`, and `CodeBlock` were directly destructing properties from `useWorkspaceStore()`, meaning they would re-render whenever *any* state in the store changed.
**Action:** Used `useShallow` from `zustand/react/shallow` to bundle multiple state slice subscriptions into a single shallowly compared object, or directly selected single atomic properties (e.g. `(s) => s.runCode`). This strictly prevents unnecessary component re-renders when unrelated parts of the global state change.
