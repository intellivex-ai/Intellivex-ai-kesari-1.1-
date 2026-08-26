## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - Optimizing Zustand destructuring in CodeBlock
**Learning:** Found that `CodeBlock` in `src/components/CodeBlock.tsx` was destructuring `useWorkspaceStore()` directly without `useShallow`, which causes unnecessary re-renders whenever any state in the workspace store changes (even ones unrelated to CodeBlock like `activeTab` or `sandboxOutputs`).
**Action:** Applied `useShallow` from `zustand/react/shallow` with a selector to only subscribe to `openWorkspace` and `runCode`, preventing cascading re-renders when the terminal output updates during code execution.
