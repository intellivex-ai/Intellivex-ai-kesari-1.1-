## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Zustand Destructuring Anti-pattern
**Learning:** Found that components like `WorkspacePanel`, `CodeBlock`, and `App` destructured `useWorkspaceStore()` without selectors or `useShallow`. In Zustand, a bare `useStore()` hook returns the entire state object and subscribes the component to *all* changes. This defeats `React.memo()` and causes full-app re-renders (in the case of `App.tsx`) when *any* property in the store changes (e.g., `sandboxOutputs`).
**Action:** Use specific selectors (e.g. `useWorkspaceStore(s => s.runCode)`) or `useShallow` for selecting multiple state properties to restrict component re-renders strictly to changes in the consumed slices of state.
