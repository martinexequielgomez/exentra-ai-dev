## Stack: SaaS

Multi-tenant product with plans, roles, and billing.

- Shared schema with `tenant_id not null` on every tenant-owned table. Every
  unique constraint includes `tenant_id`.
- `tenant_id` comes from the session. A value from the request body is never
  trusted.
- Roles: `owner`, `admin`, `member`, `viewer`. Checked server-side on every
  action, in one module with one exported function per action.
- Limits are data in one table, enforced on the server at the moment of the
  action. Over-limit returns `402` naming the limit.
- Downgrades never delete data. They make it read-only.
- Billing: the provider owns subscription state. Webhooks verified by signature,
  processed idempotently by event id, amounts recomputed server-side.
- Failed payment sequence: grace period, restrict, suspend. Never delete.
- Audit log is append-only, written in the same transaction as the mutation:
  actor, tenant, action, target, before/after, ip, timestamp.
- Onboarding: sign up, verify email, create tenant as owner, invite members,
  seed sample data so the first screen is never empty.
- Feature flags never replace authorization. A disabled feature still checks
  permissions.

Verify:

```powershell
npm run lint
npm run build
npm test
npm audit --omit=dev --audit-level=high
```
