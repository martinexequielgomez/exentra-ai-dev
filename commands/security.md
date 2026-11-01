---
description: Security review of a diff, file, or feature
agent: exentra-security
model: opencode-go/kimi-k3.1-pro
---

Security-review $ARGUMENTS. If no target was given, review the current uncommitted
diff plus any auth, tenant, or payment code it touches.

Load the `auth-security` skill. If the target involves multi-tenancy, billing, or
roles, load `saas-architecture` as well.

Return findings only, blockers first, each with file:line, the realistic attack
that exploits it, and the smallest fix. Close with the `npm audit` result, or say
explicitly that it could not run. Do not edit anything.
