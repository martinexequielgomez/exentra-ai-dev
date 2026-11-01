# Token economy

Most agent cost comes from **output tokens** and from **re-sending history**.
This harness attacks both.

## Tiers

| Tier | Model | ctx | $/Mtok in | $/Mtok out |
| --- | --- | --- | --- | --- |
| T0 | `opencode/deepseek-v4.1-flash-free` | 200k | 0 | 0 |
| T1 | `opencode/deepseek-v4.1-flash` | 1M | 0.30 | 1.20 |
| T1-alt | `opencode/glm-5.3-flash` | 1M | 0.15 | 0.50 |
| T2 | `opencode/claude-sonnet-5-5` | 1M | 2 | 10 |
| T2-alt | `opencode/qwen3.8-max` | 262k | 2 | 6 |
| T2-alt | `opencode/deepseek-v4-pro` | 1M | 1.74 | 3.48 |
| T3 | `opencode/claude-opus-5-5` | 1M | 4 | 20 |
| T4 | `opencode/claude-fable-5-1` | 1M | 10 | 50 |

Prices come from models.dev and change. Check them before optimizing.

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
opencode run --model opencode/claude-sonnet-5-5 "explain the auth flow"
opencode run --model opencode/deepseek-v4.1-flash "explain the auth flow"
```

Same prompt, same repository. If the cheap model answers well enough, the task
belongs to that tier. Promote only when quality actually drops.

## Anti-patterns

- Putting T3 on every agent "to be safe". You pay 28x for typing.
- Loading all contexts. Each one costs tokens on every request.
- Leaving skills auto-invoked when they are rarely relevant.
- Ignoring compaction and letting a 200k context fill up.
- Using `/deep` before reading the error message.
