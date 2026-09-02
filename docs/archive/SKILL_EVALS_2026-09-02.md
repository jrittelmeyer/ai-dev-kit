# Skill evals — full delta-mode pass, 2026-09-02

Closes backlog row B3-52. Prior passes (`SKILL_EVALS_2026-08-24.md`,
`SKILL_EVALS_2026-08-26.md`) graded expect[]/reject[] against a single
with-skill run per prompt — proving the skill body is internally consistent,
but not that any given assertion demonstrates the skill *earning* the
behavior over what a generically capable baseline agent would already do.
This pass runs `.github/skill-evals.mjs --report --delta`, which adds a
second, unlabeled-skill baseline run of the same prompt per scenario, and
grades both.

**Baseline (mechanical tier, before this pass):** `node
.github/skill-evals.mjs` → `skill-evals: 10 skills · 30 scenarios · 94
anchors resolved — 0 errors, 0 warning(s)`.

**Model tier:** Sonnet 5 (the session's own tier), one independent agent per
skill, no shared context between them — matches the "whatever tier is
driving the session" precedent from the 2026-08-24 pass. The backlog asked
for one tier, not a cross-tier comparison (that's B3-43's territory,
already covered at large + Haiku 4.5).

**Method:** for each of the 10 skills' 3 scenarios, one fresh agent produced
two simulated runs of the identical prompt — **Run A** with the real
`SKILL.md` loaded and available, **Run B** as a generically capable,
well-instructed baseline agent with no skill files present and no skill
named — then graded every `expect[]`/`reject[]` line PASS/FAIL against each
run independently. A behavior passing in both runs is not evidence the
skill did anything; a reject line firing in B but not A is the skill
actively preventing a regression.

## Result: 70/94 (74%) expect behaviors are skill-earned; 24 are free

| Skill | Expect behaviors | Earned only w/ skill | Free (pass in both) |
|---|---|---|---|
| project-adopt | 10 | 10 (100%) | 0 |
| harness-audit | 10 | 9 (90%) | 1 |
| doc-audit | 9 | 8 (89%) | 1 |
| checkpoint | 10 | 8 (80%) | 2 |
| live-verify | 9 | 7 (78%)\* | 1 expect + 1 reject† |
| project-audit | 9 | 7 (78%) | 2 |
| retro | 9 | 7 (78%) | 2 |
| dep-check | 10 | 6 (60%) | 4 |
| project-init | 9 | 5 (56%) | 4 |
| tidy | 9 | 3 (33%) | 6 |
| **Total** | **94** | **70 (74%)** | **24** |

\* live-verify's per-scenario table also flagged one `reject[]` line as
free-passing (baseline agents don't silently pass an undriven flow either);
reject lines carry no `anchor` and aren't in scope for the "replace every
free assertion" instruction below, which targets `expect[]` entries only —
those are the fixture's literal-anchor-gated assertions.
† noted, not replaced (out of scope; see above).

**Reading the spread:** `project-adopt` (a large, structurally unusual
workflow — read-only source, parity contract, disposition map) is nearly
impossible for a baseline agent to reproduce by accident, so every
assertion earns its keep. `tidy` sits at the other end — most of its
guidance (measure before you prune, ask before a mass delete, scope a
destructive op narrowly, don't touch containers/browser) matches what a
generically cautious agent already does; the skill's real value is in a
handful of mechanically specific rules (which cache lacks a native TTL,
tree-killing a whole process group by PID, the dry-run-then-report shape)
that the replaced assertions now target directly.

**Token cost:** 19 Sonnet 5 subagent runs (10 delta-eval agents + 9
replacement agents) totaling ≈901k tokens (delta-eval agents ≈479k,
replacement agents ≈422k), plus the run-sheet generation and this session's
own orchestration/aggregation overhead (not separately metered). Each
delta-eval agent simulated 6 runs (3 scenarios × A/B) and graded ~9-10
expect/reject lines per skill in a single pass rather than as 60 separate
model calls, trading call-count for larger per-call context.

## Assertions replaced (23 `expect[]` entries across 9 skills)

Every entry below passed in *both* Run A and Run B — the old anchor is real
skill-body text, but the behavior it names is one a baseline agent already
exhibits. Each was replaced with a new `behavior`/`anchor` pair targeting a
mechanically specific, skill-only detail (a named threshold, config key,
artifact, or convention), re-verified against the same scenario's other
assertions for non-duplication, and confirmed present as a literal
substring in the skill body via a clean `node .github/skill-evals.mjs`
re-run after every edit.

| Skill | Scenario | Old anchor (free) | New anchor (skill-earned) |
|---|---|---|---|
| checkpoint | healthy-continue | `git add -A` | `useFileFlag: true` |
| checkpoint | three-strikes-handoff | `Three strikes` | `poisons further attempts` |
| dep-check | add-new-package | `One registry query beats any number of web searches` | `current stable version` |
| dep-check | renovate-major-triage | `breaking changes` | `say so explicitly in the commit/PR body` |
| dep-check | env-gated-integration | `publish date` | `Peers/host range` |
| dep-check | env-gated-integration | `abandonment proxy` | `deprecation/yank flag` |
| doc-audit | archive-not-delete | `one-line-per-item record` | `archive's index` |
| harness-audit | offline-run | `never fabricate` | `not scored from memory` |
| live-verify | undrivable-flow | `list what remains unverified` | `never "should work"` |
| project-audit | full-audit | `no product-code edits` | `This is the durable record.` |
| project-audit | public-surface | `adoption-killers` | `CONTRIBUTING, SECURITY, CoC` |
| project-init | raw-idea | `A wrong restatement is cheapest to catch here` | `jobs-to-be-done` |
| project-init | raw-idea | `One batched question round` | `every fit-map removal` |
| project-init | plan-documents | `Read every provided plan document fully` | `already free in the foundation` |
| project-init | rerun-with-existing-brief | `wait for explicit sign-off` | `a bare re-run with no new input` |
| retro | post-milestone-harvest | `Propose, don't apply` | `with effort marks` |
| retro | record-rejections | `only rules every future` | `the context-economy skill polices` |
| tidy | disk-low | `Report first` | ``cache.size` command` |
| tidy | disk-low | `Report reclaimed space` | `keeping recent builds for cache hits` |
| tidy | stale-test-data | `explicit user OK` | `hygiene.e2eUserPattern` |
| tidy | stale-test-data | `keep everything that doesn` | `pagination- and count-dependent tests` |
| tidy | orphaned-dev-process | `keep containers and the browser` | `hygiene.devPorts` |
| tidy | orphaned-dev-process | `Don't silently perform` | `holding a port or lock` |

`project-adopt` needed no changes — 0 free assertions.

**Post-replacement mechanical tier:** `node .github/skill-evals.mjs` →
`skill-evals: 10 skills · 30 scenarios · 94 anchors resolved — 0 errors, 0
warning(s)` — same scenario/anchor count as before (replacements swapped
`behavior`/`anchor` fields in place, no scenarios added or removed).

## Disposition

No skill body changes — this pass only touched the eval fixtures
(`.github/skill-evals/*.json`), not `.github/skill-evals.mjs`'s
anchor-literal mechanism. No new backlog rows: the assertions that came
back free were fixed in place as part of this row, not deferred. A future
delta pass should re-run periodically as skill bodies evolve, since a body
edit can turn an earned assertion free (if the specific mechanic is
generalized away) or vice versa.
