---
description: Plan and write a safe data migration with rollback
agent: exentra-migrator
model: opencode-go/kimi-k2.7-code
---

Plan and write this migration: $ARGUMENTS

If no change was given, read the pending schema change in the current diff and treat
that as the request.

Load the `db-migrations` skill. Classify the change, then produce the forward
migration, the backfill and the rollback as separate ordered steps.

Run them against a local database only. Print the connection target first; if the host
is not localhost or a local container, stop and report what you would run.

Close with the report block from your agent definition. A destructive change without an
explicit human yes is reported as `DECISION`, never executed.
