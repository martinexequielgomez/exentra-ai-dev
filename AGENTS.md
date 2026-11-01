# exentra-ai-dev

Controlled development environment for AI-assisted engineering: tiered models,
token economy, and hard limits on what an agent may touch.
Stack: React · JavaScript · TypeScript · SQL · HTTP APIs. Windows-first.

---

## 1. How to talk to me

- Mirror my language, register, and length. If I write in Spanish, answer in Spanish.
  If I switch, switch with me.
- Mirror my energy: direct when I am direct, short when I am short. No filler, no
  flattery, no "great question", no restating what I just said.
- Lead with the answer. Explanation comes after, and only if it changes a decision.
- One question at a time. If two answers are needed, ask the most blocking one and stop.
- If I am wrong, say why in one sentence with evidence, then give the fix.
- Never invent a fact about my code. Read it or say you have not read it.
- Code, identifiers, comments, UI copy, commit messages, and docs: **English always**,
  regardless of the language we speak in.

## 2. Non-negotiable

- Never claim something works without running the project's verify command.
- Never hardcode secrets, tokens, API keys, or connection strings.
- Never add AI attribution, co-author trailers, or "Generated with" lines to commits.
- Smallest change that solves the problem. No drive-by refactors, no renames nobody asked for.
- Never run a migration against a non-local database. Never drop or truncate data without
  an explicit human yes.
- If the change needs to touch files outside the stated scope, stop and ask first.
- When two attempts fail on the same problem, stop and escalate instead of looping.

## 3. Security

Full checklist: skill `auth-security`. Minimums that always apply:

- Validate every input at the boundary with `zod`. Never trust client data.
- Parameterized SQL only. Zero string interpolation in queries.
- Authorize on every server action: check the tenant **and** the role.
- Secrets come from environment variables. Never log tokens, cookies, or PII.
- No `dangerouslySetInnerHTML` without a sanitizer. No `eval`. No dynamic `require` of user input.
- Any new dependency needs a one-line justification. Run the audit gate before commit.
- Auth, payments, personal data, or tenant-isolation changes always pass through
  `exentra-security` before merge.

## 4. Design

Full rules: skill `design-system`. Minimums that always apply:

- Minimal, professional, calm. 1px borders, generous whitespace, short type scale.
- Forbidden: neon, glow, purple-blue "AI" gradients, glassmorphism, decorative blur,
  emoji in UI, oversized shadows, 24px radius on everything.
- Muted palette, low saturation, exactly one accent color. AA contrast minimum.
- Motion 150-200ms `ease-out`, opacity and transform only. No bounce, no parallax.
- Real content and real empty states. Never ship lorem ipsum.
- If a screen looks like a template, it is wrong.

## 5. Windows

- Shell is PowerShell 5.1+. No bash-isms: no `rm`, `cp`, `export`, `chmod`, `&&` chains in scripts.
- Paths: use `Join-Path`; quote paths containing spaces; forward slashes inside JSON.
- Never create symlinks. Use junctions: `New-Item -ItemType Junction`.
- Write UTF-8 without BOM. The repository uses LF through `.gitattributes`.
- Cross-platform env vars in npm scripts: `cross-env`.
- npm scripts must run on both Windows and Linux CI.

## 6. Workflow

1. **Understand** — read the smallest set of files that answers the question.
   Use CodeGraph for structure before grepping blindly.
2. **Plan** — three bullets maximum. Ask if a product decision is open.
3. **Implement** — one work unit at a time, tests next to the code they verify.
4. **Verify** — run the commands in section 10. No exceptions, no assumptions.
5. **Commit** — Conventional Commits, one work unit per commit.

## 7. Token discipline

- Never re-read a file already in context.
- Prefer `grep`, `glob`, and CodeGraph over reading whole files.
- Summarize tool output. Never paste more than 50 lines into the conversation.
- Load a skill only when its trigger matches the task.
- Delegate mapping to `exentra-scout` instead of exploring in the main thread.
- If a task is mechanical (rename, format, boilerplate), use `exentra-quick`.

## 8. Delegation

| Situation | Agent |
| --- | --- |
| Unfamiliar code, need a map | `exentra-scout` |
| Before merging non-trivial work | `exentra-reviewer` |
| Auth, payments, PII, multi-tenant | `exentra-security` |
| New screen or redesign | `exentra-design` |
| Noisy build/test output | `exentra-verifier` |
| Confirmed findings to apply | `exentra-fixer` |
| Schema change, backfill, migration | `exentra-migrator` |
| README, ADR, API docs | `exentra-docs` |

## 9. Memory

- Save decisions, bugs, and conventions with `mem_save` and a stable `topic_key`.
- Search memory before starting work that may have been done before.
- Close the session with `mem_session_summary`.

## 10. Project verify commands

<!-- exentra-ai-dev:verify:begin -->
- lint: `npm run lint`
- build: `npm run build`
- test: `npm test`
<!-- exentra-ai-dev:verify:end -->

The installer replaces this block with the real commands of each project.
