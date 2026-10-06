# Harness audit — 2026-10-05

Fourth run of the `harness-audit` skill; diffs from the
[2026-08-31 run](HARNESS_AUDIT_2026-08-31.md) (96.1/100 at 0.23.15). Subject:
the ai-dev-kit repo's own harness at **0.24.4** (head `624de53`). Depth:
**full pass** — inventory script (now with memory + eval-presence sections,
0.24.3) + every `sources.md` row re-fetched (11 rows → 14: three new) +
dated category sweep + mechanical linter/eval runner + a **sampled
with/without graded pass** on the three scenarios added since the last
graded pass + judgment diff. Network: available; report is not PARTIAL,
with one stated coverage gap (changelog mid-range, below).

Delta bound (`git diff afb431e..HEAD`, harness surface only): 66 files,
+2,966/−246 — release automation (0.23.17), Verification-paragraph tripwire
(0.23.18), `skill-drift-guard` PreToolUse twin (0.23.19), the three
2026-08-31 proposals shipped as B3-51/52/53 (two-figure budget, full delta
pass, PreToolUse twin), B1-48 (pin 31→33 + marketplace description),
inventory hook-source tagging and plugin-dir hooks (0.23.21/22),
`script-exec-guard` (0.24.0), bundle-secret sweep + cite-and-spot-check
(0.24.1), the `$env:` resolver fix (0.24.2), inventory memory/eval sections
(0.24.3), PowerShell matcher parity (0.24.4).

## Method & sources

Every `sources.md` row fetched today; three rows added, one repaired:

