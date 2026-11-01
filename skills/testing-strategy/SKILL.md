---
name: testing-strategy
description: "Trigger: writing tests, fixing a failing test, or deciding what to cover. Vitest, React Testing Library, Supertest, Playwright."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Pyramid

| Layer | Tool | What it proves |
| --- | --- | --- |
| Unit | Vitest | pure logic, edge cases |
| Component | Vitest + RTL | user-visible behavior |
| API | Vitest + Supertest | contract, status, validation |
| E2E | Playwright | one critical journey |

Most tests are unit and API. E2E is for the path that must never break.

## Rules

- Test behavior, not implementation. Query by role, label, or text.
- One assertion of intent per test. Name it after the rule, not the function.
- Every bug fix gets a test that fails before the fix.
- No snapshot tests for anything that changes often.
- No mocking the module under test. Mock the boundary: network, clock, database.
- Tests must pass in any order and in parallel.

## Naming

```
describe("invoice total", () => {
  it("applies the tenant tax rate", ...)
  it("rejects a negative quantity", ...)
})
```

## Component tests

```tsx
render(<InvoiceForm onSubmit={onSubmit} />);
await user.type(screen.getByLabelText("Amount"), "100");
await user.click(screen.getByRole("button", { name: "Save" }));
expect(onSubmit).toHaveBeenCalledWith({ amount: 100 });
```

- Never assert on class names or DOM structure.
- Test loading, error, and empty states explicitly.

## API tests

- Assert status, body shape, and the database effect.
- One test per error path: invalid body, missing auth, wrong tenant, conflict.
- Use a real database in a transaction that rolls back, or a disposable schema.

## What not to test

- Framework behavior.
- Getters and trivial mapping.
- Private helpers directly.
- Generated code.

## Coverage

- 80% on domain logic and API handlers.
- 100% on money, auth, and tenant isolation paths.
- Coverage is a smoke detector, not a goal.

## Checklist

- [ ] The failing case exists as a test before the fix.
- [ ] No test depends on execution order.
- [ ] No snapshot of a frequently changing component.
- [ ] Auth and tenant paths covered.
