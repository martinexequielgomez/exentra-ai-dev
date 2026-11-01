# Design

The goal is a product that looks designed by a person with taste, not generated.
The failure mode is the current AI aesthetic: purple gradients, glow, glass,
rounded everything, emoji icons, and centered hero sections with floating blobs.

## Hard prohibitions

| Never | Why |
| --- | --- |
| Neon colors, glow, `box-shadow` with colored light | Reads as a gaming product |
| Purple-to-blue gradients | The default AI template signature |
| Glassmorphism, backdrop blur as decoration | Trend from 2021, not a system |
| Emoji as UI icons | Inconsistent across platforms |
| Border radius above 12px on cards and inputs | Makes everything look like a pill |
| Shadows with blur above 24px | Muddy, heavy |
| More than one accent color | Destroys hierarchy |
| Centered everything | Kills reading rhythm |
| Lorem ipsum in a deliverable | Looks unfinished |
| Animation over 250ms, bounce, parallax | Distracting |

## Tokens

```css
/* Neutrals: warm or cool, never pure gray */
--bg:        #FAFAF9;
--surface:   #FFFFFF;
--border:    #E7E5E4;   /* ~8% contrast against bg */
--text:      #1C1917;
--text-muted:#78716C;

/* One accent, low saturation */
--accent:    #3F6E5A;
--accent-fg: #FFFFFF;

/* Feedback */
--danger:    #B4443C;
--warning:   #A9741F;
--success:   #3F6E5A;
```

Rules:

- Borders are **1px**, `--border` at 8-12% contrast. Never a border plus a shadow.
- Backgrounds use at most two levels: page and surface. No third card layer.
- Text hierarchy comes from size and weight, not from color alone.

## Typography

- Two weights: 400 and 600. Optionally 500 for UI labels.
- Scale ratio 1.25, starting at 14px for UI and 16px for body copy.
- Line height 1.5 for body, 1.25 for headings.
- Measure between 60 and 75 characters.
- One font family. A system stack is better than a random Google font.

```css
font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
```

## Spacing

- Base unit 4px. Use 4, 8, 12, 16, 24, 32, 48, 64.
- Section padding: 64-96px vertical on desktop, 32-48px on mobile.
- Space between related items: 8px. Between groups: 24px. Between sections: 64px.
- Prefer whitespace over dividers. A divider only when space cannot separate.

## Components

- **Buttons**: 36-40px height, 8px radius, one primary per view, no gradient.
- **Inputs**: 1px border, 8px radius, focus ring 2px at 30% accent opacity.
- **Cards**: 1px border, no shadow, 12px radius maximum.
- **Tables**: no zebra striping, 1px row separators, right-aligned numbers.
- **Empty states**: one sentence, one action. Never an illustration of a robot.
- **Loading**: skeleton with the real layout, not a centered spinner.

## Motion

```css
transition: opacity 160ms ease-out, transform 160ms ease-out;
```

- Only opacity and transform. Never animate layout properties.
- Respect `prefers-reduced-motion`.
- No entrance animation on every section. Motion is feedback, not decoration.

## Accessibility

- Contrast: 4.5:1 for body, 3:1 for large text and UI borders.
- Focus visible on every interactive element. Never `outline: none` alone.
- Hit targets at least 40x40px.
- Labels tied to inputs. Errors announced, not only colored.
- Keyboard order follows visual order.

## Review checklist

Before calling a screen done:

1. Does it survive a grayscale screenshot? Hierarchy must not depend on color.
2. Is there exactly one primary action?
3. Are all borders 1px and all radii under 12px?
4. Is any gradient, glow, or blur present? Remove it.
5. Is the content real, with real numbers and real empty states?
6. Does it look like a template? Change the layout, not the colors.
