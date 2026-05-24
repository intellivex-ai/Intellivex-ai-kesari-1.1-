## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Memoizing Zustand store subscriptions
**Learning:** Found that destructuring a Zustand store without a selector defaults to subscribing to all store updates, thereby defeating `React.memo()` optimizations because any change in the store causes re-renders of the subscribing components.
**Action:** Applied `useShallow` from `zustand/react/shallow` to specify exact property selectors when destructuring from `useWorkspaceStore` in components like `App.tsx`, `CodeBlock.tsx`, and `WorkspacePanel.tsx`, ensuring that components only re-render when the specific properties they depend on change.
