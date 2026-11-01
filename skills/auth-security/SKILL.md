---
name: auth-security
description: "Trigger: authentication, sessions, JWT, passwords, permissions, roles, secrets, or any security-sensitive change. OWASP checklist for web and SaaS."
license: MIT
metadata:
  author: exentra
  version: "1.0"
---

## Passwords

- `argon2id` with `memoryCost >= 19456` (19 MiB), `timeCost >= 2`, `parallelism = 1`.
- Never SHA-256, MD5, or bcrypt below cost 12.
- Compare with the library's verify function, never `===`.
- Reset tokens: 32 random bytes, hashed at rest, single use, 30-minute expiry.

## Sessions

- Cookie: `httpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, no `Domain` unless needed.
- Rotate the session id on login and on privilege change.
- Absolute expiry plus idle expiry.
- Logout invalidates server-side, not only the cookie.

## JWT

- Access token 10-15 minutes. Refresh token rotated on every use.
- Pin the algorithm. Reject `none` and unexpected `alg`.
- Verify `iss`, `aud`, `exp`, `nbf`.
- No secrets, roles that can change, or PII in claims.
- Store refresh tokens hashed, bound to a device or session record.

## Authorization

- Every server action re-checks: authenticated, role, tenant, resource ownership.
- Never trust a `tenant_id` from the request body.
- Deny by default. New routes start closed.
- Role checks live in one place, not scattered in handlers.

```ts
async function requireMember(tenantId: string, userId: string) {
  const row = await db.one(
    "select role from memberships where tenant_id = $1 and user_id = $2",
    [tenantId, userId],
  );
  if (!row) throw new Forbidden();
  return row.role;
}
```

## Input and output

- Validate with `zod`, `.strict()`.
- SQL parameterized, always.
- React escapes by default; sanitize before any raw HTML.
- No `eval`, no `new Function`, no dynamic import from user input.
- File uploads: check type, size, and store outside the web root.

## Transport and headers

- HTTPS only. HSTS in production.
- `Content-Security-Policy` without `unsafe-inline` where possible.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- CORS allowlist, never `*` with credentials.

## Rate limiting

- Auth endpoints: per IP and per account.
- Password reset: per account, with a constant-time response.
- Paid or expensive endpoints: per tenant.
- Return `429` with `Retry-After`.

## Secrets

- Environment variables only. `.env` is denied to tools by permission rules.
- Never log a token, cookie, password, or full auth payload.
- Rotate on exposure before investigating.
- CI uses secrets, never committed values.

## OWASP quick pass

1. Broken access control — tenant and role on every action.
2. Cryptographic failures — argon2id, TLS, no secrets in code.
3. Injection — parameterized SQL, schema validation.
4. Insecure design — deny by default, no client-trusted state.
5. Misconfiguration — no debug in prod, no default credentials.
6. Vulnerable components — audit gate, lockfile.
7. Auth failures — rotation, rate limit, generic errors.
8. Integrity failures — signed webhooks, verified updates.
9. Logging failures — correlation ids, no PII.
10. SSRF — allowlist outbound hosts.

## Checklist

- [ ] Every mutation authorizes tenant and role.
- [ ] No secret in code, tests, or logs.
- [ ] Rate limit on auth and paid endpoints.
- [ ] Errors do not reveal account existence.
- [ ] `npm audit --omit=dev --audit-level=high` passes.
