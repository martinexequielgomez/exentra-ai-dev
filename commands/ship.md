---
description: Full gate before pushing - verify, review, security, commit, PR
---

Ship the current work. Context: $ARGUMENTS

Run the gate in order and stop at the first failure:

1. **Verify** — lint, typecheck, build, test from AGENTS.md section 10.
   Delegate to `exentra-verifier` if the output is noisy.
2. **Review** — delegate to `exentra-reviewer` over the current diff.
   A BLOCKER stops the gate.
3. **Security** — if the diff touches auth, permissions, payments, PII, tenant
   isolation, or dependencies, delegate to `exentra-security`. A BLOCKER stops
   the gate.
4. **Design** — if the diff touches UI, delegate to `exentra-design`. A BLOCKER
   stops the gate.
5. **Commit** — one Conventional Commit per work unit, no AI attribution.
6. **Push** — push the branch. Never force-push.
7. **Pull request** — open it with `gh pr create`. Body: what changed, why, how
   it was verified, what is out of scope, and the risk (data, auth, migration,
   breaking change).

Report each step as `step: pass|fail — one line`. Ask before pushing if the
branch is the default branch.
