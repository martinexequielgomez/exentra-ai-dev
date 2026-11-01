---
name: typescript-strict
description: "Trigger: writing or changing TypeScript, defining types, fixing type errors, or modeling API and database shapes."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Compiler settings

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true
  }
}
```

If a project cannot adopt all of these, adopt `strict` first and the rest per package.

## Modeling

- Model states as discriminated unions, not optional fields.

```ts
type Result<T> =
  | { status: "ok"; data: T }
  | { status: "error"; message: string };
```

- Prefer `unknown` at boundaries and narrow with `zod`. Never `any`.
- `type` for unions and aliases, `interface` for extendable object shapes.
- Brand primitives that must not be mixed:

```ts
type TenantId = string & { readonly __brand: "TenantId" };
```

- Return types on exported functions. Inference inside the body is fine.

## Boundaries

- Every external input (HTTP, env, DB row, webhook) is parsed, not cast.
- `as` is a last resort and always documented with the invariant it assumes.
- `satisfies` when you want checking without widening.
- API response types live next to the schema that validates them.

## Errors

- Throw `Error` subclasses with stable `code` fields, not strings.
- Never swallow: `catch {}` is forbidden.
- `never` exhaustiveness check in every switch over a union:

```ts
default: {
  const _exhaustive: never = value;
  return _exhaustive;
}
```

## Anti-patterns

- `any`, `@ts-ignore`, `@ts-expect-error` without a linked reason.
- Non-null assertion `!` on values that can be null at runtime.
- Enums for values that cross the API boundary. Use string unions.
- `Object` or `Function` as a type.
- Optional chaining used to hide a missing state instead of modeling it.

## Checklist

- [ ] No `any` introduced.
- [ ] Every boundary parsed with a schema.
- [ ] Unions handled exhaustively.
- [ ] Public functions have explicit return types.
