## Stack: HTTP API

Node 20+, TypeScript, Fastify or Next.js Route Handlers.

- Every endpoint: validate with `zod` (`.strict()`), authorize, execute, map the
  result to one response envelope.
- One error envelope everywhere:
  `{ error: { code, message, request_id } }`. No stack traces, no SQL, no hints
  about whether an account exists.
- Status codes follow the `api-contract` skill. Never `200` with `success: false`.
- Every list endpoint paginates with a cursor. Every filter and sort field comes
  from an allowlist.
- Webhooks verify the signature before parsing the body, and are idempotent by
  event id.
- Rate limit auth, reset, and paid endpoints. Return `429` with `Retry-After`.
- Log one line per request with method, path, status, duration, and request id.
  Never log bodies on auth routes.
- OpenAPI is generated from the schemas, never handwritten twice.

Verify:

```powershell
npm run lint
npm run build
npm test
```
