# UI QA

**Result: no open layout or keyboard-access blockers found.**

## Responsive checks

Checked English and Hindi at 375, 768, 1024, and 1440 CSS pixels.

| Width | Login and registration | Farms empty-state and authenticated navbar fixture | Horizontal overflow |
|---:|---|---|---|
| 375px | Checked | Checked; mobile tabs visible, each at least 48px tall | None |
| 768px | Checked | Checked; navbar wraps into two rows | None |
| 1024px | Checked | Checked; navbar stays on one row | None |
| 1440px | Checked | Checked; navbar stays on one row | None |

At 375px, all five bottom tabs measured at about 75×51px. At 768px, the expanded navbar uses separate primary and utility rows; from 1024px it fits on one row.

Login and registration were checked in the local app. The Farms view used the actual `AppNavbar`, `PageHeader`, and `EmptyState` components with a temporary in-memory farmer/cart context and zero farms; no real account or database data was used. The temporary fixture was removed after QA.

## Keyboard and accessibility checks

- Mobile navbar toggles with Enter; the language menu opens with Enter and changes the visible language.
- The mobile More menu opens with Enter and exposes Cart, Orders, Forum, Experts, Profile, language choices, and Sign out.
- The desktop My Farm dropdown opens with Arrow Down and closes with Escape. The avatar menu and Sign out action work by keyboard.
- The Farms empty-state Add farm button activates with Enter; the RTL page test confirms it targets `/farms/new`.
- Contrast ratios against white: eyebrow 8.94:1, body-muted text 6.16:1, primary green 6.15:1, link blue 4.50:1, and white text on success green 4.53:1. All meet WCAG AA for normal text.
- Lighthouse accessibility scores: Login 100, Farms fixture 100 (English), and Farms fixture 100 (Hindi); all exceed the 90-point target.

## Automated checks

- `npm test -- --run`: 8 test files, 12 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed. Vite reports the existing main JavaScript chunk is over 500 KB; this does not block the build.

During QA, the 768px navbar initially overflowed, and the mobile More tab did not receive its full touch width. Both CSS issues were corrected and the viewport matrix and Hindi Lighthouse audit were repeated successfully.
