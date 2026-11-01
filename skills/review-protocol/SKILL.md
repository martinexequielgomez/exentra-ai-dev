---
name: review-protocol
description: "Trigger: running a review, judging a change, or handling review findings. Severity model, evidence rules, and the fix loop."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Flow

```
target -> reviewer (read-only) -> confirmed findings -> fixer -> verify -> re-review
```

One review round, one fix round, one scoped re-check. No loop until clean.

## Target

Define the target before reviewing: a diff, a commit range, or a file list.
Reviewers never review the whole repository "just in case".

## Severity

| Level | Meaning | Action |
| --- | --- | --- |
| BLOCKER | data loss, auth bypass, broken contract, silently wrong result | must fix |
| HIGH | missing test on changed behavior, unhandled failure, scope creep | must fix |
| MEDIUM | weak validation, unclear error, duplicated logic | fix or record |
| LOW | style, naming, minor simplification | optional |

## Evidence rule

Every finding includes: `severity | file:line | problem | why it matters | fix`.
A finding without a line reference is an opinion and must be discarded.

## Causality

- A problem the change introduced is the change's responsibility.
- A problem that already existed is `LOW`, unless the change makes it reachable.
- If you cannot tell, say `unknown` instead of guessing.

## Refutation

Before fixing a BLOCKER or HIGH, confirm it reproduces:

1. Read the code path end to end.
2. Construct the input that triggers it.
3. If it cannot be triggered with realistic input, downgrade it.

Two reviewers agreeing is stronger evidence than one reviewer repeating itself.

## Fix loop

1. `exentra-fixer` applies only confirmed findings.
2. Run verify after each fix.
3. Re-review only the changed lines plus the finding.
4. After one correction round, anything still open is reported, not retried.

## What not to flag

- Style the formatter already handles.
- Pre-existing issues outside the change, unless they are BLOCKER.
- Preferences without a rule behind them.
- "Consider adding tests" when tests exist for the changed behavior.

## Report format

```
Target: <diff or range>
Blockers: N
High: N
Findings:
  BLOCKER | src/auth/session.ts:42 | session id not rotated on login | stolen cookie survives privilege change | call rotateSession() after verifyPassword
Verdict: BLOCKED | APPROVED WITH NOTES | APPROVED
```

The verdict is about the target, not about the author.
