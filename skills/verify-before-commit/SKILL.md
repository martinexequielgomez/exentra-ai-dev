---
name: verify-before-commit
description: "Trigger: before committing, splitting work into commits, or opening a pull request. Keeps tests and docs with the code they belong to."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Gate

A commit is allowed only when all of these are true:

1. The project's verify commands pass: lint, typecheck, build, test.
2. The change is one work unit: one behavior, with its tests and docs.
3. No secret, debug log, commented-out code, or `.only` in tests.
4. The diff contains nothing unrelated to the stated intent.

If any is false, do not commit. Report what is missing.

## Work unit

A work unit is the smallest change that a reviewer can accept or reject on its own:

- One behavior, or one refactor, not both.
- Tests for that behavior in the same commit.
- Documentation updated when the behavior is user-facing.
- Roughly 400 changed lines maximum; beyond that, split by behavior.

## Message

Conventional Commits:

```
<type>(<scope>): <imperative summary>

<body: why, not what>

<footer: BREAKING CHANGE, refs>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.

- Summary under 72 characters, imperative, lowercase after the colon.
- The body explains the reason. The diff already shows the what.
- One logical change per commit. No "misc" commits.
- No AI attribution, no co-author trailers.

## Before pushing

- Rebase on the target branch, resolve conflicts, re-run verify.
- Confirm no `.env`, credential, or local path leaked into the diff.
- Confirm the CI configuration matches the commands you ran locally.

## Pull request

- Title mirrors the commit convention.
- Description: what changed, why, how it was verified, what is out of scope.
- Screenshots for UI changes, with before and after.
- Link the issue. State the risk: data, auth, migration, breaking change.

## Checklist

- [ ] Verify commands passed and were run after the last edit.
- [ ] One behavior per commit.
- [ ] Tests included.
- [ ] No secrets, logs, or `.only`.
- [ ] Conventional message, no AI attribution.
