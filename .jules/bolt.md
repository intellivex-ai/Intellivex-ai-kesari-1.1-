## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2024-05-11 - React.memo() invalidation due to inline functions
**Learning:** `MessageRow` in `src/App.tsx` uses `React.memo()`, but the memoization is broken because the `onReact` prop is passed as an inline arrow function: `onReact={(r) => reactToMessage(msg.id, r)}`. This causes `MessageRow` to re-render for every message when streaming token-by-token.
**Action:** Changed `MessageRow` to accept `reactToMessage` and `msg.id` separately, avoiding inline arrow functions so that the prop references remain stable and memoization works correctly.
