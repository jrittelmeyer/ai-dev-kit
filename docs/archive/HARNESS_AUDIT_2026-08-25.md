# Harness audit — 2026-08-25

Second run of the `harness-audit` skill; diffs from the
[2026-08-23 baseline](HARNESS_AUDIT_2026-08-23.md) (92.4/100 at 0.16.0).
Subject: the ai-dev-kit repo's own harness at **0.23.6**. Depth: **full pass**
(inventory script + all nine `sources.md` rows re-fetched + category sweep +
mechanical linter/eval runner + judgment diff). Run cadence note: only two
days after the baseline — this run is the post-implementation re-score after
the 0.17–0.23.6 program shipped the baseline's proposed rows.

## Method & sources

Inventory from `scripts/inventory.mjs` (shipped since baseline — the
baseline's own proposed row 2). Every `sources.md` row re-fetched today:

| Source | Fetched 2026-08-25 | Result |
| --- | --- | --- |
| Skill authoring best practices (platform.claude.com) | full | unchanged rubric: what+when third-person descriptions · <500-line bodies · one-level references · ≥3 evals · scripts solve-don't-defer · multi-model testing |
| agentskills.io | full | spec stable; client showcase now 45+ tools (Cursor, Copilot/VS Code, Gemini CLI, Codex, Goose, …) — format bet keeps compounding |
| claude-code CHANGELOG | raw fetch | head still **2.1.246** — no harness release since the 2026-08-25 backlog sweep; nothing new to diff |
| code.claude.com/docs/en/hooks | full | 31-event surface confirmed; matches `manifest.json` `reviewedAgainst` exactly; no new events since the 0.20.0 full-surface pass |
| agents.md / AAIF | search-confirmed | AGENTS.md under AAIF governance, 60k+ projects; 2026-08-17: A2A protocol joined AAIF; standard unchanged |
| plugin-marketplaces doc | full | source types current (archive v2.1.224+, command v2.1.229+, npm, git-subdir); org distribution + `strictKnownMarketplaces` trust controls; nothing the kit's relative-path marketplace violates |
| MCP server landscape | search-confirmed | **source moved**: the `modelcontextprotocol/servers` third-party list was retired 2026-04-14 — the authoritative landscape is now registry.modelcontextprotocol.io. `sources.md` row repaired this run |
| anthropics/skills | fetched (structure) | structure unchanged (skills/ + spec/ + template/ + .claude-plugin marketplace); no new authoring pattern to borrow |
| plugins-reference | full | plugin deps, `userConfig`, tag-based versioning (`claude plugin tag`) are new capability notes; **still no payload exclusion/ignore mechanism** — B4-31's advised-against verdict re-verified |

Category sweep (dated queries): authoring guidance · MCP registry · workflow
patterns (2026 harness-engineering literature confirms the kit's own doctrine
— guardrails in the runtime not the prompt, generation/evaluation separation,
state-triggered rather than every-turn gates). Mechanical layer:
`skill-lint` 0 errors / 0 warnings; `skill-evals` **10 skills · 30 scenarios ·
94 anchors · 0 errors**; smoke suites green per the 0.23.6 gate.

## Inventory delta (vs baseline)

- Always-loaded: 10 descriptions ≈ **897 tokens** (unchanged, budget 900) +
  `AGENTS.md` (43 lines; +10 vs baseline for the 0.23.x invariants).
- Hooks: **5 advisory + 3 opt-in enforcement** (was 5 advisory) — stop-gate ·
  checkpoint-autorun · banned-api-guard, each inert without adapter
  `enforcement` config; triple-wired (source, installer form, dogfood
  install) with smoke-enforced parity.
- Eval harness: `.github/skill-evals.mjs` + 30 scenario fixtures (was zero).
- Packaging: `.claude-plugin/plugin.json` + `marketplace.json` shipped, CI
  version-gated across six sites (was installer-only, row-20 pending).
- Tool servers / subagents / commands: still zero standing; `optional/contrarian`
  ships as copy-once template (correct: opt-in, not always-loaded).

## Scores

| Area | /100 | Δ | Named deductions |
| --- | --- | --- | --- |
| Description quality & budget | 95 | = | −3 budget headroom still under 1% (897/900 — the next skill or any description edit forces trims); −2 same two descriptions lean on quoted trigger phrases over searchable key terms |
| Disclosure structure | 98 | +4 | baseline's named deduction (no inventory script) shipped; −2 `project-adopt` body ≈2,726 tokens is the largest and nearing the split heuristic — watch, don't split yet |
| Eval presence | 94 | +16 | the baseline's −22 shipped: 30 scenarios, model-graded pass recorded ([SKILL_EVALS_2026-08-24](SKILL_EVALS_2026-08-24.md)); −4 graded on one model tier only (rubric asks for every model in the roster); −2 grading is point-in-time with no re-run trigger beyond skill edits |
| Hook coverage & discipline | 100 | +3 | baseline's three unrecorded events now carry dated verdicts; the decision log covers all **31** documented events; the Stop reversal (0.23.0) is evidence-based via retro, and the Stop-block path fired live in 0.23.6 (B3-41) |
| Tool-server leanness | 100 | = | zero standing servers; per-domain recommendations documented and dated in stack.md |
| Permissions | 92 | = | −8 machine-local allowlist still carries the accreted dead entries (one-off `/tmp` install commands, `rm -rf nwb-update civic-update`, a full literal commit-message string, and a reference to `adapters/civic-match.json`, which no longer exists). Machine-local — hygiene note to the user, not a repo row (same verdict as baseline) |
| Instruction files | 98 | = | −2 root AGENTS.md grew to 43 lines absorbing 0.23.x invariants — still budgeted and stable-top, but two entries (release-commit ritual, rename warning) are drifting toward PLAYBOOK-shaped prose; watch |
| Packaging currency | 95 | +10 | plugin + marketplace shipped and current with today's docs; −5 payload hygiene: `source: "./"` copies the whole repo into every consumer's plugin cache and the ecosystem still ships no exclusion mechanism (re-verified today) — tracked as B4-31, advised against at current scale |

**Aggregate: 96.5/100** (unweighted mean; was 92.4). The +4.1 is entirely the
baseline's own proposed rows landing: evals (+16), packaging (+10),
disclosure (+4), hook log (+3).

## No change needed (decision log)

- **Zero standing MCP servers** — re-affirmed; the MCP registry supersedes
  the servers repo as the landscape *source*, but changes nothing about what
  this repo should connect (nothing).
- **No custom subagents/commands** — re-affirmed; `optional/contrarian` stays
  copy-once opt-in, not default-shipped.
- **Plugin tag-based release channels** (`claude plugin tag`, new in the
  plugins reference) — not adopted: `plugin.json` pins `version` and CI gates
  the six version sites; a second release mechanism adds surface without a
  consumer asking for channels.
- **Plugin `dependencies` / `userConfig`** — not adopted: single-plugin
  marketplace, and the adapter contract is the kit's configuration surface;
  `userConfig` would split config across two mechanisms.
- **npm plugin source** — no change to B4-16's demand-gate; the marketplace
  route already covers distribution.
- **New hook events** — none exist since the 0.20.0 full-surface pass
  (changelog head unchanged at 2.1.246); all 31 verdicts stand.
- **Multi-model eval grading** — *proposed* below rather than rejected, but
  scoped: grade on the cheapest tier the kit's consumers actually run, not a
  full roster sweep per edit.

## Proposed rows

1. **B3 — Description headroom trim** (lifts Description +3; effort S):
   trim the two longest descriptions (`project-adopt` ≈101 tok,
   `harness-audit` ≈96 tok) to restore ≥5% headroom under the 900-token
   lint budget, so the next skill or edit doesn't force reactive cuts.
2. **B3 — Second-tier eval grading pass** (lifts Evals +4; effort S): run the
   existing 30-scenario graded pass once on a smaller model tier (the
   authoring rubric's "test with all models you plan to use"), record deltas
   in a dated archive report; fold any scenario that only passes on the large
   tier back into its skill body.
3. **Hygiene (no row — machine-local):** prune `.claude/settings.local.json`
   dead allowlist entries (the `/tmp` one-offs, the literal commit-message
   grant, the `civic-match.json` reference).

`sources.md` repaired this run (MCP landscape row → registry; all rows
re-stamped 2026-08-25). `stack.md` re-stamped where re-verified. Rows 1–2
await sign-off — this skill proposes, the gate decides.

## Verdict

The harness is **current with the 2026-08-25 ecosystem on every axis**. The
baseline's three gaps (evals, packaging, inventory determinism) all shipped
within the two-day window; what remains is small-grain: budget headroom, a
second-tier eval pass, and two watch items (project-adopt body size,
AGENTS.md growth). No new harness releases or hook events since the last
sweep; the one ecosystem shift found (MCP registry supersedes the servers
repo) is a source repair, not a kit change.
