## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2024-05-24 - Zustand Anti-Pattern Remediation
**Learning:** Using `useWorkspaceStore()` directly without an atomic selector in React components subverts memoization by registering a subscription to the *entire* state object, causing cascading re-renders across unaffected UI blocks whenever unrelated store data shifts.
**Action:** When extracting multiple state slices simultaneously from a Zustand store, enforce `useShallow` mapping (e.g. `useWorkspaceStore(useShallow(s => ({ a: s.a, b: s.b })))`). When fetching individual atomic values, raw selectors are sufficient without shallow verification. Always annotate performance adjustments for contextual durability.
