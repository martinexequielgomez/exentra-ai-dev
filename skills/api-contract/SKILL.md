---
name: api-contract
description: "Trigger: designing or changing HTTP endpoints, request validation, error responses, pagination, or API documentation."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Shape

- Resources are nouns, plural: `/invoices`, `/tenants/:id/members`.
- Verbs live in the method, not the path.
- Actions that are not CRUD use a sub-resource: `/invoices/:id/void`.
- Version only when a breaking change ships: `/v2/...`.

## Status codes

| Code | Use |
| --- | --- |
| 200 | read or update succeeded |
| 201 | created, with `Location` |
| 204 | deleted, no body |
| 400 | malformed request |
| 401 | not authenticated |
| 403 | authenticated, not allowed |
| 404 | not found or not visible to this tenant |
| 409 | conflict, unique violation, stale version |
| 422 | valid shape, business rule rejected |
| 429 | rate limited, with `Retry-After` |
| 500 | unexpected, logged with a correlation id |

Never return 200 with `{ success: false }`.

## Validation

- Parse the body with `zod` before any logic.
- Reject unknown fields with `.strict()`.
- Validate query params and path params too.
- Return field-level errors:

```json
{ "error": { "code": "validation_failed",
  "fields": { "email": "invalid_email" }, "request_id": "..." } }
```

## Errors

One envelope, always the same keys:

```json
{ "error": { "code": "string", "message": "human readable", "request_id": "string" } }
```

- `code` is stable and machine-readable.
- `message` never leaks internals, SQL, stack traces, or whether an email exists.
- `request_id` ties the response to the log line.

## Pagination and filtering

- Cursor pagination by default:

```json
{ "data": [...], "next_cursor": "opaque-or-null" }
```

- Filters are explicit allowlists, never arbitrary column names from the client.
- Sorting by allowlisted fields only.

## Mutations

- `Idempotency-Key` on payment and creation endpoints.
- Optimistic concurrency with a version or `If-Match`.
- Webhooks verify the signature before parsing the body.
- Amounts and prices are always recomputed on the server.

## Documentation

- OpenAPI generated from the schemas, not handwritten twice.
- Every endpoint documents auth requirement, errors, and one example.

## Checklist

- [ ] Body, query, and params validated.
- [ ] Tenant and role checked server-side.
- [ ] Error envelope identical everywhere.
- [ ] No internal detail in messages.
- [ ] Pagination on every list endpoint.
