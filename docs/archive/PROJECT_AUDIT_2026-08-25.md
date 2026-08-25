# Project audit — 2026-08-25

Sixth audit. Baseline: [PROJECT_AUDIT_2026-08-24](PROJECT_AUDIT_2026-08-24.md)
at 96.8/100, audited at `409143c` (report + doc fixes at `692d106`).
**Aggregate now: 97.1/100.** Four releases landed since (0.20.0 → 0.23.1),
closing all fourteen open rows from the last pass and shipping the kit's first
blocking hook class — opt-in enforcement, absorbed from the five-consumer fleet
audit. The new surface verified strong; the pass found one real contract gap
(the adapter validator doesn't enforce the schema's new `required` keywords)
and one release-discipline slip (v0.23.0's tag sits on a red-CI commit).

## Method & bounding

Delta pass per the skill: `git diff 692d106..HEAD` (HEAD = `0ead453`) —
**53 files, +2,444 / −108**. Code byte-identical to the previously verified
tree carried by identity: the five advisory-era handlers other than the two
that changed, all unchanged skill bodies, CI workflow definitions,
CONTRIBUTING, PERMISSIONS, marketplace manifest. Everything else was read in
full: the three enforcement handlers, both wiring files, `install.mjs`, the
schema growth, both new fixtures, `optional/contrarian/`, the smoke/lint
changes, and every changed doc.

Live checks run this pass (none inherited):

- **Full local gate green by execution**: root `--check` → "installed copies
  match kit source (**36 files**)" (was 33 — the three enforcement handlers);
  `skill-lint` → 10 skills clean, 0/0, description budget **897/900**;
  `skill-evals` → 10 skills · 30 scenarios · **94 anchors**, 0/0;
  `smoke-hooks` → **135 asserts** — the tally now counts every assertion run,
  and a by-hand recount of the suite (29 fire/silent + 27 garbage + 6 BOM +
  16 wiring + 1 parity + 1 config-override + 5 stop-gate + 7 banned-api +
  2 doc-naming + 5 checkpoint-autorun + 36 decision-log) reproduces exactly
  135; `smoke-installer` → all merge/stale/advisory/fixture cases;
  `check-version` → **0.23.1 × 6 sites**. Tree clean at `0ead453`.
- `gh api …/code-scanning/alerts?state=open` → **0**;
  `…/dependabot/alerts?state=open` → **0** (APIs, not badges). Issues **0** ·
  PRs **0**. `Dependabot Updates` succeeded 08-16 and 08-23 — weekly cadence
  alive. Releases current through **v0.23.1** (Latest), all titled
  `v<ver> — <subject>`.
- **CI conclusions per commit**: green on `c42efac`, `2749590`, `dd3b002`,
  and `609b8e8` → `0ead453`; **failure on `6f2099e` and `ad04e77`** (the
  0.23.0 release commit and its first follow-up — see deduction 8). CodeQL
  green on all nine.
- **Authorities re-fetched, not recalled**: the hooks reference pulled raw
  (291 KB, grepped directly — see below), the plugins reference, the harness
  changelog (head now **2.1.246**, was 2.1.241).

### One claim checked and rejected

The summarized fetch of the hooks reference listed **30** events — omitting
`SessionEnd` — which would have meant the harness dropped an event and the
kit's 31-event decision log was stale. Grepped raw instead: `### SessionEnd`
is present (line 3002), and the full heading enumeration yields **exactly the
kit's 31 events** — no additions, no removals. The manifest's organizing fact
was also re-derived independently from the raw doc: precisely **11** events
carry `hookSpecificOutput.additionalContext` (SessionStart, Setup,
SubagentStart, UserPromptSubmit, UserPromptExpansion, PreToolUse, PostToolUse,
PostToolUseFailure, PostToolBatch, Stop, SubagentStop) — matching
`hooks.reviewedAgainst` word for word. Same failure mode the 2026-08-24 pass
recorded; same defense.

## Scores

| # | Group | 08-24 | Now | Movement |
|---|-------|------:|----:|----------|
| 1 | Lifecycle skills | 98 | 98 | dep-check discharge hygiene + harness-audit fixes landed; standing deductions unchanged |
| 2 | Inception skills | 95 | 96 | rows 34/35 closed real procedure gaps |
| 3 | Adapter contract | 100 | 98 | schema's new `required` keywords aren't enforced by the validator |
| 4 | Installer | 97 | 97 | `--help` fix recovered; validator docblock claim now false |
| 5 | Hooks & automation | 96 | 98 | decision log 31/31 + tripwire, re-verified against the live doc; two config-hardening nits |
| 6 | Testing & CI | 96 | 97 | tally + graded evals + reserved-word recovered; enforcement secondary guards untested |
| 7 | Security & supply chain | 97 | 97 | trust contract rewrite accurate; line-count claim drifted again |
| 8 | Versioning & release | 98 | 96 | v0.23.0 tagged on a red-CI commit; release commit not self-contained |
| 9 | Docs & showcase | 95 | 98 | every checked claim held — the 08-25 doc-audit pass did its job |
| 10 | Public surface & governance | 96 | 96 | gates re-verified live; standing exclusions re-affirmed |

**Aggregate: 97.1/100** (was 96.8).

## Named deductions

**1 · Lifecycle skills — 98**: Test −1 — `live-verify`/`tidy`/`dep-check`
still have no in-repo-shaped trials (standing). Corr −1 — checkpoint's
context-health arithmetic is judgment prose, unfalsifiable; kept as designed.
The 0.22.0/0.23.0 skill work (PARTIAL-gated packaging axis, installed-path
inventory usage, discharge-dated suppressions) all verified in the bodies.

**2 · Inception skills — 96**: carried — trials recorded but not repeatable
(−2), no in-kit worked example (−1), density (−1). Recovered +1: project-adopt
§8 now *checks* evidence labels against intake grades before sign-off (row 34)
and project-init §1 resumes from an existing brief on a bare re-run (row 35) —
both verified present in the shipped bodies.

**3 · Adapter contract — 98**: **New: Corr −2** — 0.23.0's schema growth
introduced the kit's first `required` keywords
(`enforcement.bannedApis` items require `paths` + `rules`; each rule requires
`pattern` + `why`), but `install.mjs`'s `validateAdapter` implements only
type · enum · properties/additionalProperties · items — **`required` is
silently ignored**. A `bannedApis: [{}]` entry passes install-time validation
and the `--check` advisory, then no-ops at runtime (the guard skips groups
without `paths`): a consumer who believes they turned on a blocking guard has
a fail-open no-op and no signal anywhere. → row 37.

**4 · Installer — 97**: Sec −1 — settings.json rewritten in place, no backup;
standing won't-fix. DX −1 — flag micro-semantics undocumented (standing).
Recovered +1: docblock + `--help` now name `hooks/installer-hooks.json`, with
two smoke asserts locking the prose (row 24 closed and guarded). **New:
Corr −1** — the `validateAdapter` docblock (install.mjs:113) claims coverage
of "the subset of JSON Schema the kit's schema actually uses"; since 0.23.0
the schema uses `required`, so the claim is false — same root cause as
deduction 3, code-side. → row 37. The NOT-INSTALLED `--check` branch verified
against its stamp-keyed logic.

**5 · Hooks & automation — 98**: recovered +3 Compl — `hooks.reviewed` carries
a disposition-prefixed verdict for all **31** events, `smoke-hooks` pins the
surface as a tripwire, and this pass re-enumerated the live doc's event
headings: exactly 31, no event 32 owed a verdict. Recovered +1 Corr — the
`source` guard shipped (negative-guard semantics smoke-covered per value).
**New: Corr −1** — `banned-api-guard` silently skips a rule whose `pattern`
doesn't compile (`catch { continue }`): a typo'd regex fail-opens a *blocking*
rule with no signal to the user or the agent, ever. **New: Corr −1** —
`stop-gate` accepts any integer `timeoutSeconds`: `0` disables the per-command
timeout (a hung gate then dies at the wiring's 300 s kill, losing the gate's
own report), and a negative value makes `execSync` throw `ERR_OUT_OF_RANGE`,
misreported as the command failing. → row 38. Re-verified true this pass: the
Stop-event contract (`decision: "block"` + reason; exit 2 feeds stderr back)
matches both Stop handlers' output shapes, and harness 2.1.245's fix for `if`
conditions false-firing on command substitution validated the kit's
defense-in-depth — the handler's own payload regex made the harness-side bug
harmless.

**6 · Testing & CI — 97**: recovered +3 — the running-`asserts` tally verified
truthful by execution *and* recount (135 = 135); the model-graded evals pass
is archived ([SKILL_EVALS_2026-08-24](SKILL_EVALS_2026-08-24.md), 92/96) with
its four gaps shipped as fixes; `skill-lint` enforces the reserved-word rule.
Test −1 — README ⇄ `--help` prose sync beyond the merge-source line still has
no automation (standing). **New: Test −1** — the enforcement handlers' primary
paths are well covered (inert / fire / block / loop-guard / BOM, real spawned
processes, real `git init`), but the **secondary guards are untested**:
checkpoint-autorun's mid-rebase/merge skip, no-upstream inertness, and
stale-lock TTL retrigger; stop-gate's timeout handling; banned-api-guard's
invalid-regex skip. **New: Test −1** — nothing cross-checks
`manifest.json → hooks.handlers` against the wiring files: a manifest handler
row pointing at an unwired file (or a wired handler missing from the manifest)
passes every gate — the two wiring files are only checked against *each
other*, events against the decision log. → row 40.

**7 · Security & supply chain — 97**: Test −1 — no scorecard/pin-audit
automation; standing exclusion at personal scale (SHA-pinned actions +
weekly Dependabot observed alive + both alert APIs at zero). **New: Docs −1**
— SECURITY.md's rewritten trust contract says handlers are "auditable in
around 100 lines each"; `checkpoint-autorun.mjs` is **135** lines. Exactly
the class the 08-24 pass fixed ("under 70" vs a 74-line handler). Fixed in
this pass ("under 140"). The contract's substance verified accurate against
the handlers line by line: stop-gate runs only user-listed commands, autorun's
git queries are read-only plus a TTL lock file, banned-api reads only the
edited file, no network anywhere, the never-ship-preset warning present.

**8 · Versioning & release — 96**: Compl −2 — tag + Release created by hand;
standing exclusion at current volume, **but the premise took damage this
cycle** (below). **New: Corr −2** — **v0.23.0's tag points at `6f2099e`,
whose CI concluded `failure`** on all four matrix legs (the settings-merge
fixture still treated Stop as a foreign event). The follow-up `ad04e77` fixed
the fixture but was *also* red — root `--check` found the dogfood `.claude/`
six files behind, because the self-install landed two commits later
(`609b8e8`). The README ritual requires the tag "pushed once CI is green";
the release was created after the tree converged, but the tagged sha never
went green, and the release commit violated AGENTS.md's own
behavior-change-⇒-reinstall rule by splitting the self-install out. Consumer
impact ≈ zero — product files (`skills/`, `hooks/`, `install.mjs`) were
correct throughout; a fixture and the dogfood copies lagged. Process impact
real: at five releases in two days, hand-sequencing failed in exactly the way
automation (or a mechanical pre-tag check) prevents. The six-site stamp gate
held throughout. → row 39.

**9 · Docs & showcase — 98**: Test −2 — external links/badges verified
manually each audit, never by automation; standing exclusion. Recovered +3 —
this pass checked and confirmed: README's 8-hook table with per-handler
opt-in markers, the pipeline block, both install routes, the thin-consumer
block; PLAYBOOK #9's reversal narrative (matches the manifest's `partial
0.23.0` Stop verdict); the deck at 0.23.1/2026-08-25 with ten skill cards,
eight hook rows, and the 31-event claim; BACKLOG's fleet-audit pointer;
CHANGELOG's assert-count claims (133 → 135) reproduced by execution. The
2026-08-25 doc-audit commit (`0ead453`) demonstrably did its job.

**10 · Public surface & governance — 96**: Compl −2 — no npm/`npx` channel;
B4-16's demand gate re-confirmed shut live (0 issues, 0 PRs). Compl −1 — no
CoC / issue templates / FUNDING; standing exclusion at personal scale.
Compl −1 — plugin payload ships the whole repo (B4-31); the plugins reference
re-confirmed **no exclusion mechanism exists** (only path-traversal
prevention), so the gate stands. Marketplace + installer routes both current;
harness 2.1.242–246 shipped plugin-cache and BOM'd-`plugin.json` fixes,
nothing contract-breaking.

## Drift findings

Two, one doc-side (fixed in pass), one code-side (rowed).

| # | Where | Claim | Reality | Disposition |
|---|-------|-------|---------|-------------|
| 1 | SECURITY.md | handlers "auditable in around 100 lines each" | 39–135 lines; checkpoint-autorun is 135 | fixed in pass ("under 140") |
| 2 | `install.mjs:113` docblock | validator covers "the subset of JSON Schema the kit's schema actually uses" | schema uses `required` since 0.23.0; validator doesn't implement it | **row 37** (code, not a doc) |

## Goals & gates re-check

- **Goals undrifted — policy evolved by the book.** "Advise-only automation"
  became "advise by default, blocking only behind per-project opt-in" via a
  recorded retro reversal on consumer evidence, with the unconfigured default
  unchanged and the trust contract updated in the same release. That is the
  PLAYBOOK #9 mechanism working as written.
- **Watch — git-root resolution**: changelog swept 2.1.241 → **2.1.246**; no
  entry touches root resolution. Hooks doc still defines
  `${CLAUDE_PROJECT_DIR}` as "the project root where the session started";
  subdirectory launches remain unspecified. **Gate not lifted.** Notable
  adjacent fix: 2.1.245 repaired `if` conditions (`Bash(cat *)` class)
  false-firing on command substitution — the kit's payload re-guard had
  already neutralized that class (defense-in-depth validated).
- **Watch — hook-injection visibility**: no full-session all-silent run
  observed; the Stop-block mechanism is new surface this cycle and fires only
  under adapter opt-in, which no kit-session config sets — row 41 would give
  it first-party live evidence.
- **B4-16 npm packaging**: demand gate shut (0 issues / 0 PRs, live).
- **B4-31 plugin payload**: exclusion-mechanism gate re-checked against the
  live plugins reference — still absent; advised-against stands.
- **Ecosystem currency**: event surface exactly 31 (raw-doc enumeration);
  `additionalContext` set exactly the recorded 11; SessionStart matcher
  values still `startup|resume|clear|compact|fork`; plugin hooks.json
  auto-discovery and `${CLAUDE_PLUGIN_ROOT}` anchoring re-confirmed.

## Backlog

Ordered by breadth of value to downstream projects, then depth, then effort.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 37 | installer | `validateAdapter` implements `required` (schema uses it since 0.23.0); fix the docblock's coverage claim; smoke case: a `bannedApis` entry missing `paths`/`rules` fails install and surfaces in the `--check` advisory | Adapter +2, Installer +1 | S |
| B2 | 38 | hooks | Enforcement config hardening: stop-gate clamps invalid `timeoutSeconds` (≤0 / non-integer → default 150); banned-api-guard surfaces a non-compiling `pattern` instead of silently skipping it (install/`--check` advisory; one-shot stderr note at runtime) | Hooks +2 | S |
| B2 | 39 | release | Mechanize the ritual's green-gate: README release steps gain a pre-tag check that the target sha's CI run concluded `success` (`gh run list --commit`), and AGENTS.md pins that a release commit is self-contained — self-install + fixture updates land in the same commit `--check`/smoke can prove | Versioning +2 | S |
| B3 | 40 | testing | Smoke the enforcement secondary guards (autorun mid-rebase skip, no-upstream inertness, stale-lock retrigger via backdated mtime; stop-gate bad-timeout; banned-api invalid-regex) and cross-check `manifest.hooks.handlers` ↔ wiring files | Testing +2 | S |
| B3 | 41 | dogfood | Kit's own adapter opts into `enforcement.stopGate` (fast pair: root `--check` + `skill-lint`) — first-party live coverage of the Stop path; also feeds the hook-visibility Watch log | evidence (Watch) | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — `source: "./"` ships the whole repo; no exclusion mechanism exists (re-verified). **Advised against** at current scale | Public +1 | L |

Plus the two Watch rows (externally gated; neither backs a deduction).

## Considered and excluded (visible decisions, no rows)

- **banned-api-guard's `//`-stripping inside strings** (a URL's `//` truncates
  the line before matching) — documented accepted tradeoff, parity with the
  consumer originals; the block-comment/string edge class is the lint rule's
  job, per the handler's own "pair it with a lint rule" doctrine.
