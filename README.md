# exentra-ai-dev

An OpenCode V2 harness for building web products and SaaS: controlled development,
tiered models, mandatory review, security gates, and a design system that does not
look AI-generated.

Built for Windows. Also runs on macOS and Linux.

## What it gives you

- **11 agents** split by cost tier, so thinking is expensive and typing is cheap.
- **13 skills** that load only when their trigger matches.
- **10 commands** to escalate a single task without editing configuration.
- **Security in layers**: permission rules, a mandatory checklist, a dedicated
  read-only reviewer, and an audit gate before commit.
- **A design system** with hard prohibitions instead of vague taste.
- **Token economy** tuned for long sessions: free-tier maintenance agents,
  on-demand context, aggressive compaction.

## Quick start

```powershell
git clone https://github.com/<you>/exentra-ai-dev.git
cd exentra-ai-dev

# Check your machine
.\scripts\doctor.ps1

# Install into one project
.\scripts\install.ps1 -Target C:\path\to\project -Profile nextjs,saas

# Or install globally (backs up your current config first)
.\scripts\install.ps1 -Mode global
```

Then open the project with OpenCode and pick an agent with `/agents`.

## Model tiers

| Tier | Model | Cost in/out per Mtok | Used for |
| --- | --- | --- | --- |
| T0 free | `opencode/deepseek-v4.1-flash-free` | $0 / $0 | titles, summaries, compaction, mapping |
| T1 cheap | `opencode/deepseek-v4.1-flash` | $0.30 / $1.20 | mechanical edits, verification runs |
| T2 workhorse | `opencode/claude-sonnet-5-5` | $2 / $10 | daily implementation, design review |
| T3 deep | `opencode/claude-opus-5-5` | $4 / $20 | architecture, review, security |

Escalation is explicit: switch agent, or use `/fast` and `/deep`.
T3 is for thinking, not for writing.

## Agents

| Agent | Mode | Tier | Purpose |
| --- | --- | --- | --- |
| `exentra-dev` | primary | T2 | Default implementation agent |
| `exentra-plan` | primary | T3 | Architecture and plans, read-only |
| `exentra-quick` | primary | T1 | Mechanical changes |
| `exentra-scout` | subagent | T0 | Code mapping, read-only |
| `exentra-reviewer` | subagent | T3 | Severity-ordered findings |
| `exentra-security` | subagent | T3 | OWASP, authz, secrets, multi-tenant |
| `exentra-design` | subagent | T2 | UI audit against the design system |
| `exentra-fixer` | subagent | T2 | Applies confirmed findings only |
| `exentra-migrator` | subagent | T2 | Schema changes, backfills, rollback, local only |
| `exentra-verifier` | subagent | T1 | Runs lint/build/test, reports exact output |
| `exentra-docs` | subagent | T2 | README, ADRs, API docs |

Hidden maintenance agents (`title`, `summary`, `compaction`) run on the free tier.

## Commands

`/fast` · `/deep` · `/review` · `/security` · `/ui` · `/test` · `/commit` · `/ship` · `/map` · `/migrate`

## Skills

`react-feature` · `typescript-strict` · `js-modern` · `sql-query` · `db-migrations` ·
`api-contract` · `auth-security` · `saas-architecture` · `design-system` ·
`testing-strategy` · `windows-dev` · `verify-before-commit` · `review-protocol`

## Contexts

Loaded per project profile, never all at once:

`nextjs` · `web-spa` · `api` · `data` · `saas`

## Layout

```
agents/     agent definitions (markdown + frontmatter)
commands/   slash commands with pinned models
skills/     SKILL.md per skill, with references when useful
contexts/   stack snippets composed into the project AGENTS.md
scripts/    install, doctor, validate
docs/       SECURITY, DESIGN, TOKENS
```

## Requirements

- OpenCode V2
- Node.js 20+
- Git
- `gh` (only to publish the repository)
- Optional: Engram (memory), Context7 (docs), CodeGraph (code mapping)

## License

MIT