| Source | Fetched 2026-10-05 | Result |
| --- | --- | --- |
| Skill authoring best practices (platform.claude.com) | full | rubric unchanged |
| Claude Code skills reference | full | `hooks` frontmatter field (skill-scoped hooks, `once`); parent-directory discovery up to the repo root; worktree fallback v2.1.277+; `/skill-doctor` v2.1.252+ (per-skill context cost + invocation count); `/reload-skills`; `claude plugin validate` v2.1.233+ |
| agentskills.io evaluating-skills | full | unchanged; `skill-creator` plugin automates the loop |
| **plugin-evals (new row)** | full | `claude plugin eval` v2.1.269+: native with/without arms, six grader types, `--threshold`, CI-gateable; real model calls; a *different* case format from skill-creator's and neither reads the other's |
| agentskills.io spec | full | unchanged; `skills-ref validate` |
| claude-code CHANGELOG (raw) | head **2.1.289** (2026-10-03) | **Coverage gap:** the fetcher returns only the newest ≈7 entries, so 2.1.283–2.1.289 came from the raw file, 2.1.277 from its GitHub release page, and 2.1.253–2.1.282 only from "Requires v2.1.NNN" notes on the doc pages. Recorded on the row as the procedure for the next run. Items: 2.1.287 **Claude Mods** + asyncRewake missing-script loop fix + PreToolUse hooks no longer skipped on match/serialization failure (the call is blocked instead); 2.1.286 commit guidance now tells Claude to run a project `verify` recipe when one exists; 2.1.284 marketplace plugins' `allowed-tools` pre-approval limited to official/vouched sources under managed rules; 2.1.283 `/doctor prompt-audit`; 2.1.282 `once` hook field; 2.1.277 **AGENTS.md read natively** when no CLAUDE.md; 2.1.288 the harness's own dangerous-`rm` safeguard was being lost when the command also redirected output (fixed) |
| code.claude.com/docs/en/hooks | full, three targeted re-fetches | **33 events confirmed** (SessionEnd included). **`PostModelSwitch` now accepts `hookSpecificOutput.additionalContext`** ("Context only" row alongside SessionStart/SubagentStart) — it was display-only at the 2026-08-31 review, so the advisory-capable count is **12 of 33**, not 11. New command-hook fields `once` and `shell`; new common inputs `scratchpad_dir` (v2.1.257+) and `effort`; `if` still single-rule; `${CLAUDE_PROJECT_DIR}` definition unchanged |
| agents.md (AAIF) | full | unchanged |
| **code.claude.com/docs/en/memory (new row)** | full | AGENTS.md precedence table (`claude-md-or-agents-md` default; a `CLAUDE.local.md` in or above cwd silently suppresses AGENTS.md; `~/.claude/CLAUDE.md` and `.claude/rules/` don't); MEMORY.md load cap = first 200 lines / 25 KB — the figure `inventory.mjs` measures against now has a cited source |
| plugin-marketplaces | full | URL resolves; page split into create-marketplace / marketplace-reference / host-marketplace / publish — row updated to name all four; `/plugin install --marketplace` one-step v2.1.275+ |
| registry.modelcontextprotocol.io | fetched | still authoritative, no successor notice |
| anthropics/skills | structure | unchanged |
| plugins-reference + plugins/loading | full | `experimental.evals`, directory-listing fields, `validate --strict`; **still no payload exclusion** — the only filter is positional; local-path marketplace plugins load in place, all others are copied whole into the cache |
| **plugins/mods/reference (new row)** | full | Mods: in-process JS/TS `register(on, …)` modules in a plugin; `tool.call` deny/answer, `tool.check` decision override, prompt and skill-text rewriting, UI; settings hooks exposed as `classic.<Event>`; managed guards `allowManagedModsOnly` / `allowModsToOverrideDenyRules` |

Category sweep (dated queries; product names only in `stack.md`): authoring
guidance · harness changelog · cross-tool instruction files · tool servers
for a Node library · plugin distribution/payload · harness-engineering
patterns. Verified and pinned in `stack.md`: a new **Harness-native tooling**
section (`/skill-doctor`, `/doctor prompt-audit`, `claude plugin eval`,
`validate --strict`, Mods — each with an adopt/document verdict), a
**Distribution channels** section (Anthropic's directory as a third channel;
payload hygiene re-verified with the community's restructure workaround), the
lean-MCP consensus (3–6 servers, ~2–5k tokens each; kit default stays zero),
and the 2026-09-24 state-of-harness-engineering study (246 repos: 63% ship an
instruction file, median root file 123 lines, only 22 declare a PreToolUse
hook, 60% have no harness tests or evals) whose five practices the kit already
matches on four.

Mechanical layer: `skill-lint` 0/0 (855 portable / 257 Claude-Code-charged
tokens); `skill-evals` 10 skills · 33 scenarios · 98 anchors · 0 errors;
`smoke-hooks` 215 asserts; `smoke-installer`, `smoke-inventory`,
`check-version` green; `install.mjs --check` 40/40 after this run's
reference-file sync.

### Reference-file repairs (steps 2–3)

`sources.md` (14 rows, all stamped 2026-10-05) and `stack.md` (Contents
heading added — it crossed the 100-line rule this run) rewritten in kit
source and mirrored by the self-install; **uncommitted** for the sign-off
commit. Two self-inflicted gate failures were caught and fixed before
writing this report: the lint rejected a hook-placeholder literal in skill
prose, and the dogfood stop-gate (which runs `skill-lint`) went red on it —
useful evidence that the enforcement chain works end to end. Not applicable:
the "not mirrored upstream" flag — this repo *is* the kit source.

## Sampled graded pass (delta mode)

Method per the evaluating-skills reference and the 2026-09-02 full pass:
the three `expect[]`/`reject[]` scenarios added in 0.24.1 (never graded),
each in a fresh read-only Sonnet subagent producing Run A (skill loaded)
and Run B (no skill, no kit content) and grading both.

| Scenario | expect only-with-skill | present in both | reject fired in baseline only | tokens |
| --- | --- | --- | --- | --- |
| live-verify · web-prod-bundle-secrets | 2/2 (sweeps `.next/static` for server-only names and key shapes · rotates at the provider before touching code) | 0 | 1 (baseline patched the import, rebuilt, and called the live key "fixed") | 40k |
| project-adopt · deep-survey-evidence | 1/1 (opens one cited file:line per subagent before a parity-contract row) | 0 | 1 (baseline compiled subagent summaries straight into the contract) | 40k |
| project-init · deep-research-evidence | 1/1 (opens one source per subagent; re-runs an uncited one) | 0 | 1 (baseline wrote "1M+ installs" into the brief unverified) | 39k |

**Delta: 4/4 expect behaviors skill-earned, 3/3 reject regressions
prevented, 0 free.** The 0.24.1 anchors were written after the 2026-09-02
"replace free assertions" pass and show it: every line discriminates. Two
harness observations surfaced incidentally this run (not from the graded
pass): see Hooks below.

## Inventory delta (vs 2026-08-31)

- Skills: 10, unchanged set; portable budget ≈855 tokens, Claude Code
  charged ≈257 — now reported as two figures by both `skill-lint` and
  `inventory.mjs` (B3-51 shipped) and quoted as such in README.
  `project-adopt` body ≈2,784 tokens (was 2,726), still the largest.
- Hooks: **10 loaded** (was 8) — `skill-drift-guard-preedit` (PreToolUse
  Edit|Write) and `script-exec-guard` (PreToolUse Bash|PowerShell, the kit's
  first escalation-class handler: `permissionDecision: "ask"`, inert without
  `enforcement.scriptExecGuard`). Matchers now `Bash|PowerShell` on all four
  command-shaped handlers; `live-verify-reminder` wired twice because `if`
  is single-tool. 33 reference rows across the installer/plugin manifests,
  10 unique, all matching loaded rows (no drift). Pin `EVENT_SURFACE` = 33;
  manifest verdicts for all 33.
- Instruction file: AGENTS.md **45 lines ≈688 tokens** (was 40) — the
  "one release commit per push" rule (0.23.17) added five. No CLAUDE.md, so
  the v2.1.277 native path applies; no `.claude/rules/`.
- Memory: MEMORY.md 7 lines ≈156 tokens (budget 700, cap 200 lines/25 KB);
  one topic file over budget (`resume-prompt.md` ≈1,593 vs 1,500).
- Tool servers / subagents / commands: none, unchanged. Permissions: repo
  ships none; `settings.local.json` unchanged since 2026-08-23.
- Packaging: `plugin.json` 0.24.4 = manifest; marketplace description now
  matches ("six advisory hooks plus four opt-in enforcement hooks").

## Scores

| Area | /100 | Δ | Named deductions |
| --- | --- | --- | --- |
| Description quality & budget | 100 | +3 | B3-51 cleared the two-figure deduction; descriptions unchanged and within rubric; no deduction |
| Disclosure structure | 98 | = | −2 `project-adopt` body ≈2,784 tokens, still growing slowly toward the split heuristic — watch, don't split (carried) |
| Eval presence | 96 | +1 | B3-52 cleared the no-full-delta-pass deduction (70/94 earned, 23 free assertions replaced in place); today's sample on the newest anchors is 4/4 + 3/3. −2 grading remains point-in-time with no re-run trigger beyond skill edits (carried); −2 the harness now ships a native CI-gateable eval runner and the kit's fixtures are in a format it cannot read — logged as a deliberate verdict below, but the gap between "anchors resolve" and "behavior scored in CI" is real |
| Hook coverage & discipline | 94 | −2 | −3 **`PostModelSwitch` verdict rests on a false premise**: manifest says "display-only notification … no context channel back to the agent" and `reviewedAgainst`/README say "only 11 … the other 22"; the hooks reference now lists it as context-capable (12 of 33). The rejection likely stands on new grounds (nothing in the kit is model-switch-shaped) but must be re-recorded. −3 **`skill-drift-guard` false positive, reproduced live twice this run**: `node .claude/skills/harness-audit/scripts/inventory.mjs . 2>&1 | head` fires the guard because the write-intent regex matches the `>` in `2>&1`; the same holds for `2>/dev/null` and any `cp`/`mv` token elsewhere in a command that merely *reads* a guarded path. The guard's own doc comment promises reads are not drift. Hand-run confirmed: with the redirect the handler emits the nudge, without it it is silent. New fields (`once`, `shell`, `scratchpad_dir`, `effort`) have no kit use — no deduction |
| Tool-server leanness | 100 | = | zero standing servers; sweep consensus re-affirms |
| Permissions | 92 | = | −8 `settings.local.json` dead entries — **fourth consecutive run** (three `/tmp` install one-offs, `rm -rf nwb-update civic-update`, a literal commit-message grant, a `find` one-off, `adapters/civic-match.json` which doesn't exist); machine-local, hygiene note not row. Repo-side: nothing changed; 2.1.284's managed-rules limit on marketplace `allowed-tools` only affects `harness-audit`'s script pre-approval under an org policy, where it degrades to a prompt |
| Instruction files | 97 | −1 | −2 release ritual + rename warning remain PLAYBOOK-shaped prose (carried) and the file grew 40→45 lines; −1 the v2.1.277 precedence rule has a silent failure mode this repo relies on — a contributor's `CLAUDE.local.md` stops AGENTS.md loading entirely — and nothing in CONTRIBUTING says so |
| Packaging currency | 94 | +1 | B1-48 cleared the marketplace-description deduction (+2). −5 payload: `source: "./"` ships the whole repo; re-verified no exclusion mechanism exists (carried, B4-31 advised against). −1 `claude plugin validate --strict` has never been run against the kit although the binary is on this machine; the 2026-08-31 verdict (not a CI gate) stands, but one manual run per `plugin.json`-touching release is free |

**Aggregate: 96.4/100** (unweighted mean; was 96.1). +0.3 net: the three
shipped 2026-08-31 proposals and B1-48 add +7 across four areas; the two
new hook findings (−6) and the AGENTS.md/validate notes (−2) take most of
it back.

## No change needed (decision log)

- **Zero standing MCP servers** — re-affirmed; the lean consensus is now
  numeric (3–6 servers, 2–5k tokens each) and the "starter set" is files +
  git + docs, two of which Claude Code already provides natively.
- **No custom subagents/commands** — re-affirmed; the manifest reference now
  says "prefer `skills/` for new plugins" over `commands/`.
- **Evals stay in `.github/skill-evals/<skill>.json`** — re-affirmed against
  *two* native formats now (skill-creator's `evals/evals.json` and
  `claude plugin eval`'s `evals/<case>/`): the kit's anchors are zero-cost CI
  checks that also drive `--report --delta`; either native suite would ship
  to every consumer via the plugin cache and bill real model calls per CI
  run. Re-evaluate on a consumer's request for a CI-gated behavioral score.
- **`claude plugin validate` as a CI gate step** — re-affirmed not adopted
  (binary dependency); see Packaging for the one manual run.
- **Claude Mods** — not adopted. In-process code with fs/network/model
  reach, governed by managed guards the kit cannot assume, versus the kit's
  one-screen, zero-dep, advise-by-default handlers. The only kit need a mod
  could serve better than a PreToolUse `permissionDecision` would be a
  *decision* on a non-tool event; none exists.
- **Skill-frontmatter `hooks` / `once`** — not adopted: every kit hook is a
  session-wide invariant, not a skill-scoped one; `once` is honored only in
  skill frontmatter.
- **`shell: "powershell"` on command hooks** — not applicable: all ten
  handlers are exec-form (`command: "node"` + `args`), which ignores `shell`.
- **`/skill-doctor` and `/doctor prompt-audit`** — not a "no change": adopt
  as optional audit inputs (row 3 below). Neither replaces `inventory.mjs`
  (headless, portable) or the judgment diff.
- **Anthropic's directory as a distribution channel** — not pursued; hooks
  and the adapter contract are Claude-Code-only components and a synced
  install has no adapter step.
- **`.claude/rules/`** — not adopted: 45 lines, every rule repo-wide.
- **`PreModelSwitch`** — rejected verdict unchanged (decision-only).
- **2.1.286 `verify` recipe nudge at commit time** — overlaps
  `live-verify-reminder`'s moment but not its content (the kit reminder
  points at the adapter's `verify` block and the skill's domain reference,
  the harness nudge at a recorded `/verify` recipe); keep both, no row.

## Watch item re-check

Harness-side git-root resolution for `CLAUDE_PROJECT_DIR` on subdirectory
launches: ninth pass. The hooks reference still defines the placeholder as
"the project root where the session started" with the worktree carve-out
only. Adjacent movement, not the gate: project *skills* now load from every
parent `.claude/skills/` up to the repo root, and `/cd` (v2.1.246+) moves
the session root — but a skills-dir *plugin* still loads only from the
primary working directory, and nothing names hook paths. Changelog
2.1.253–2.1.282 was covered from doc version notes only (see the changelog
row). Gate not lifted.

## Proposed rows

1. **B1 — `PostModelSwitch` verdict + 12-of-33 refresh** (lifts Hooks +3;
   effort trivial). Re-record the manifest verdict on true grounds (now
   context-capable; recommend *reject* because no kit invariant is
   model-switch-shaped — a reorientation nudge belongs to
   SessionStart(compact), not to a model change), update `reviewedAgainst`
   and README's "only 11 … other 22" to 12/21, and add the 2026-10-05
   review date. Pin and deck already say 33 — unchanged.
2. **B1 — `skill-drift-guard` write-intent precision** (lifts Hooks +3;
   effort S). Anchor the redirect/cp/mv/sed detection to the guarded path
   (the operand or redirect *target* must be under `.claude/(skills|hooks)/`),
   and exclude fd-only redirects (`2>&1`, `>/dev/null`). Test shown failing
   first with this run's exact command; keep every current "fires" case.
3. **B3 — harness-audit method: harness-native inputs + changelog gap
   procedure** (method quality; effort S; `harness-audit` 0.1.11 → 0.1.12).
   §1 names `/skill-doctor` as the observed-use input when running inside
   Claude Code; §4 names `/doctor prompt-audit` as a mechanical input where
   the binary exists; §2 records the release-tag-page fallback when the
   changelog fetch returns fewer entries than the gap. Keep the body generic
   (tool names stay in `stack.md`).
4. **B3 — AGENTS.md precedence note + prose trim** (lifts Instruction +3;
   effort S). One CONTRIBUTING line: this repo relies on AGENTS.md, and a
   local `CLAUDE.local.md` silently replaces it (v2.1.277 rule; set
   `claude-md-and-agents-md` if you need both). Fold the carried trim of the
   release-ritual and rename prose into the same doc commit.
5. **Release hygiene (no row):** run `claude plugin validate --strict .`
   once before the next `plugin.json`-touching release and record the result
   in that release's Verification paragraph.
6. **Hygiene (no row — machine-local, fourth reminder):** prune the
   `settings.local.json` dead allowlist entries; trim `resume-prompt.md`
   under its 1,500-token budget.

`sources.md` (14 rows, all stamped 2026-10-05) and `stack.md` (two new
sections, Contents heading) updated in kit source and mirrored into the
dogfood install this run; both uncommitted. Per AGENTS.md the sign-off
commit is one release commit: this report, the two reference files and
their mirrors, `harness-audit` 0.1.11 → 0.1.12, the six version sites, and a
CHANGELOG entry with a Verification paragraph (gate 7/7 green on this tree
after the reference-file fixes; sampled delta pass 4/4 + 3/3). Rows 1–4 await
sign-off — this skill proposes, the gate decides.

## Verdict

The harness is **current with the 2026-10-05 ecosystem on every axis but
two hook details**, both found by the audit's own instruments: the hooks
reference quietly promoted `PostModelSwitch` to context-capable (the
changelog never said so — the targeted re-fetch did), and the
`skill-drift-guard` matcher fires on a stderr redirect, which the dogfood
session demonstrated twice while merely *running* the inventory script.
The ecosystem shift with the widest consequences is that the harness now
ships its own instruments for the kit's territory — per-skill usage, prompt
auditing, native with/without evals, and in-process Mods — and every one
of them has a recorded verdict in `stack.md` so the next run doesn't
re-propose it. The kit's eval layer held up under the one test that
matters: on the three newest anchors, nothing passes without the skill.
