---
description: Review current changes for defects
agent: exentra-reviewer
model: opencode/claude-opus-5-5
---

Review $ARGUMENTS. If no target was given, review the current uncommitted diff.

Load the `review-protocol` skill. Return findings only, severity ordered, with
file:line evidence. Do not edit anything.
