---
name: js-modern
description: "Trigger: writing plain JavaScript, async logic, modules, or code that must run in both JavaScript and TypeScript projects."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Baseline

ES2022, ES modules, Node 20+, evergreen browsers. No transpiler-only syntax.

## Async

- `async/await` over chains. `Promise.all` for independent work, `allSettled`
  when one failure must not cancel the rest.
- Never `await` inside a loop when the iterations are independent.
- Every `await` is inside a `try` or the caller handles the rejection.
- Timeouts are explicit: `AbortSignal.timeout(ms)`.

```js
const results = await Promise.allSettled(tasks);
const failed = results.filter((r) => r.status === "rejected");
```

## Errors

- Throw `Error` with a message that names the operation and the input.
- Never `catch (e) {}`. Log or rethrow, never both silently.
- Custom error classes carry a `code` for the caller to branch on.

## Modules

- Named exports. Default exports only for framework entry points.
- No circular imports. If two modules need each other, extract the shared part.
- No side effects at import time.

## Data

- Immutability by default: `map`, `filter`, `reduce`, spread.
- `structuredClone` for deep copies. No JSON round-trip for cloning.
- Numbers: use `Intl.NumberFormat` for display, never manual rounding strings.
- Dates: `Temporal` when available, otherwise ISO strings plus `Intl.DateTimeFormat`.

## Functions

- Three parameters maximum; beyond that, take an object.
- Pure by default. Side effects at the edges, named explicitly.
- No classes unless there is real state and identity.

## Anti-patterns

- `var`.
- `==`.
- Mutable default parameters.
- `arguments`.
- Callback-style APIs in new code.
- `console.log` left in a deliverable.

## Checklist

- [ ] Every promise is awaited or returned.
- [ ] No empty catch.
- [ ] No import cycles.
- [ ] No debug logging left behind.
