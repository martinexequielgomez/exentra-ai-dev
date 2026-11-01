---
name: sql-query
description: "Trigger: writing queries, designing schemas, migrations, indexes, or debugging slow database access."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Non-negotiable

- Parameterized queries only. No string concatenation, no template literals with values.

```ts
// correct
db.query("select * from invoices where tenant_id = $1 and id = $2", [tenantId, id]);

// forbidden
db.query(`select * from invoices where tenant_id = '${tenantId}'`);
```

- `tenant_id` in every query that touches tenant data, taken from the session.
- No `select *` in application code. Name the columns.
- Every migration is reversible or explicitly documented as irreversible.

## Schema

- Primary keys are UUIDv7 or `bigint identity`. No sequential integers exposed publicly.
- `created_at` and `updated_at` are `timestamptz`, server default `now()`.
- Soft delete uses `deleted_at timestamptz null`; every query filters it.
- Money is `numeric(12,2)` or integer cents. Never `float`.
- Enums as `text` plus a `check` constraint, not native enums, so they can evolve.
- Foreign keys with explicit `on delete` behavior. No silent cascade.

## Indexes

- Index every foreign key.
- Composite index order: equality columns first, range last.
- Partial indexes for hot subsets: `where deleted_at is null`.
- Verify with `explain (analyze, buffers)` before and after. Report the plan change.

## Performance

- N+1 is a bug, not a style issue. Use a join or a batched `in (...)`.
- Paginate with keyset pagination (`where id > $cursor order by id limit $n`),
  not `offset`, for anything a user scrolls.
- Long transactions block. Keep them under a second where possible.
- Batch inserts in chunks of 500-1000.

## Transactions

- One transaction per business operation, not per query.
- Lock order is consistent to avoid deadlocks.
- Never call an external API inside a transaction.

## Migrations

- One change per migration.
- Backfill in a separate step from the schema change.
- Adding a `not null` column: add nullable, backfill, then constrain.
- Renaming: add new, dual-write, migrate, drop old.

## Checklist

- [ ] No interpolated values.
- [ ] Tenant filter present.
- [ ] Columns named explicitly.
- [ ] Index covers the filter and the sort.
- [ ] `explain analyze` reviewed for new hot queries.
