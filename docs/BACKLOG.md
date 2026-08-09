# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. B1–B3 shipped across 0.9.0 → 0.11.0; the audit's banded path to ~100
as scored is complete, pending a fresh re-score.

Source: [PROJECT_AUDIT_2026-08-09](archive/PROJECT_AUDIT_2026-08-09.md)
(aggregate 90.4/100). Every row still enters plan → sign-off → build.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand | Public +1 | M |

Watch (externally gated, re-check each audit): harness-side git-root resolution
for `CLAUDE_PROJECT_DIR` when sessions launch in a subdirectory (kit-side share
closed by B1-1).
