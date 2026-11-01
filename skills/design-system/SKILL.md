---
name: design-system
description: "Trigger: any new screen, component, or redesign. Enforces a minimalist, professional visual system and blocks the generic AI aesthetic."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Non-negotiable prohibitions

- No neon, no glow, no colored shadow.
- No purple-blue gradients. No gradient text.
- No glassmorphism, no decorative blur.
- No emoji as icons.
- No radius above 12px on cards and inputs.
- No more than one accent color.
- No centered everything. No floating blobs behind a hero.
- No animation over 250ms, no bounce, no parallax.

## Tokens

```css
:root {
  --bg: #FAFAF9;
  --surface: #FFFFFF;
  --border: #E7E5E4;
  --text: #1C1917;
  --muted: #78716C;
  --accent: #3F6E5A;
  --danger: #B4443C;
  --warning: #A9741F;
  --radius: 8px;
  --radius-lg: 12px;
  --space: 4px;
}
```

- Borders: 1px, 8-12% contrast against the background.
- Never border plus shadow on the same element.
- Two background levels only: page and surface.

## Typography

- Two weights: 400 and 600.
- Scale 1.25, body 16px, UI 14px.
- Line height 1.5 body, 1.25 headings.
- Measure 60-75 characters.
- One family, system stack preferred.

## Spacing

4, 8, 12, 16, 24, 32, 48, 64.
Section padding 64-96px desktop, 32-48px mobile.
Space between groups 24px. Between sections 64px.
Prefer space over dividers.

## Components

- Button: 36-40px height, 8px radius, one primary per view.
- Input: 1px border, 8px radius, focus ring 2px at 30% accent.
- Card: 1px border, no shadow, max 12px radius.
- Table: 1px row separators, no zebra, numbers right-aligned.
- Empty state: one sentence, one action.
- Loading: skeleton matching the real layout.

## Motion

```css
transition: opacity 160ms ease-out, transform 160ms ease-out;
```

Opacity and transform only. Respect `prefers-reduced-motion`.

## Accessibility

- Contrast 4.5:1 body, 3:1 large text and borders.
- Focus visible always.
- Hit targets 40x40px.
- Labels bound, errors announced.
- Keyboard order matches visual order.

## Template smells

If you see any of these, the design failed:

- Hero with a gradient and two floating shapes.
- Three feature cards with identical icon-title-paragraph structure.
- Icon set mixing outline and filled.
- Everything 16px radius with a 40px soft shadow.
- Fake testimonials with gray circles as avatars.
- Copy like "Supercharge your workflow".

## Review

1. Grayscale test: hierarchy must survive without color.
2. One primary action per screen.
3. All borders 1px, all radii under 12px.
4. Zero gradients, glows, decorative blur.
5. Real content and real empty states.
6. It must not look like a template.
