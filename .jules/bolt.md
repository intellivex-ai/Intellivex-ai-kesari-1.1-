## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-22 - Fix Zustand Destructuring Anti-Pattern for Performance
**Learning:** Destructuring from a Zustand store (e.g., `const { runCode } = useWorkspaceStore()`) without a selector subscribes the component to all store updates. This meant that components like `WorkspacePanel`, `ToolBlock`, and `CodeBlock` re-rendered unnecessarily anytime unrelated sandbox state (like output streams) updated, causing UI sluggishness, especially since `CodeBlock` and `ToolBlock` are heavily instantiated inside long chat streams.
**Action:** Always use specific state selectors (e.g., `const runCode = useWorkspaceStore(s => s.runCode)`) when memoizing components or accessing specific actions that consume Zustand.
