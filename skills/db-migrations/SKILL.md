---
name: db-migrations
description: "Trigger: writing, reviewing, or running a database migration, backfill, schema change, or zero-downtime deploy."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

A migration is the only change that survives the code that made it and can destroy
data no review brings back. Treat every one as a production event.

## The one rule

**Every migration is written three times: forward, backfill, rollback.** A migration
without a rollback is a decision, not a file. If it cannot be reversed, say so and get
a human yes before it runs anywhere shared.

## Expand, contract

Never make a breaking schema change in one step. Two deploys minimum, three for a
rename:

| Phase | Schema | Code |
| --- | --- | --- |
| 1 expand | add new nullable column / table | write to both old and new |
| 2 migrate | backfill in batches | read new, fall back to old |
| 3 contract | drop old column / table | read and write new only |

A rename is phase 1 with the new name, phase 2 backfill, phase 3 drop. Skipping phase 2
means every reader between deploys sees nulls.

## Per class of change

**Add nullable column** — safe. Add the column, deploy, backfill if it needs a value.
No lock beyond the catalog update.

**Add `not null` column** — three steps: add nullable, backfill, then
`alter column ... set not null`. A `set not null` without a backfill fails or locks.

**Widen a type** (`varchar(50)` to `varchar(120)`, `int` to `bigint`) — usually safe,
sometimes a table rewrite. Check the engine's rules, do not assume.

**Narrow a type** — destructive. It can fail on existing rows and it loses data.
Validate first: `select count(*) from t where length(col) > 50`. Then expand, migrate,
contract.

**Rename a column** — never in place on a live table. Add new, dual-write, backfill,
drop old.

**Drop a column** — stop writing it, deploy, wait one full release, then drop. Dropping
while code still reads it is an outage with extra steps.

**Add an index** — `create index concurrently` on Postgres for anything large. Inside a
transaction it does not run concurrently; some tools wrap every migration in one. Check
the tool's behavior and use its escape hatch if it exists.

**Change a constraint** — add the new one as `not valid`, backfill, then validate. The
validate takes a lighter lock.

## Backfills

- Batched: 500-1000 rows per statement, with a `where` that excludes already-migrated
  rows so a re-run is a no-op.
- Idempotent: `update t set new = f(old) where new is null`.
- Resumable: no single transaction over the whole table.
- Observable: log rows affected per batch.
- Tenant-safe: `where tenant_id = $1` when the work is per tenant; never update across
  tenants in one statement without knowing why.
- Never in the same transaction as the schema change.

## Rollback

Write it when you write the migration, not when you need it.

- Forward adds a column → rollback drops it.
- Forward backfills → rollback does nothing, or restores the old value from a copy.
  Say which.
- Forward drops a column → rollback cannot restore the data. That is why the drop comes
  last, after a release where nothing reads it.

## Locking and size

Before writing, answer: how many rows, how big is the table, what lock does this take,
how long does it hold. If the answer is "I do not know", the migration is not ready.

- A lock on a large table blocks every write for its duration. A rewrite of a 50M-row
  table is minutes of downtime.
- Batch the work, or use the engine's online operation.
- Check with `explain (analyze, buffers)` before and after. Report the plan change.

## Multi-tenant

- Every tenant-owned table keeps `tenant_id not null`, and every unique constraint
  includes it.
- A migration that adds a table without `tenant_id` to a tenant-scoped schema is a
  defect, not a simplification.
- Backfills run per tenant when the row count is large, so one big tenant does not lock
  everyone out.

## Never

- `drop database`, `truncate` on a non-empty table, `delete` without `where`.
- Seed or demo data inside a migration. That is a script.
- Running a migration against a host that is not local without a human decision.
- Editing an already-applied migration. Add a new one.
- Assuming the ORM's generated SQL is safe. Read it.

## Checklist

- [ ] Forward, backfill and rollback all written.
- [ ] Destructive change has a recorded human decision.
- [ ] `not null` has a default or a prior backfill.
- [ ] Indexes created concurrently where the engine allows it.
- [ ] Backfill batched, idempotent, resumable.
- [ ] `tenant_id` present where the table is tenant-scoped.
- [ ] Applied and rolled back on a local database.
- [ ] Row count, table size, and lock behavior known and reported.
