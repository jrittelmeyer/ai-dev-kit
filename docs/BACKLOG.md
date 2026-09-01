# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Every row enters plan → sign-off → build.

Source: [PROJECT_AUDIT_2026-08-26-post-0.23.10](archive/PROJECT_AUDIT_2026-08-26-post-0.23.10.md)
(98.1/100, eighth audit) plus the 2026-08-31 doc-audit findings (rows 47–48).
Scored chain — project audits
[90.4](archive/PROJECT_AUDIT_2026-08-09.md) →
[96.9](archive/PROJECT_AUDIT_2026-08-09-post-B3.md) →
[97.4](archive/PROJECT_AUDIT_2026-08-12.md) →
[97.9](archive/PROJECT_AUDIT_2026-08-19.md) →
[96.8](archive/PROJECT_AUDIT_2026-08-24.md) →
[97.1](archive/PROJECT_AUDIT_2026-08-25.md) →
[97.9](archive/PROJECT_AUDIT_2026-08-26.md) → 98.1; harness currency
[92.4](archive/HARNESS_AUDIT_2026-08-23.md) →
[96.5](archive/HARNESS_AUDIT_2026-08-25.md); model-graded evals
[2026-08-24](archive/SKILL_EVALS_2026-08-24.md) →
[2026-08-26](archive/SKILL_EVALS_2026-08-26.md) (162/162 PASS); fleet audit
[FLEET_UPGRADE_PLAN_2026-08-25](archive/FLEET_UPGRADE_PLAN_2026-08-25.md).
Retired Watch items: [BACKLOG_WATCH_HISTORY](archive/BACKLOG_WATCH_HISTORY.md).

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 47 | release | Tag + GitHub Release v0.23.11–v0.23.15 on their CI-green shas (`check-release-ready.mjs` per sha first; `check-tag-currency.mjs` is warning on four). The same five CHANGELOG entries lack the Verification paragraph `AGENTS.md` requires — backfill from each sha's CI run, or relax the rule | Release +1 | S |
| B1 | 48 | hooks | Hook-surface currency: harness 2.1.251 added `PreModelSwitch` / `PostModelSwitch` (found 2026-08-31, changelog head 2.1.252). Record verdicts in `manifest.json → hooks.reviewed`, extend `smoke-hooks.mjs`'s `EVENT_SURFACE` pin 31→33, refresh the "31 events / 11 additionalContext" claims (README · deck · manifest `reviewedAgainst`), re-stamp `harness-audit`'s `sources.md` changelog row (still 2.1.246) | Hooks (currency) | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the plugin marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — `source: "./"` ships the whole repo to every consumer's cache; no exclusion mechanism exists (re-verified against the live plugins reference 2026-08-25), so this needs a restructure. **Advised against** at current scale | Public +1 | L |

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
