## Stack: Data

PostgreSQL, Drizzle or Prisma, versioned migrations.

- Parameterized queries only. `tenant_id` on every tenant-scoped query, taken
  from the session.
- Name columns explicitly. No `select *` in application code.
- Money is `numeric(12,2)` or integer cents. Never floating point.
- `created_at` and `updated_at` are `timestamptz` with a server default. Soft
  delete uses `deleted_at` and every query filters it.
- Index every foreign key. Composite index order: equality columns first, range
  last. Verify with `explain (analyze, buffers)`.
- N+1 is a defect. Use a join or a batched `in (...)`.
- Keyset pagination for anything a user scrolls, not `offset`.
- One transaction per business operation. No external HTTP call inside a
  transaction.
- Migrations: one change each, reversible or documented as irreversible. Adding
  a `not null` column means add nullable, backfill, then constrain.
- Seed data lives in a script, never in a migration.

Verify:

```powershell
npm run db:migrate
npm run lint
npm test
```
