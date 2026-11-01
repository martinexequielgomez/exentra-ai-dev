# Security

Security is enforced in five layers. None of them is optional, and none of them
depends on the model remembering to be careful.

## Layer 1 — Permission rules

`opencode.jsonc` denies reading or editing secrets before the model ever sees them:

- `*.env`, `*.env.*`, `*.ssh/*`, `*.pem`, `*.key`, `*.p12`, `*.aws/credentials`,
  `*.config/gh/hosts.y*ml`, `*.credentials/*`, `*.npmrc`, `*.git/*`.

Templates stay readable on purpose: `*.env.example`, `*.env.sample` and
`*.env.template` are allowed after the denies.

It also blocks destructive or remote-code-execution commands:

- `rm -rf`, `rm -fr`, `Remove-Item -Recurse -Force`, `rmdir /s /q`
- `git clean -f`, `git push --force`, `git push -f`
- anything piped into `iex` or `Invoke-Expression`

And it asks before publishing or destroying anything remote:

- `npm publish`, `gh repo delete`, `git reset --hard`, `curl -o`

### The `**/` trap

Resource patterns are matched with `*` meaning **any characters, path
separators included**. There is no path-segment globbing.

| Pattern | `.env` in root | `sub/.env` |
| --- | --- | --- |
| `*.env` | blocked | blocked |
| `**/.env` | **readable** | blocked |
| `**/*.env` | **readable** | blocked |

So `**/.env` looks like the careful version and is the dangerous one: it leaves
the file every project actually has readable. Always use the `*.env` form. This
was verified against OpenCode v2 by probing the read tool, and
`scripts/validate.mjs` now fails any read or edit rule whose resource contains
`**/`, plus it requires the core secret denies to exist.

### The `shell` vs `bash` trap

OpenCode v2 uses two different names for the same tool, and the wrong one fails
silently — the rule is ignored and the command runs.

| Where | Key | Correct action name |
| --- | --- | --- |
| Project config `permissions` ruleset | `{ action, resource, effect }` | `shell` |
| Agent frontmatter `permission` | tool name map | `bash` |

So `{ "action": "bash", ... }` in `opencode.jsonc` is inert, and `shell: deny`
in an agent file is inert. `scripts/validate.mjs` rejects both, and
`opencode debug agents` shows the rules OpenCode actually loaded — check it
after touching either file. Verified empirically on OpenCode v2: the same
`echo *` deny rule produced `RAN` under `action: "bash"` and `DENIED` under
`action: "shell"`.


## Layer 2 — AGENTS.md minimums

Always in context, so they survive compaction and model changes:

- Validate at the boundary with `zod`.
- Parameterized SQL only.
- Authorize tenant and role on every server action.
- Secrets from environment variables only.
- No `dangerouslySetInnerHTML` without a sanitizer, no `eval`.
- New dependency requires justification and the audit gate.
- Auth, payments, PII, and tenant isolation always go through `exentra-security`.

## Layer 3 — The `auth-security` skill

An executable checklist, loaded on demand. It covers:

- Password storage: argon2id, per-user salt, cost parameters.
- Sessions: httpOnly, Secure, SameSite=Lax, rotation on privilege change.
- JWT: short-lived access tokens, refresh rotation, no secrets in claims,
  `alg` pinned, `aud` and `iss` verified.
- CSRF: double-submit or SameSite, never state-changing GET.
- Rate limiting on auth, password reset, and any paid endpoint.
- Input validation with `zod` at every boundary.
- Output encoding: React escapes by default; never bypass without a sanitizer.
- Multi-tenant isolation: `tenant_id` in every query, enforced server-side,
  never taken from the client.
- Logging: no tokens, no cookies, no PII, no full request bodies on auth routes.
- Dependency and supply chain: lockfile committed, audit in CI.

## Layer 4 — `exentra-security` reviewer

A read-only subagent on the deep tier. It receives a diff or a scope and returns
findings ordered by severity:

```
BLOCKER  auth bypass, tenant leak, secret exposure, injection
HIGH     missing authorization, unsafe default, weak hashing
MEDIUM   missing rate limit, verbose error, weak validation
LOW      hardening opportunity
```

Every finding needs file, line, evidence, and a concrete fix. It never edits code.
`exentra-fixer` applies only findings confirmed by the reviewer or by the user.

## Layer 5 — Audit gate

Before any commit that touches dependencies or auth code:

```powershell
npm audit --omit=dev --audit-level=high
```

A failing audit blocks the commit. No exceptions, no `--force`.

## Threat model for SaaS

| Threat | Control |
| --- | --- |
| Cross-tenant data access | `tenant_id` from session, never from request body |
| Privilege escalation | Role checked server-side on every mutation |
| Session theft | httpOnly + Secure + rotation + short TTL |
| Credential stuffing | Rate limit + argon2id + generic error messages |
| Injection | Parameterized queries + `zod` validation |
| XSS | React escaping + sanitizer for any HTML |
| SSRF | Allowlist outbound URLs, never fetch user-provided hosts |
| Secret leakage | Permission denies + env vars + log redaction |
| Supply chain | Lockfile + audit gate + justified dependencies |
| Payment tampering | Webhooks verified by signature, amounts from the server |

## Incident checklist

1. Rotate the exposed credential first, investigate second.
2. Find the blast radius: which tables, which tenants, which endpoints.
3. Patch the root cause, not the symptom.
4. Add a regression test that reproduces the issue.
5. Record the decision with `mem_save` so it is never repeated.
