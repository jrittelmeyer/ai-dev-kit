# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Every row enters plan → sign-off → build.

Source: [PROJECT_AUDIT_2026-08-19](archive/PROJECT_AUDIT_2026-08-19.md)
(aggregate 97.9/100, fourth audit; chain: baseline
[90.4](archive/PROJECT_AUDIT_2026-08-09.md) → post-B3
[96.9](archive/PROJECT_AUDIT_2026-08-09-post-B3.md) →
[97.4](archive/PROJECT_AUDIT_2026-08-12.md) → 97.9). The 2026-08-23
modernization program (user-approved plan) shipped as 0.14.0–0.17.0; the
CHANGELOG owns that record. Rows 21–22 entered from the first
[harness-audit](archive/HARNESS_AUDIT_2026-08-23.md); row 21 (per-skill eval
scenarios) closed 0.18.0. B4-16 (npm/`npx` packaging) closed 0.17.0 —
superseded by the plugin marketplace, which serves git/npm-source installs
without a registry account; reopen only on explicit `npx`-install demand.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B3 | 22 | skills | harness-audit inventory script (zero-dep surface-table emitter for §1) — runs start from measured data; source: [HARNESS_AUDIT_2026-08-23](archive/HARNESS_AUDIT_2026-08-23.md) | Harness: disclosure +4 | S |

Watch (externally gated, re-check each audit):

- Harness-side git-root resolution for `CLAUDE_PROJECT_DIR` when sessions
  launch in a subdirectory (kit-side share closed by B1-1). Re-checked
  2026-08-09 (docs: placeholder defined only as "Project root," subdirectory
  behavior unspecified), 2026-08-12 (changelog head 2.1.228: no related
  entry), and 2026-08-19 (changelog 2.1.229–235: nothing on
  settings/root/`CLAUDE_PROJECT_DIR` — the nested-git entries concern trust,
  not root resolution; hooks doc still defines the placeholder only as "the
  project root") — gate not lifted.
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
  notes the hand-test trap). Both classes proven visible on Windows
  2026-08-12; every session on harness ≥ 2.1.228 through 2026-08-19 has
  fired both classes on their **first** probe with zero misses — the one
  late-onset session (2.1.226, PostToolUse 2/8) predates that version and
  no changelog entry attributes the change. Full per-session observation
  log in kit memory. A silent probe = intermittency datapoint; only a
  full-session all-silent run matching 2026-08-09 reopens visibility.
  The known same-class mechanism (BOM-prefixed stdin parse-failing into a
  silent exit) is closed at the handler as of 0.14.0 — handlers strip a
  leading BOM, so any future silence cannot be that mechanism.
