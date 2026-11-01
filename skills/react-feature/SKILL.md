---
name: react-feature
description: "Trigger: building or changing React components, hooks, forms, state, or data fetching. Applies component structure, shadcn/ui, TanStack Query, and form conventions."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## When to use

Any new component, hook, page, or form. Any change to how data reaches the UI.

## Structure

```
app/ or src/
  features/<feature>/
    components/     presentational, no data fetching
    hooks/          data and behavior
    api/            requests and schemas
    types.ts        domain types
  components/ui/    shared primitives (shadcn)
```

Rules:

- One component per file. File name matches the component.
- Container components fetch and decide; presentational components render props.
- No component over 150 lines. Split by responsibility, not by line count.
- Business logic never lives inside JSX.

## State

| Kind | Where |
| --- | --- |
| Server data | TanStack Query |
| Form state | `react-hook-form` + `zod` |
| URL state | search params |
| Local UI state | `useState` |
| Cross-page client state | Zustand, only when the above cannot work |

Never copy server data into local state. Derive it.

## Data fetching

```ts
const { data, isPending, error } = useQuery({
  queryKey: ["invoices", tenantId, filters],
  queryFn: () => fetchInvoices({ tenantId, filters }),
  staleTime: 30_000,
});
```

- Query keys are arrays, most general first.
- Mutations invalidate the exact keys they affect.
- Every query handles `isPending`, `error`, and empty data.
- No `useEffect` that fetches. That is what the query layer is for.

## Forms

- One `zod` schema per form, shared with the server when possible.
- `zodResolver` in `useForm`. No manual validation in `onSubmit`.
- Errors are shown next to the field, announced to screen readers.
- Submit button disabled while pending, never on invalid input alone.

## Accessibility

- Every input has a `<label>` bound by `htmlFor`.
- Interactive elements are `<button>`, not `<div onClick>`.
- Focus moves to the first error on submit failure.
- Loading and error states are announced with `aria-live`.

## Anti-patterns

- `useEffect` for derived state.
- Index as `key` in a reorderable list.
- Conditional hooks.
- Prop drilling more than three levels.
- `any` in props. Type the props.
- Inline styles for anything the design system already covers.

## Checklist

- [ ] No component over 150 lines.
- [ ] Loading, error, and empty states implemented.
- [ ] Query keys include the tenant.
- [ ] Form validation duplicated on the server.
- [ ] Keyboard navigation works end to end.
