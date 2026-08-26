# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Every row enters plan → sign-off → build.

Source: [PROJECT_AUDIT_2026-08-26](archive/PROJECT_AUDIT_2026-08-26.md)
(aggregate 97.9/100, seventh audit — zero doc drift, all six gates green by
execution, every 0.23.2–0.23.9 fix verified; one process finding: versions
0.23.5–0.23.9 shipped untagged, no GitHub Release — backfilled + a
tag-currency advisory added in 0.23.10, row 44 shipped). Row 45 (SECURITY.md
handler-size tripwire) also shipped in 0.23.10. Chain:
[90.4](archive/PROJECT_AUDIT_2026-08-09.md) →
[96.9](archive/PROJECT_AUDIT_2026-08-09-post-B3.md) →
[97.4](archive/PROJECT_AUDIT_2026-08-12.md) →
[97.9](archive/PROJECT_AUDIT_2026-08-19.md) →
[96.8](archive/PROJECT_AUDIT_2026-08-24.md) →
[97.1](archive/PROJECT_AUDIT_2026-08-25.md) → 97.9. Harness currency
[92.4](archive/HARNESS_AUDIT_2026-08-23.md) →
[96.5](archive/HARNESS_AUDIT_2026-08-25.md) (rows 42–43 recovered its named
deductions — both shipped 2026-08-26); model-graded eval evidence in
[SKILL_EVALS_2026-08-24](archive/SKILL_EVALS_2026-08-24.md) →
[SKILL_EVALS_2026-08-26](archive/SKILL_EVALS_2026-08-26.md) (second-tier
pass, 162/162 PASS — the 2026-08-24 findings were already fixed by the
time this pass ran); the 2026-08-25 fleet audit
([FLEET_UPGRADE_PLAN_2026-08-25](archive/FLEET_UPGRADE_PLAN_2026-08-25.md))
drove the 0.23.x consumer-pattern upstreams.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the plugin marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — `source: "./"` ships the whole repo to every consumer's cache; no exclusion mechanism exists (re-verified against the live plugins reference 2026-08-25), so this needs a restructure. **Advised against** at current scale | Public +1 | L |

Watch (externally gated, re-check each audit):

- Harness-side git-root resolution for `CLAUDE_PROJECT_DIR` when sessions
  launch in a subdirectory (kit-side share closed by B1-1). Re-checked five
  passes 2026-08-09 → **2026-08-25**: changelog swept through head **2.1.246**
  with no entry on root resolution. The hooks doc defines the placeholder as
  "the project root **where the session started**" with a worktree carve-out;
  subdirectory launches remain unspecified — gate not lifted. Adjacent but
  distinct: 2.1.245 fixed `if` conditions (`Bash(cat *)` class) false-firing
  on command substitution — the kit's payload re-guard had already neutralized
  that class for `live-verify-reminder` (defense-in-depth confirmed).
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
  0.14.0. Re-confirmed 2026-08-25 against the raw hooks doc: exactly **11**
  events carry `additionalContext` and all five advisory handlers target
  supported ones; the three 0.23.0 enforcement handlers use the separately
  documented blocking mechanisms (Stop decision-block / exit 2, PostToolUse
  exit 2). The Stop-block path fired live kit-side for the first time in
  0.23.6 (B3-41): the kit's own adapter opted into `enforcement.stopGate`,
  a deliberate drift was introduced to fail the gate, the Stop hook blocked
  and fed the failure back, and a clean end afterward passed through
  silently. Gate closed.
