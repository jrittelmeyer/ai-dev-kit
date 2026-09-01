# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Every row enters plan → sign-off → build.

Source: [PROJECT_AUDIT_2026-08-31](archive/PROJECT_AUDIT_2026-08-31.md)
(97.1/100, ninth audit — rows 47–54; 51–53 are the 2026-08-31 harness
audit's proposals, adopted there). Scored chain — project audits
[90.4](archive/PROJECT_AUDIT_2026-08-09.md) →
[96.9](archive/PROJECT_AUDIT_2026-08-09-post-B3.md) →
[97.4](archive/PROJECT_AUDIT_2026-08-12.md) →
[97.9](archive/PROJECT_AUDIT_2026-08-19.md) →
[96.8](archive/PROJECT_AUDIT_2026-08-24.md) →
[97.1](archive/PROJECT_AUDIT_2026-08-25.md) →
[97.9](archive/PROJECT_AUDIT_2026-08-26.md) →
[98.1](archive/PROJECT_AUDIT_2026-08-26-post-0.23.10.md) → 97.1; harness currency
[92.4](archive/HARNESS_AUDIT_2026-08-23.md) →
[96.5](archive/HARNESS_AUDIT_2026-08-25.md) →
[96.1](archive/HARNESS_AUDIT_2026-08-31.md); model-graded evals
[2026-08-24](archive/SKILL_EVALS_2026-08-24.md) →
[2026-08-26](archive/SKILL_EVALS_2026-08-26.md) (162/162 PASS); fleet audit
[FLEET_UPGRADE_PLAN_2026-08-25](archive/FLEET_UPGRADE_PLAN_2026-08-25.md).
Retired Watch items: [BACKLOG_WATCH_HISTORY](archive/BACKLOG_WATCH_HISTORY.md).

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 47 | release | Tag + GitHub Release v0.23.11–v0.23.15 (`check-tag-currency.mjs` warning on four since 2026-08-30). Four shas pass `check-release-ready.mjs`; **`33661c7` (0.23.12) has no CI run at all** (pushed in a batch with 0.23.13; the gate refuses it) — tag it with a Release note saying so, or land row 49(a) first and green-gate it retroactively. The same five CHANGELOG entries lack the Verification paragraph `AGENTS.md` requires — backfill from each sha's CI run, or relax the rule | Versioning +4 | S |
| B1 | 48 | hooks | Hook-surface currency: harness 2.1.251 added `PreModelSwitch` / `PostModelSwitch` (both non-advisory → reject/reject; `additionalContext` count stays 11). Record verdicts in `manifest.json → hooks.reviewed`, extend `smoke-hooks.mjs`'s `EVENT_SURFACE` pin 31→33 (shown failing first), refresh the "31 events" claims (README · deck · manifest `reviewedAgainst`), and fix `.claude-plugin/marketplace.json`'s stale "five advisory hooks (advise, never block)" description. `harness-audit`'s `sources.md` changelog row is already re-stamped 2.1.252 in the uncommitted 2026-08-31 run | Hooks +2 | S |
| B2 | 49 | release-tooling | Release automation (the advisory-only design met its revisit trigger — fired on four consecutive CI runs, no effect): (a) `workflow_dispatch` on `ci.yml` so any sha can be green-gated; (b) `release.yml` on `workflow_run` CI-success on `main` — when `VERSION` has no `v<version>` tag, run `check-release-ready` on that sha, cut the annotated tag, create the Release `v<version> — <subject>` from the CHANGELOG entry; (c) AGENTS.md: one release commit per push. Risk: auto-tag on a green-but-wrong sha — same gate the hand ritual uses | Versioning +3 | M |
| B3 | 50 | release-tooling | Mechanize `AGENTS.md:17`: `check-version.mjs` (or a sibling) fails when any CHANGELOG entry ≥ v0.23.11 lacks a `Verification:` paragraph — drifted five releases running with no tripwire | Versioning +1 | S |
| B3 | 51 | evals | Two-figure always-loaded budget: `skill-lint` and `harness-audit`'s `inventory.mjs` print *portable* (all descriptions; keeps the 900 lint budget) and *Claude Code charged* (auto-invocable only, ≈257 today); README/deck quote both | Docs +1 | S |
| B3 | 52 | evals | Full delta-mode eval pass: all 30 scenarios `--report --delta` on one tier, archived as `SKILL_EVALS_<date>.md` with pass-rate lift + token cost; replace every assertion that passes in both configurations (dep-check "reads release notes" first) | Testing +1 | M |
| B3 | 53 | hooks | `skill-drift-guard` PreToolUse twin: `PreToolUse` `Edit\|Write` advisory on the same `.claude/(skills\|hooks)/` match so the redirect precedes the wasted edit; keep the PostToolUse handler for Bash-path edits; record the verdict in `hooks.reviewed` either way | Hooks +1 | S |
| B3 | 54 | skills | `project-audit` step 5 ends "Then run `/checkpoint`" (`SKILL.md:132`), but 0.23.13 made `checkpoint` `disable-model-invocation` — the Skill tool now refuses it, so the instruction is unexecutable (found live 2026-08-31). Reword to "ask the user to run `/checkpoint`" (or hand back a ready commit summary); sweep the other bodies for the same pattern | Lifecycle +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the plugin marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — `source: "./"` ships the whole repo to every consumer's cache; no exclusion mechanism exists (re-verified against the live plugins reference 2026-08-31), so this needs a restructure. **Advised against** at current scale | Public +1 | L |

Watch (externally gated, re-check each audit):

- Harness-side git-root resolution for `CLAUDE_PROJECT_DIR` when sessions
  launch in a subdirectory (kit-side share closed by B1-1). The hooks doc
  defines the placeholder as "the project root **where the session started**"
  with a worktree carve-out; subdirectory launches remain unspecified. Last
  re-check **2026-08-31** (eighth pass since 2026-08-09): changelog swept
  through head **2.1.252** — no root-resolution entry (2.1.248's
  `CLAUDE_CODE_PROJECT_DIR_NAME` names the per-project transcript directory,
  not the root). Gate not lifted. Earlier re-check detail in
  [BACKLOG_WATCH_HISTORY](archive/BACKLOG_WATCH_HISTORY.md).
