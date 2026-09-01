# Harness audit — 2026-08-31

Third run of the `harness-audit` skill; diffs from the
[2026-08-25 run](HARNESS_AUDIT_2026-08-25.md) (96.5/100 at 0.23.6). Subject:
the ai-dev-kit repo's own harness at **0.23.15** (head `afb431e`). Depth:
**full pass** — inventory script + all `sources.md` rows re-fetched (11 rows,
two new since the last run) + dated category sweep + mechanical linter/eval
runner + a **sampled with/without graded eval pass** (the first delta-mode
grading since `--report --delta` shipped in 0.23.15) + judgment diff.
Network: available; report is not PARTIAL.

Delta bound (`git diff a3570ca..HEAD`, harness surface only): 21 files —
frontmatter modernization on seven skills (0.23.13), `stop-gate` →
`asyncRewake` (0.23.12), inventory script settings-awareness + adapter
`harnessAudit.kitSourcePath` (0.23.14), `skill-evals --delta` (0.23.15),
tag-currency CI step, AGENTS.md trim, description headroom trim (B3-42),
second-tier eval pass (B3-43).

## Method & sources

Every `sources.md` row fetched today:

| Source | Fetched 2026-08-31 | Result |
| --- | --- | --- |
| Skill authoring best practices (platform.claude.com) | full | rubric unchanged: what+when third-person descriptions · ≤1,024-char description · <500-line bodies · one-level references · ≥3 evals · scripts solve-don't-defer · test on every model tier |
| Claude Code skills reference (code.claude.com/docs/en/skills) — **new row** | full | ≈20 frontmatter fields; `description` + `when_to_use` truncated at **1,536 chars** in the listing; `disable-model-invocation: true` ⇒ description **not in context** (only user-invocable); `${CLAUDE_SKILL_DIR}` substituted in body and `allowed-tools`; `claude plugin validate <dir>` (v2.1.233+) validates SKILL.md frontmatter; `paths`, `disallowed-tools`, `shell`, `arguments`, `background` fields exist |
| agentskills.io evaluating-skills — **new row** | full | with/without loop is the reference method: `evals/evals.json` per skill, `with_skill/` vs `without_skill/` runs, `grading.json` per run, `benchmark.json` `delta` (pass-rate lift vs token/time cost); "remove assertions that pass in both configurations" |
| agentskills.io (overview + /specification) | full | portable frontmatter: `name` · `description` · `license` · `compatibility` · `metadata` · `allowed-tools`; ~50 clients in the showcase (was 45+) |
| claude-code CHANGELOG (raw) | full head → **2.1.252** | 2.1.251: `PreModelSwitch`/`PostModelSwitch` hook events; SessionStart resume hooks receive staleness + re-cache cost; project-level `settings.json` `env` can no longer set `CLAUDE_CONFIG_DIR`/`TMPDIR`; plugin command paths escaping the plugin dir rejected. 2.1.248: `--restricted` flag; agent frontmatter `experimental.cacheTtl`. No root-resolution entry (Watch item unchanged) |
| code.claude.com/docs/en/hooks | full | **33 events** (31 + the two model-switch events); `PreModelSwitch` is decision-only (`permissionDecision` allow/deny, exit 2 blocks), `PostModelSwitch` is display-only (`systemMessage`) — neither returns `additionalContext`, so the "11 of N can advise" count holds at **11 of 33**; command-hook default timeout now 600 s; `asyncRewake` documented as "runs in background and wakes Claude on exit code 2" (matches 0.23.12) |
| agents.md (AAIF) | full | unchanged: Linux Foundation AAIF stewardship, 60k+ projects, nearest-file-wins nesting; sweep confirms Claude Code reads AGENTS.md natively (spring 2026) |
| plugin-marketplaces | full | source types unchanged (archive v2.1.224+, command v2.1.229+); `metadata.pluginRoot` v2.1.239+; org distribution rejects top-level `bin/`; **still no payload exclusion mechanism** — "keep plugin directories lean" is the documented advice |
| registry.modelcontextprotocol.io | fetched (JS-rendered shell + API) + search-confirmed | still the authoritative landscape; no successor notice |
| anthropics/skills | structure | unchanged (skills/ + spec/ + template/ + .claude-plugin); `skill-creator` skill automates the eval loop above |
| plugins-reference | full | `workflows` component path, `experimental.monitors`/`themes`, `defaultEnabled`, synced plugins (v2.1.239+); version resolution order unchanged; **no `.claudeignore`** — full copy to cache |

