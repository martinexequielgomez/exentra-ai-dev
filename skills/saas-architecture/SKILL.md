---
name: saas-architecture
description: "Trigger: multi-tenancy, plans and billing, feature limits, roles, audit logs, or onboarding flows for a SaaS product."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Tenancy

- One `tenants` table. Every tenant-owned table carries `tenant_id not null`.
- `tenant_id` comes from the session, never from the request.
- Every query filters by tenant. Every unique constraint includes `tenant_id`.
- A shared-schema model is the default. Separate databases only when a contract
  requires it; they multiply migrations and observability cost.
- Row Level Security if the database supports it, as a second line of defense.

## Roles

| Role | Typical powers |
| --- | --- |
| owner | billing, delete tenant, manage members |
| admin | manage members, all data |
| member | own data, read shared data |
| viewer | read only |

- Roles are checked server-side on every action.
- Permission checks live in one module with one exported function per action.
- Never check roles in the UI only.

## Plans and limits

- Limits are data, not conditionals scattered in code:

```ts
const LIMITS = {
  free: { seats: 1, projects: 3, storageGb: 1 },
  pro: { seats: 10, projects: 50, storageGb: 50 },
};
```

- Enforce limits on the server at the moment of the action.
- Over-limit responses are `402` with the limit that was hit.
- Downgrades never delete data; they make it read-only.

## Billing

- The provider is the source of truth for subscription state.
- Webhooks verified by signature, processed idempotently by event id.
- Amounts are recomputed on the server. Never trust a client price.
- Failed payments start a grace period, then restrict, then suspend. Never delete.
- Every billing event is written to an audit log.

## Audit log

- Append-only table: actor, tenant, action, target, before/after, ip, timestamp.
- Written in the same transaction as the mutation.
- Never editable from the application.

## Onboarding

1. Sign up, verify email.
2. Create tenant, become owner.
3. Invite members with scoped roles.
4. Seed sample data so the first screen is never empty.
5. Guided first action, dismissible, stored per user.

## Feature flags

- Flags are per tenant and per user, read from the database or a provider.
- A flag never replaces authorization. A disabled feature still checks permissions.

## Checklist

- [ ] Every tenant table has `tenant_id` and an index on it.
- [ ] Every query filters by tenant.
- [ ] Roles checked server-side in one module.
- [ ] Limits enforced on the server.
- [ ] Webhooks verified and idempotent.
- [ ] Audit log written with the mutation.
