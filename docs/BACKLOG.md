# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Every row enters plan → sign-off → build.

Source: [PROJECT_AUDIT_2026-10-18](archive/PROJECT_AUDIT_2026-10-18.md)
(96.3/100, tenth audit — rows 62–67; 62 is an open high-severity CodeQL
alert and goes first). Earlier rows 47–61 all shipped by 0.24.9 (47–54 from
[PROJECT_AUDIT_2026-08-31](archive/PROJECT_AUDIT_2026-08-31.md), 56–57 from
the rootstock-os review, 58–61 from
[HARNESS_AUDIT_2026-10-05](archive/HARNESS_AUDIT_2026-10-05.md)). Scored chain — project audits
[90.4](archive/PROJECT_AUDIT_2026-08-09.md) →
[96.9](archive/PROJECT_AUDIT_2026-08-09-post-B3.md) →
[97.4](archive/PROJECT_AUDIT_2026-08-12.md) →
[97.9](archive/PROJECT_AUDIT_2026-08-19.md) →
[96.8](archive/PROJECT_AUDIT_2026-08-24.md) →
[97.1](archive/PROJECT_AUDIT_2026-08-25.md) →
[97.9](archive/PROJECT_AUDIT_2026-08-26.md) →
[98.1](archive/PROJECT_AUDIT_2026-08-26-post-0.23.10.md) →
[97.1](archive/PROJECT_AUDIT_2026-08-31.md) → 96.3; harness currency
[92.4](archive/HARNESS_AUDIT_2026-08-23.md) →
[96.5](archive/HARNESS_AUDIT_2026-08-25.md) →
[96.1](archive/HARNESS_AUDIT_2026-08-31.md) →
[96.4](archive/HARNESS_AUDIT_2026-10-05.md); model-graded evals
[2026-08-24](archive/SKILL_EVALS_2026-08-24.md) →
[2026-08-26](archive/SKILL_EVALS_2026-08-26.md) (162/162 PASS) →
[2026-09-02](archive/SKILL_EVALS_2026-09-02.md) (delta mode, 70/94 skill-earned); fleet audit
[FLEET_UPGRADE_PLAN_2026-08-25](archive/FLEET_UPGRADE_PLAN_2026-08-25.md).
Retired Watch items: [BACKLOG_WATCH_HISTORY](archive/BACKLOG_WATCH_HISTORY.md).

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 62 | ci-security | Close the `release.yml` pwn-request (CodeQL alert #1, high, open since 2026-09-02): gate the job on `workflow_run.event == 'push'` **and** `workflow_run.head_repository.full_name == github.repository` beside the existing checks; verify by the alert closing and a fork-PR run showing `skipped` | Security +5 | S |
| B1 | 63 | hooks | `script-exec-guard` hardening, each shown failing first: `\rm` / `/bin/rm` verbs, `xargs rm`, `+=` and climbing-mktemp exemption bypass, `Binary files` diff output counts as "all", memoised `assigns()` so a 192 KB script scans inside the 10 s timeout instead of failing open, `+++` skipped only before the first `@@`, extensionless heredoc targets, `timeout`/`nice`/`flock` wrappers; document the size/`node_modules` skips and `cd "$HOME"; rm -rf .` as known limits | Hooks +6 | M |
| B2 | 64 | harness-audit | `inventory.mjs` robustness: BOM/JSONC-safe `hooksFromFile` degrading to an "unreadable" line, dedup key with `if` + full command, non-`.mjs` handler names, inline `plugin.json` hooks, no-skills-dir continues, symlinks followed, fixture-shape-only reads; smoke cases for the Skills and Hooks sections; SKILL.md §1 names the standing-instruction section | Lifecycle +3 | M |
| B2 | 65 | release-tooling | `cut-release.mjs` idempotence (existing-tag sha check, `gh release view` fallback), `check-release-ready` pagination (`per_page=100`), AGENTS.md states the red-release-sha consequence (orphaned version: hand-tag the fix sha or documented skip) and `check-tag-currency` accepts the skip, `GITHUB_JOB` self-exclusion commented, Release titles capped | Versioning +3 | S |
| B3 | 66 | ci | CONTRIBUTING "Before you push" gains the Linux gate run (Docker `node:22`) with the reason — 0.24.2/0.24.3 went red on ubuntu from a `\` a Windows-only run can't see | Testing +1 | S |
| B3 | 67 | ci-security | Alert monitoring between audits: `check-release-ready` refuses to cut a release while a code-scanning alert ≥ high is open (`security-events: read`); a weekly `schedule:` CI step fails the same way | Security +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the plugin marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — `source: "./"` ships the whole repo to every consumer's cache; no exclusion mechanism exists (re-verified against the live plugins reference 2026-08-31), so this needs a restructure. **Advised against** at current scale | Public +1 | L |

Watch (externally gated, re-check each audit):

- Harness-side git-root resolution for `CLAUDE_PROJECT_DIR` when sessions
  launch in a subdirectory (kit-side share closed by B1-1). The hooks doc
  defines the placeholder as "the project root **where the session started**"
  with a worktree carve-out; subdirectory launches remain unspecified. Last
  re-check **2026-10-05** (ninth pass since 2026-08-09): hooks reference
  definition unchanged at head **2.1.289**; adjacent movement only —
  project *skills* now load from every parent `.claude/skills/` up to the
  repo root and `/cd` (v2.1.246+) moves the session root, but a skills-dir
  plugin still loads only from the primary working directory and nothing
  names hook paths. Changelog 2.1.253–2.1.282 covered from doc version notes
  only (see the audit's changelog row). Gate not lifted. Earlier re-check
  detail in [BACKLOG_WATCH_HISTORY](archive/BACKLOG_WATCH_HISTORY.md).
