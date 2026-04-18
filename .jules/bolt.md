## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## $(date +%Y-%m-%d) - React.memo Pitfalls with Array Props
**Learning:** Applying React.memo to a component (like MarkdownTable) that receives a freshly instantiated array prop on every render (e.g., from a parent's `.filter()` or inline array creation) is an anti-pattern. The shallow equality check will always fail, causing unnecessary overhead without preventing the re-render.
**Action:** When memoizing components, ensure the parent passes stable references (e.g., via useMemo or moving logic outside render) or implement a custom comparison function. Avoid adding memo to children if the parent component is already properly memoized and handles the child's prop stability naturally.
