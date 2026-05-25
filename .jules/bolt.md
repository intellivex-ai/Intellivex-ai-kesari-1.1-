## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - MarkdownTable custom comparator deep equality
**Learning:** In the custom comparison function passed to `React.memo` for `MarkdownTable` which receives an array of strings in its `lines` property, first checking for reference equality (`if (prev.lines === next.lines) return true;`) makes the deep equality loop slightly more efficient, providing a quick short circuit for unchanged values.
**Action:** Always include a reference equality short circuit before doing deep comparison in custom `memo()` comparator functions.
