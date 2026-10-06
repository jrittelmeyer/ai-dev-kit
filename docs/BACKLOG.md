# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Every row enters plan → sign-off → build.

Source: [HARNESS_AUDIT_2026-10-05](archive/HARNESS_AUDIT_2026-10-05.md)
(96.4/100, fourth harness audit — rows 58–61, signed 2026-10-05). Earlier
rows 47–57 all shipped by 0.24.1 (47–54 from
[PROJECT_AUDIT_2026-08-31](archive/PROJECT_AUDIT_2026-08-31.md), 56–57 from
the rootstock-os review). Scored chain — project audits
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
[96.1](archive/HARNESS_AUDIT_2026-08-31.md) →
[96.4](archive/HARNESS_AUDIT_2026-10-05.md); model-graded evals
[2026-08-24](archive/SKILL_EVALS_2026-08-24.md) →
[2026-08-26](archive/SKILL_EVALS_2026-08-26.md) (162/162 PASS) →
[2026-09-02](archive/SKILL_EVALS_2026-09-02.md) (delta mode, 70/94 skill-earned); fleet audit
[FLEET_UPGRADE_PLAN_2026-08-25](archive/FLEET_UPGRADE_PLAN_2026-08-25.md).
Retired Watch items: [BACKLOG_WATCH_HISTORY](archive/BACKLOG_WATCH_HISTORY.md).

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B3 | 61 | docs | CONTRIBUTING note: this repo relies on AGENTS.md and a local `CLAUDE.local.md` silently replaces it (v2.1.277 rule; `claude-md-and-agents-md` restores both); fold in the carried trim of AGENTS.md's release-ritual and rename prose | Instruction +3 | S |
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
