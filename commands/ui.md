---
description: Audit a screen against the design system
agent: exentra-design
model: opencode-go/kimi-k2.7-code
---

Audit this against the design system: $ARGUMENTS. If no target was given, audit
the screens changed in the current diff.

Load the `design-system` skill. Judge the rendered result when you can render it;
otherwise judge the markup and say so.

Return findings as `SEVERITY | file:line | violation | rule broken | concrete fix`.
Close with the single change that would improve the screen most. Do not rewrite
the components.
