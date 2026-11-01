---
description: Map the codebase before changing it
agent: exentra-scout
model: opencode/deepseek-v4.1-flash-free
---

Map this: $ARGUMENTS. If no scope was given, map the entry points, the routing
layer, the data access layer, and where auth is enforced.

Return the compact format from your agent definition: FILES, FLOW, RISKS, UNKNOWN.
Every claim carries `path:line`. Maximum 60 lines. Do not edit anything.
