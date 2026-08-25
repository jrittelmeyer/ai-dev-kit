# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Every row enters plan → sign-off → build.

Source: [PROJECT_AUDIT_2026-08-24](archive/PROJECT_AUDIT_2026-08-24.md)
(aggregate 96.8/100, fifth audit — a deliberate decrease: the 0.14.0–0.19.0
surface is strong, but the pass found doc drift plus a hook-surface currency
gap). Rows 23 and 27 closed in 0.20.0 — the hook decision log now covers all 31
harness events and `smoke-hooks` keeps it complete. Rows 24, 25, 26, and 32
closed in 0.21.0 — the `--help`/inventory-path doc drift and the
`live-verify-reminder` multi-line false-fire. Chain: [90.4](archive/PROJECT_AUDIT_2026-08-09.md) →
[96.9](archive/PROJECT_AUDIT_2026-08-09-post-B3.md) →
[97.4](archive/PROJECT_AUDIT_2026-08-12.md) →
[97.9](archive/PROJECT_AUDIT_2026-08-19.md) → 96.8. Harness-currency baseline
[92.4](archive/HARNESS_AUDIT_2026-08-23.md); its rows 20–22 closed in
0.17.0–0.19.0. Row 28 closed by the model-graded
[SKILL_EVALS_2026-08-24](archive/SKILL_EVALS_2026-08-24.md) pass — 92/96
expect+reject lines PASS across all 10 skills; the 4 genuine wording gaps it
found were rowed as 33–36 and closed, along with 29–30, in 0.22.0. The
2026-08-25 fleet audit (`archive/FLEET_UPGRADE_PLAN_2026-08-25.md`) drove
0.23.0/0.23.1 — consumer-pattern upstreams incl. the opt-in enforcement hook
class — and filed no new kit rows; both B4 rows stand unchanged.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the plugin marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — `source: "./"` ships the whole repo to every consumer's cache; no exclusion mechanism exists, so this needs a restructure. **Advised against** at current scale | Public +1 | L |

Watch (externally gated, re-check each audit):

- Harness-side git-root resolution for `CLAUDE_PROJECT_DIR` when sessions
  launch in a subdirectory (kit-side share closed by B1-1). Re-checked
  2026-08-09, 2026-08-12, 2026-08-19, and **2026-08-24**: changelog swept
  through head 2.1.241 with no entry on root resolution (2.1.239's
  `metadata.pluginRoot` and 2.1.229's marketplace `command` sources are
  packaging, not resolution). The hooks doc now defines the placeholder as
  "the project root **where the session started**" — moved from the previously
  recorded "the project root" — and adds an explicit worktree carve-out
  (`${CLAUDE_PROJECT_DIR}` stays at the original root when Claude enters a
  worktree). Subdirectory launches remain unspecified — gate not lifted.
- Harness-side hook-injection visibility on Windows (B1-17 outcome, closed
  2026-08-09): a fresh exec-form session's deterministic instruments —
  context-guard probe (memory-file Write) and live-verify `git commit` (run
  via the Bash tool) — both drew no injection across both hook classes,
  matching the 0.11.0-build session (×3 events); the 0.10.1-build session
  had recorded fires. Kit exonerated in-situ — installed handlers
  hash-identical to source, local smoke green on the same Windows machine, CI
  green on windows-latest — so the open layer is harness spawn/display. Both
  classes proven visible on Windows 2026-08-12; every session on harness
  ≥ 2.1.228 has fired both classes on their **first** probe with zero misses;
  the one late-onset session (2.1.226, PostToolUse 2/8) predates that version.
  Full per-session observation log in kit memory. A silent probe = an
  intermittency datapoint; only a full-session all-silent run matching
  2026-08-09 reopens visibility. The known same-class mechanism (BOM-prefixed
  stdin parse-failing into a silent exit) is closed at the handler as of
  0.14.0. Re-confirmed 2026-08-24: the hooks contract still grants
  `additionalContext` to `PreToolUse`, `PostToolUse`, and `SessionStart`, so
  all five advisory handlers target supported events; the three 0.23.0
  enforcement handlers use the separately documented blocking mechanisms
  (Stop exit-2/decision-block, PostToolUse exit-2) rather than
  `additionalContext`.
