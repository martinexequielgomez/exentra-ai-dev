---
description: Run the test suite and report exactly what failed
agent: exentra-verifier
model: opencode-go/glm-5.3-flash
---

Run the project's test command and report the result: $ARGUMENTS

If no filter was given, run the whole suite. For each failure report
`file:line — test name — first 15 lines of the error`. Do not edit code, tests,
or config. Do not guess at causes; report evidence and stop.
