## 2024-05-19 - Binding dynamic aria-label to title on stateful icon-only buttons
**Learning:** For accessibility, icon-only buttons with dynamic state (e.g. toggle Read aloud / Stop reading) must bind their `aria-label` exactly to the same dynamic conditions as their visible `title` attributes. Otherwise, screen readers fall out of sync with the visible state, conveying incorrect information.
**Action:** When adding or auditing icon-only buttons with toggled states, ensure both `title` and `aria-label` use the same condition (e.g., `aria-label={playingTTS ? "Stop reading" : "Read aloud"}`).

## 2024-05-19 - WCAG 2.5.3 (Label in Name) compliance
**Learning:** Adding an `aria-label` to a button that already contains visible text completely overrides the visible text for assistive technologies. If the visible text is not included in the accessible name, users relying on voice control software (who will say the visible text) will not be able to activate the button.
**Action:** Only add `aria-label` to strictly *icon-only* buttons. Do not add `aria-label` to buttons that already have descriptive visible text inside them.
