# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Every row enters plan → sign-off → build.

Source: [PROJECT_AUDIT_2026-08-09-post-B3](archive/PROJECT_AUDIT_2026-08-09-post-B3.md)
(aggregate 96.9/100, re-scored after B1–B3 shipped as 0.9.0 → 0.11.0; baseline
[PROJECT_AUDIT_2026-08-09](archive/PROJECT_AUDIT_2026-08-09.md), 90.4/100).

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (gate re-confirmed shut 2026-08-12: zero issues/PRs) | Public +1 | M |

Watch (externally gated, re-check each audit):

- Harness-side git-root resolution for `CLAUDE_PROJECT_DIR` when sessions
  launch in a subdirectory (kit-side share closed by B1-1). Re-checked
  2026-08-09 (docs: placeholder defined only as "Project root," subdirectory
  behavior unspecified) and 2026-08-12 (changelog head 2.1.228: no related
  entry) — gate not lifted.
- Harness-side hook-injection visibility on Windows (B1-17 outcome, closed
  2026-08-09): a fresh exec-form session's deterministic instruments —
  context-guard probe (memory-file Write) and live-verify `git commit` (run
  via the Bash tool) — both drew no injection across both hook classes,
  matching the 0.11.0-build session (×3 events); the 0.10.1-build session
  had recorded fires. Kit exonerated
  in-situ — installed handlers hash-identical to source, local smoke 30/30 on
  the same Windows machine, CI green on windows-latest — so the open layer is
  harness spawn/display. Known same-class mechanism: BOM-prefixed stdin
  parse-fails and the stdin-tolerant handler exits 0 silently (CONTRIBUTING
  notes the hand-test trap). Observation log in kit memory (context-guard
  still silent 2026-08-12, memory-file edit probes).
