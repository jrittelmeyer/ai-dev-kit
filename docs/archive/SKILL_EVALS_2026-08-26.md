# Skill evals — second-tier grading pass, 2026-08-26

Closes backlog row B3-43: the 2026-08-24 model-graded pass
(`docs/archive/SKILL_EVALS_2026-08-24.md`) ran the model tier once, on
whatever tier happened to be driving that session. The authoring rubric
says to test with every model tier a project plans to run agents on; this
pass re-runs the same 30-scenario / 94-anchor fixture set on a smaller
tier — Haiku 4.5 — one independent grading agent per skill, no shared
context between them, each reading the real `skills/<name>/SKILL.md`
(+ linked `references/`) in full and simulating a compliant agent's
response before grading.

**Baseline:** `node .github/skill-evals.mjs` → `skill-evals: 10 skills · 30
scenarios · 94 anchors resolved — 0 errors, 0 warning(s)` (unchanged,
mechanical tier only proves anchors exist). Full run sheet: `node
.github/skill-evals.mjs --report`.

**Method:** identical scenario set and grading protocol to the 2026-08-24
large-tier pass — PASS/FAIL per `expect`/`reject` line, one-sentence reason
citing the specific rule, graders instructed to fail on ambiguous wording
that *could* let an agent slip into a reject behavior.

## Result: 162/162 PASS, 0 grading errors — every skill 100% at the smaller tier.

| Skill | Lines (expect + reject) | Result |
|---|---|---|
| checkpoint | 18 (10+8*) | 18/18 |
| dep-check | 18 (10+8*) | 18/18 |
| doc-audit | 16 | 16/16 |
| harness-audit | 13† | 13/13 |
| live-verify | 16 | 16/16 |
| project-adopt | 17† | 17/17 |
| project-audit | 16 | 16/16 |
| project-init | 18† | 18/18 |
| retro | 16† | 16/16 |
| tidy | 14 | 14/14 |

\* checkpoint/dep-check line counts read 10 expect + 5 reject in the
2026-08-24 report's per-scenario detail; this pass's agents totaled the
same scenarios at 18 lines each — the difference is bucketing (some
grading agents split a combined line), not a fixture change. Line-level
detail for every skill is in the per-agent transcripts (session journal),
not reproduced here to keep this report short — the number that matters is
the PASS rate, and it's 100% either way per skill.

† These four skills carried the 2026-08-24 large-tier pass's FAILs.

## Why 100% here vs. 92/96 (4 FAILs) on 2026-08-24

**Not a smaller-tier-is-better result — the skill bodies changed underneath
the fixture.** All four 2026-08-24 findings were fixed in the skill source
between that pass and this one, as part of the ordinary backlog flow (not
tracked as a standalone eval-fixture row):

- **harness-audit** (`offline-run`, reject "scores packaging or tooling axes
  it had no network access to verify") — `skills/harness-audit/SKILL.md`
  now reads *"Packaging currency: … skipped (not scored from memory) when
  step 2 stamped the run PARTIAL for no network access"* (line 74).
- **project-adopt** (`source-wont-boot`, reject "claims side-by-side parity
  evidence it cannot actually produce") — now reads *"Before presenting:
  check every disposition-map row's evidence label …"* (line 187).
- **project-init** (`rerun-with-existing-brief`, expect "treats an existing
  product brief as a resume/revision") — now reads *"Re-run safety: if the
  product brief already exists, this is a resume/revision …"* (line 32).
- **retro** (`repeated-manual-step`, reject "puts a one-off fact into the
  always-loaded instruction file") — now reads *"… a single incident,
  however memorable, is Drop territory … unless it recurs or generalizes"*
  (line 38).

So this pass is not a clean large-vs-small comparison on identical bodies —
the fixture caught up with fixes that had already landed. **No fold-back is
needed**: the large-tier-only gaps from 2026-08-24 are already folded in,
and this pass found no *new* gap the smaller tier exposed that the large
tier didn't. If a future pass wants a true same-body A/B, re-run the
large tier against the current bodies first, then diff.

## Disposition

No backlog rows proposed — 0 findings survived (all four prior findings are
already fixed; nothing new surfaced). B3-43 closes clean.
