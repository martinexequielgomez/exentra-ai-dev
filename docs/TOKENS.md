# Token economy

Most agent cost comes from **output tokens** and from **re-sending history**.
This harness attacks both.

## Tiers

The harness targets **OpenCode Go** ($10/month). Every model in the plan has its own
monthly dollar allowance, so the tier you pick decides both the price and how much of
the plan you can spend on it.

| Tier | Model | ctx | $/Mtok in | $/Mtok out | Go allowance |
| --- | --- | --- | --- | --- | --- |
| T0 | `opencode/deepseek-v4.1-flash-free` | 200k | 0 | 0 | not counted |
| T1 | `opencode-go/glm-5.3-flash` | 1M | 0.15 | 0.50 | $60/mo |
| T2 | `opencode-go/kimi-k2.7-code` | 1M | 0.95 | 4.00 | $60/mo |
| T3 | `opencode-go/kimi-k3.1-pro` | 1M | 2 | 10 | $15/mo |

Alternatives inside the same plan, swap by editing `model:` in the agent file:

| Model | ctx | $/Mtok in | $/Mtok out | Go allowance |
| --- | --- | --- | --- | --- |
| `opencode-go/glm-5.3` | 1M | 1.40 | 4.40 | $15/mo |
| `opencode-go/qwen3.8-max` | 262k | 2 | 6 | $15/mo |
| `opencode-go/claude-haiku-5-5` | 1M | 0.10 | 0.50 | $15/mo |
| `opencode-go/gpt-6-luna` | 272k | 0.10 | 0.50 | $15/mo |
| `opencode-go/deepseek-v4.1-flash` | 1M | 0.30 | 1.20 | $100/mo, needs Global region |
| `opencode-go/kimi-k3` | 1M | 3.00 | 15.00 | $15/mo |

Prices come from models.dev and change. Allowances come from the Go plan page and can
change too. Check both before optimizing.

Each model also has window caps: 20% of the monthly allowance per 5 hours, 50% weekly,
100% monthly. Exceeding one blocks that model only, and the free models keep working.

## Assignment

| Work | Agent | Tier |
| --- | --- | --- |
| Conversation titles, summaries, compaction | hidden agents | T0 |
| Code mapping, file discovery | `exentra-scout` | T0 |
| Rename, format, boilerplate | `exentra-quick` | T1 |
| Lint, build, test runs | `exentra-verifier` | T1 |
| Implementation | `exentra-dev` | T2 |
| Design audit | `exentra-design` | T2 |
| Fixes from confirmed findings | `exentra-fixer` | T2 |
| Schema changes, backfills | `exentra-migrator` | T2 |
| Architecture | `exentra-plan` | T3 |
| Review, security | `exentra-reviewer`, `exentra-security` | T3 |

Rule: **T3 thinks, T2 writes, T1 types, T0 maps.**

## Levers

| Lever | Value | Effect |
| --- | --- | --- |
| `compaction.keep.tokens` | 12000 | Smaller verbatim tail after compaction |
| `compaction.buffer` | 15% | Headroom so compaction never overflows |
| `experimental.background_compaction` | true | Compaction does not block the turn |
| `tool_output.max_lines` | 800 | Stops 5000-line dumps |
| `tool_output.max_bytes` | 30000 | Same, by size |
| Hidden agents on T0 | — | Maintenance is free |
| Contexts per profile | 1-2 | Never load five stacks |
| Skills advertised by description | — | Body loads only on use |
| `steps` per subagent | 8-12 | Stops runaway loops |
| `experimental.subagent_depth` | 1 | No recursive delegation |

## What actually costs money

1. **Long tool output** pasted into context. Fix: summarize, cap, or delegate.
2. **Re-reading files** already read. Fix: keep a mental index; use CodeGraph.
3. **Full-file edits** when a targeted patch works. Fix: `edit`, not `write`.
4. **Loops**: the same fix attempted five times. Fix: escalate at attempt two.
5. **Wrong tier**: Opus writing boilerplate. Fix: `/fast` for mechanical work.

## Measuring

OpenCode reports session cost. Compare:

```powershell
opencode run --model opencode-go/kimi-k3.1-pro "explain the auth flow"
opencode run --model opencode-go/glm-5.3-flash "explain the auth flow"
```

Same prompt, same repository. If the cheap model answers well enough, the task
belongs to that tier. Promote only when quality actually drops.

## Anti-patterns

- Putting T3 on every agent "to be safe". You pay 28x for typing.
- Loading all contexts. Each one costs tokens on every request.
- Leaving skills auto-invoked when they are rarely relevant.
- Ignoring compaction and letting a 200k context fill up.
- Using `/deep` before reading the error message.