Category sweep (dated queries, product names only in `stack.md`): authoring
guidance · harness changelog · cross-tool instruction files · tool servers
for a Node library project · plugin distribution · harness-engineering
patterns. Two sweep findings verified and pinned in `stack.md`: the
Playwright **CLI** route is ~4× more token-efficient than the MCP server for
agents with shell access (Playwright team's own benchmark, ≈27k vs ≈114k
tokens), and a class of Vite-hosted "dev-server MCP" servers (HMR + console
→ agent) exists as a verification surface — documented, not wired. The
harness-engineering literature (April–June 2026) again confirms the kit's
doctrine: guardrails in the runtime, evals as sensors, four-layer
permissioning.

Mechanical layer: `skill-lint` 0 errors / 0 warnings (855/900 always-loaded
tokens); `skill-evals` 10 skills · 30 scenarios · 94 anchors · 0 errors;
`install.mjs --check` green after this run's reference-file sync.

### Reference-file repairs (steps 2–3)

`sources.md` and `stack.md` under `skills/harness-audit/references/` were
found **already carrying today's-dated edits, uncommitted**, when this run
reached step 2 (the tree was clean at session start; the edits self-describe
as rows "restored 2026-08-31 — first added 2026-08-29, lost to a reinstall
before the kit mirror existed", i.e. the 0.23.14 `harnessAudit.kitSourcePath`
mirror path from a concurrent consumer-side run). This run re-fetched every
row independently, confirmed all eleven, added two precision notes (the
33/11 event count on the hooks row; the portable frontmatter set on the spec
row), and re-ran the self-install so `.claude/` matches source. All four
files are **uncommitted** for the sign-off commit. Not applicable: the
"not mirrored upstream" flag — this repo *is* the kit source.

## Sampled graded pass (delta mode)

Method per the evaluating-skills reference: three advisory-only scenarios,
each run twice on the **Sonnet** tier in a fresh read-only subagent — Run A
with the skill invoked/available, Run B forbidden from reading any skill,
PLAYBOOK, AGENTS.md, or manifest content. Graded against the fixtures'
`expect[]`/`reject[]` lines.

| Scenario | expect only-with-skill | present in both | reject fired in baseline only | tokens A / B |
| --- | --- | --- | --- | --- |
| checkpoint · three-strikes-handoff | 3/3 (unhealthy-regardless-of-window · handoff with diagnosis · retro suggestion) | 0 | 1 ("offers one more attempt" — baseline asked for the error to decide "whether attempt #4 is worth it") | 28k / 21k |
| dep-check · renovate-major-triage | 2/3 (release age at merge time · standing-hold check) | 1 (reads release notes — both runs did) | 0 | 33k / 25k |
| retro · record-rejections | 3/3 (explicit rejection recorded · one-off dropped · instruction file reserved) | 0 | 1 ("leaves rejected ideas unrecorded") | 42k / 21k |

**Delta: 8/9 expect behaviors present only with the skill; 2 reject
behaviors prevented; cost ≈ +55% tokens and 2–7× wall-clock per turn.** One
assertion (dep-check "reads release notes for breaking changes") passed in
both configurations — by the reference's own rule it is not evidence and
should be replaced when the full delta pass runs. The retro run also
surfaced a real harness observation: `skill-drift-guard` fires on
`PostToolUse`, i.e. *after* the wrong-directory edit lands; a `PreToolUse`
advisory on the same matcher would redirect before the edit is wasted
(candidate row below, not a scored deduction).

## Inventory delta (vs 2026-08-25)

- Always-loaded: 10 descriptions ≈ **855 tokens** (was 897; B3-42) —
  **but** seven skills now carry `disable-model-invocation: true`, and the
  skills reference confirms those descriptions are *not* in context on
  Claude Code. The harness-charged always-loaded cost is therefore the three
  auto-firing skills only (`doc-audit` 93 + `dep-check` 92 + `live-verify`
  72 ≈ **257 tokens**); 855 remains the portable worst case (the field is
  Claude-Code-specific, other clients load every description).
