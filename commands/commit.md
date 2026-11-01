---
description: Verify and create one Conventional Commit for the current work unit
---

Create a commit for the current work unit. Context: $ARGUMENTS

1. Load the `verify-before-commit` skill.
2. Run the verify commands from AGENTS.md section 10. If any fails, stop and
   report the failure. Do not commit.
3. Confirm the diff is one work unit. If it mixes behaviors, propose the split
   and stop.
4. Confirm no secret, debug log, commented-out code, or `.only` is present.
5. Stage the relevant files and write a Conventional Commit message. The summary
   is imperative and under 72 characters; the body explains why, not what.

Never add AI attribution or co-author trailers.
