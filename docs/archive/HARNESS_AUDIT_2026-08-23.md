# Harness audit — 2026-08-23 (baseline)

First run of the `harness-audit` skill, executed as part of the 0.16.0 build —
this run doubles as the release's live verification. No prior harness-audit
report exists; this is the baseline the next run diffs against. Subject: the
ai-dev-kit repo's own harness (consumer #1). Depth: full pass.

## Method & sources

Inventory from the working tree at 0.16.0; every `references/sources.md` row
re-verified today (fetched: authoring rubric, agentskills.io, hooks reference,
plugin-marketplace docs, anthropics/skills; search-confirmed: harness
changelog, AGENTS.md/AAIF, MCP servers repo). Ecosystem sweep ran as the
2026-08 research pass behind the modernization program (category queries:
authoring guidance · instruction standards · MCP landscape incl. game
engines · distribution · emerging workflow patterns), findings pinned into
`references/stack.md` with today's date. Mechanical layer: `skill-lint`
0 errors / 0 warnings; smoke-hooks 42; smoke-installer 53.

## Inventory (always-loaded vs on-demand)

- **Always-loaded:** 10 skill descriptions ≈ **897 tokens** (budget 900,
  lint-watched) + `AGENTS.md` (33 lines).
- **On-demand:** 10 SKILL.md bodies, every one under the 3,000-token split
  heuristic; 14 `references/` files loaded per-step; 5 advisory hooks
  (SessionStart·compact / PreToolUse / PostToolUse, exec-form, BOM-hardened);
  0 standing MCP servers; 0 custom subagents/commands; packaging =
  installer + adapter contract (plugin manifest pending, row 20).

## Scores

| Area | /100 | Named deductions |
| --- | --- | --- |
| Description quality & budget | 95 | −3 budget headroom under 1% (897/900 — next skill forces trims); −2 two descriptions lean on quoted trigger phrases over searchable key terms |
| Disclosure structure | 94 | −6 no per-skill utility scripts where determinism beats prose (harness-audit's inventory step is the clearest candidate) |
| Eval presence | 78 | −22 zero per-skill effectiveness evals — the authoring rubric asks ~3 scenarios per skill; smoke covers hooks/installer and lint covers structure, but no harness tests whether a skill *body* produces the intended behavior |
| Hook coverage & discipline | 97 | −3 Notification · SubagentStop · UserPromptSubmit lack recorded accept/reject verdicts (PreCompact, SessionStart variants, Stop now recorded) |
| Tool-server leanness | 100 | — (zero standing servers; per-domain recommendations documented, dated, in stack.md) |
| Permissions | 92 | −8 doctrine + starter shipped (docs/PERMISSIONS.md), but the kit's own machine-local allowlist carries accreted dead entries (incl. a reference to a nonexistent adapter) — machine-local, noted to memory, not a repo row |
| Instruction files | 98 | −2 root AGENTS.md thin/budgeted/stable-top; no leaf files needed at this tree size; CLAUDE.md absent by design (AGENTS.md is the cross-tool home) |
| Packaging currency | 85 | −15 the ecosystem's native distribution channel (plugin marketplace) is not yet shipped — row 20, next phase |

**Aggregate: 92.4/100** (unweighted mean; areas are incommensurable enough
that a weighted scheme would imply precision this baseline doesn't have).

## No change needed (decision log)

- **Zero standing MCP servers** — for this repo the context cost buys nothing
  the CLI doesn't already do; stack.md documents what consumers should weigh.
- **No custom subagent/command definitions** — harness built-ins cover the
  fan-out pattern (PLAYBOOK #6); a kit-shipped subagent would duplicate them.
- **No statusline** — cosmetic; no effectiveness or token impact.
- **No scheduler/calendar automation for periodic passes** — recorded in
  manifest.json; cadence belongs to program state, not a timer.
- **npm packaging** — stays demand-gated (B4-16); superseded on ship by
  row 20's marketplace packaging.

## Proposed rows

1. **Per-skill eval scenarios** (lifts Eval presence +15–20; effort M):
   a `.github/skill-evals/` harness — ~3 scenario fixtures per skill
   (input → expected-behavior rubric), runnable manually and summarized in
   CI docs; the authoring rubric's evaluation-driven-development step.
2. **harness-audit inventory script** (lifts Disclosure +4; effort S):
   a zero-dep script emitting the §1 surface table (desc chars/tokens, body
   tokens, references list, hook events) so runs start from measured data.
3. **Plugin-marketplace packaging** — already row 20 (Packaging +15).

Rows 1–2 proposed for the backlog at B2/B3; sign-off pending (this report
proposes, the gate decides).

## Verdict

The harness is current with the 2026-08 ecosystem on every axis except
distribution (in flight, row 20) and skill-body evals (the one genuinely
missing practice — proposed row 1). Sources fresh as of today; next run
diffs from this baseline.