- Hooks: unchanged shape — 5 advisory + 3 opt-in enforcement; `stop-gate`
  now `asyncRewake`; quadruple-wired (plugin form, installer form, dogfood
  settings.json, dogfood hooks.json) with smoke-enforced parity.
- Hook surface: harness documents **33** events; kit pin (`EVENT_SURFACE`),
  manifest `reviewedAgainst`, README and deck all say **31** — B1-48 open.
- Eval harness: `--report --delta` shipped; no full delta pass recorded yet.
- Packaging: `plugin.json` 0.23.15 = manifest; `marketplace.json` entry
  description still reads "five advisory hooks (advise, never block)" — out
  of step with plugin.json's "plus three opt-in enforcement hooks".
- AGENTS.md 40 lines (was 43); no CLAUDE.md; no `.claude/rules/`; zero
  standing MCP servers, subagents, or commands; `optional/contrarian` still
  copy-once.

## Scores

| Area | /100 | Δ | Named deductions |
| --- | --- | --- | --- |
| Description quality & budget | 97 | +2 | B3-42 cleared the headroom deduction (855/900, 5%); −3 the budget model in `skill-lint`/`inventory.mjs` counts all ten descriptions as always-loaded, which the skills reference now says is wrong for the seven `disable-model-invocation` skills on Claude Code — report both figures (portable worst case · Claude Code charged) so the lean claim in README/deck is the true one |
| Disclosure structure | 98 | = | −2 `project-adopt` body ≈2,726 tokens, largest and nearing the split heuristic — watch, don't split (unchanged verdict) |
| Eval presence | 95 | +1 | B3-43 cleared the one-tier deduction (162/162 on Haiku); −3 no full with/without pass recorded — both prior graded passes measured compliance, not lift, and the sampled delta above shows at least one always-pass assertion the reference says to replace; −2 grading is point-in-time with no re-run trigger beyond skill edits (carried) |
| Hook coverage & discipline | 96 | −4 | −4 two documented events (`PreModelSwitch`, `PostModelSwitch`) have no verdict; pin/manifest/README/deck say 31 of 33. The tripwire fired exactly as designed (changelog re-fetch, doc-audit 2026-08-31, row B1-48) — the deduction is the open row, not a design gap. Verified input for the row: both events are non-advisory (decision-only / display-only), so under kit doctrine both are **reject** candidates and the 11-event `additionalContext` count is unchanged |
| Tool-server leanness | 100 | = | zero standing servers; `stack.md` now records the CLI-over-MCP preference for browser driving, consistent with the lean doctrine |
| Permissions | 92 | = | −8 machine-local `settings.local.json` still carries the dead entries (three `/tmp` install one-offs, `rm -rf nwb-update civic-update`, a literal commit-message grant, a `find` one-off, a reference to nonexistent `adapters/civic-match.json`) — **third consecutive run**; still machine-local, still a hygiene note to the user rather than a repo row. Repo-side: kit ships no permissions (PERMISSIONS.md doctrine), project `settings.json` sets no `env` (unaffected by 2.1.251's env restrictions) |
| Instruction files | 98 | = | −2 AGENTS.md's release-commit ritual and rename warning remain PLAYBOOK-shaped prose (carried; trimmed 43→40 lines since last run, so not growing) |
| Packaging currency | 93 | −2 | −5 payload hygiene: `source: "./"` copies the whole repo into every consumer's plugin cache; no exclusion mechanism as of today (B4-31, advised against — re-verified); −2 `marketplace.json` entry description is stale vs `plugin.json` (says five advisory hooks, never block — the enforcement trio shipped in 0.23.0) |

**Aggregate: 96.1/100** (unweighted mean; was 96.5). The −0.4 is the two
new harness events landing between runs (−4 on hooks) and the marketplace
description drift (−2), partly offset by the shipped B3-42/B3-43 rows
(+2, +1 net after the new eval deduction).

## No change needed (decision log)

- **Zero standing MCP servers** — re-affirmed; the sweep's lean-stack
  consensus ("six, not fifty") and the CLI-over-MCP browser finding both
  point the same way. Nothing to connect for a zero-dependency Node library.
- **No custom subagents/commands** — re-affirmed; commands are now merged
  into skills upstream, which makes the kit's skills-only shape the current
  one.
- **Evals stay in `.github/skill-evals/<skill>.json`, not per-skill
  `evals/evals.json`** — the spec's location would ship fixtures to every
  consumer via `install.mjs` and the plugin cache, and the kit's fixtures
  double as CI anchors. Keep the kit-wide location; adopt the reference's
  *loop* (with/without, delta, prune always-pass assertions), not its path.
- **New frontmatter fields** (`paths`, `disallowed-tools`, `shell`,
  `arguments`, `when_to_use`, `context: fork`) — not adopted: no kit skill is
  file-scoped, none runs autonomously enough to need tool denial, none uses
  inline `!` commands, and the 0.23.13 set (`disable-model-invocation`,
  `effort`, `allowed-tools`) already covers invocation control.
  `skill-lint`'s closed key set stays closed — it is the lint that catches a
  typo'd field, and the portable spec's `license`/`compatibility`/`metadata`
  add nothing the manifest doesn't already carry.
- **`claude plugin validate` as a gate step** — not adopted: it requires the
  Claude Code binary in CI; `skill-lint` already parses the frontmatter and
  gates the same failure class with zero dependencies.
- **Plugin `defaultEnabled`, `workflows`, `experimental.monitors/themes`,
  `dependencies`, `userConfig`, tag channels** — not adopted (same reasoning
  as 2026-08-25; nothing in the new fields applies to a single-plugin,
  adapter-configured kit).
- **`.claude/rules/` path-specific rules / `InstructionsLoaded` hook** — not
  adopted: AGENTS.md is 40 lines and every rule is repo-wide.
- **`--restricted` flag / `experimental.cacheTtl`** — harness features with
  no kit surface; noted for `stack.md` readers, no row.
- **`PreModelSwitch` / `PostModelSwitch`** — not a "no change" verdict: the
  verdicts are owed (B1-48). The recommendation above is reject/reject.

## Proposed rows

1. **B1-48 (existing) — extend**: alongside the 31→33 pin, the manifest
   verdicts, and the README/deck/manifest "31/11" refresh, fold in the
   `marketplace.json` description fix (lifts Packaging +2; effort trivial,
   same doc-refresh commit).
2. **B3 — Two-figure always-loaded budget** (lifts Description +3; effort
   S): `inventory.mjs` and `skill-lint` print *portable* (all descriptions)
   and *Claude Code charged* (auto-invocable descriptions only) totals; keep
   the 900-token lint budget on the portable figure; README/deck quote both.
3. **B3 — Full delta-mode eval pass** (lifts Evals +3; effort M): run all 30
   scenarios `--report --delta` on one tier, archive as
   `SKILL_EVALS_<date>.md` with the reference's `delta` shape (pass-rate lift
   · token cost), and replace every assertion that passes in both
   configurations — starting with dep-check's "reads release notes".
