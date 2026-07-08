## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - Optimizing Zustand useWorkspaceStore Selectors
**Learning:** Found that multiple components (`App`, `WorkspacePanel`, `CodeBlock`) were directly destructuring the entire `useWorkspaceStore` state. This is a common performance bottleneck in Zustand applications because it causes the component to re-render on *any* state update in the store, not just the properties being used.
**Action:** Applied `useShallow` from `zustand/react/shallow` when subscribing to multiple properties, and used raw selectors (`state => state.runCode`) when subscribing to a single property to strictly scope re-renders.