- **Stop wiring timeout (300 s) vs multi-command gates** — the schema
  description already pins "keep it under ~2 minutes"; a second warning would
  restate it.
- **contrarian-nudge timing** (fires after the plan is on screen) — harness
  constraint, honestly documented in the asset itself; the CLAUDE.md policy is
  the real mechanism.
- **Amending CHANGELOG 0.23.0's verification paragraph** with the CI-red
  facts — the backlog is forward-only and the CHANGELOG records what was
  verified at write time (locally green, truthfully); this report is the
  durable record of the push-sequence facts.
- **Full release automation (tag-push workflow)** — row 39 adds the guard
  without the machinery; automation stays excluded at current volume.
- **settings.json backup · CoC/templates/FUNDING · link checker in CI ·
  scorecard automation · uninstall flag · npm provenance · `inventory.mjs`
  cosmetics** — standing exclusions re-affirmed unchanged.
- **civicmatch civic-data CI red** — consumer-repo residual from the fleet
  program, tracked in kit memory; out of kit scope.

## Verdict

The score went up, and — more to the point — the *system* held under its
fastest cycle yet. Four releases in two days absorbed four consumer-built
patterns, reversed a recorded automation decision through the retro mechanism
rather than around it, and shipped the kit's first blocking surface with the
opt-in default, loop guards, BOM handling, and a 135-assert smoke net that
this pass reproduced by hand-count. The decision log the last audit demanded
now covers all 31 events and is pinned by a tripwire that this pass verified
against the live doc's own headings.

The two real findings are both boundary lessons. The `required` gap is what
happens when a schema grows a keyword its validator never needed before —
the contract's declared strictness silently exceeded its enforced strictness,
in the exact feature whose failure mode is a consumer believing a blocking
guard is on. And the 0.23.0 tag-on-red is what five hand-sequenced releases
in 48 hours does to a ritual whose green-gate lives in prose: nothing consumers
touched was ever wrong, but the invariant "release tags point at green shas"
now has one counterexample in the history. Row 37 closes the first; row 39
makes the second mechanically checkable. Everything else is hardening at the
edges of a surface that verified sound.
