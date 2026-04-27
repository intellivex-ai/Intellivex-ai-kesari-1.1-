## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Memoization Broken by Inline Arrow Functions & Broad Prop Propagation
**Learning:** Even when `React.memo()` is applied to a component like `MessageRow`, if the component is passed an inline arrow function (`onReact={(r) => reactToMessage(msg.id, r)}`) or a prop that frequently changes across the entire list (like a global `streaming` boolean), the memoization is broken. This causes O(N) re-renders during token streaming, as every message component receives a new function reference or updated prop on every keystroke/token chunk.
**Action:** When memoizing list items in React, especially during active streaming:
1. Always pass stable function references directly (e.g., `onReact={reactToMessage}`) and handle local id closure inside the component itself.
2. Strictly scope volatile props (like `streaming` or `isLast`) so they only update for the affected list item (`streaming={i === messages.length - 1 ? streaming : false}`).