4. **B3 — `skill-drift-guard` PreToolUse twin** (lifts Hooks 0 — quality,
   not currency; effort S): surfaced by the graded pass. Add a `PreToolUse`
   `Edit|Write` advisory on the same `.claude/(skills|hooks)/` match so the
   redirect lands before the wasted edit; keep the PostToolUse handler for
   the Bash-path edits PreToolUse can't see. Record the verdict either way
   in `manifest.json → hooks.reviewed`.
5. **Hygiene (no row — machine-local, third reminder):** prune
   `.claude/settings.local.json` dead allowlist entries.

`sources.md` (11 rows, all stamped 2026-08-31) and `stack.md` (re-verified,
two dated additions) updated in kit source and mirrored into the dogfood
install this run; both uncommitted. Rows 1–4 await sign-off — this skill
proposes, the gate decides.

## Verdict

The harness is **current with the 2026-08-31 ecosystem on every axis but
one**, and that one (two new hook events, pin 31→33) is already rowed with
the tripwire having done its job. The 0.23.13 frontmatter modernization
landed a real benefit that the kit's own measurements don't yet show — the
Claude Code always-loaded cost is ≈257 tokens, not 855 — and the 0.23.15
delta flag got its first graded use here: on a three-scenario sample the
skills earn 8 of 9 expected behaviors outright and prevent two regressions,
at roughly 1.5× the tokens. The one ecosystem shift with kit consequences is
methodological (the with/without eval loop is now the documented standard),
not structural; nothing found here needs a restructure.
