# Project audit — 2026-08-26

Seventh audit. Baseline: [PROJECT_AUDIT_2026-08-25](PROJECT_AUDIT_2026-08-25.md)
at 97.1/100, audited at `0ead453`. **Aggregate now: 97.9/100.** Eight releases
landed since (0.23.2 → 0.23.9), closing every open row from the last pass —
the validator `required` gap, enforcement config hardening, the release
green-gate, secondary-guard smoke, the stop-gate dogfood, and both
harness-audit rows. The shipped fixes all verified sound, most of them by
execution. The pass found one real process finding: **0.23.5–0.23.9 shipped
with no tags or GitHub Releases** — the release ritual stalled at v0.23.4,
one commit after the green-gate that was built to protect it.

## Method & bounding

Delta pass per the skill: `git diff 0ead453..HEAD` (HEAD = `08a52b0`) —
**31 files, +1,176 / −119**. Code byte-identical to the previously verified
tree carried by identity: all five advisory handlers, checkpoint-autorun,
eight of ten skill bodies, CI workflow definitions, CONTRIBUTING,
PERMISSIONS, the marketplace manifest, README outside its two changed hunks.
Read in full: the `install.mjs` validator changes (`required` +
`validateBannedApiPatterns`), both changed hooks, the new
`check-release-ready.mjs`, every new smoke case in both suites, the adapter's
new `enforcement` block, the harness-audit sources/stack repairs, both new
archive reports, and every changed doc hunk.

Live checks run this pass (none inherited):

- **Full local gate green by execution**: root `--check` → 36 files in sync;
  `skill-lint` → 10 skills, 0/0, description budget **855/900** (was 897 —
  B3-42's trim verified by the linter's own tally); `skill-evals` → 30
  scenarios · 94 anchors, 0/0; `smoke-hooks` → **143 asserts** (was 135;
  CHANGELOG's 139 → 143 growth claims reproduced); `smoke-installer` →
  **75 ok-asserts** (matches CHANGELOG's claim exactly); `check-version` →
  0.23.9 × 6 sites. Tree clean at `08a52b0`.
- `gh api …/code-scanning/alerts?state=open` → **0**;
  `…/dependabot/alerts?state=open` → **0** (APIs, not badges). Issues **0** ·
  PRs **0**. Dependabot Updates succeeded 08-09/08-16/08-23 — weekly cadence
  alive. CodeQL green on 08-26 runs.
- **CI conclusions per commit**: green on **all eleven** commits since the
  last audit (`39c5ae2` → `08a52b0`), both CI and push workflows. No red sha
  anywhere in the window — row 39's atomicity rule held in practice.
- **Releases**: `gh release list` → Latest is **v0.23.4**; tags stop at
  `v0.23.4`. Versions 0.23.5–0.23.9 have CHANGELOG entries and version-bump
  commits but **no tag and no Release** (deduction 8).
- **Handler line counts**: max 135 (checkpoint-autorun) — SECURITY.md's
  rewritten "under 140 lines" claim verified true this time.
- **Authorities re-fetched, not recalled**: harness changelog head still
  **2.1.246** (raw fetch today) — zero harness releases since the 08-25
  full-surface verification, so the 31-event decision log and the 11-event
  `additionalContext` set carry with today's head-check as evidence.

## Scores

| # | Group | 08-25 | Now | Movement |
|---|-------|------:|----:|----------|
| 1 | Lifecycle skills | 98 | 98 | sources.md self-repair + description trims verified; standing deductions unchanged |
| 2 | Inception skills | 96 | 96 | description trim only; standing deductions unchanged |
| 3 | Adapter contract | 98 | 100 | `required` enforced recursively + pattern-compile check, both routes smoke-covered |
| 4 | Installer | 97 | 98 | docblock claim now true; `validateBannedApiPatterns` closes the schema's blind spot |
| 5 | Hooks & automation | 98 | 100 | both config-hardening nits fixed and smoke-covered; Stop path fired live (B3-41) |
| 6 | Testing & CI | 97 | 99 | secondary guards + manifest↔wiring cross-check shipped, mutation-tested; latent assertAutorunSilent flaw fixed |
| 7 | Security & supply chain | 97 | 98 | line-count claim accurate this pass; nothing gates the claim class (new deduction) |
| 8 | Versioning & release | 96 | 96 | green-gate shipped and verified against the known-red sha (+2); five untagged releases (−2) |
| 9 | Docs & showcase | 98 | 98 | every checked claim held; standing link-automation exclusion |
| 10 | Public surface & governance | 96 | 96 | standing exclusions re-affirmed; alert APIs at zero live |

**Aggregate: 97.9/100** (was 97.1) — ties the 2026-08-19 peak, now with the
enforcement class on board.

## Named deductions

**1 · Lifecycle skills — 98**: Test −1 — `live-verify`/`tidy`/`dep-check`
still have no in-repo-shaped trials (standing). Corr −1 — checkpoint's
context-health arithmetic is judgment prose (standing, kept as designed).
Verified this pass: harness-audit 0.1.4/0.1.5's `sources.md` self-repair
(registry.modelcontextprotocol.io row, raw-changelog URL) demonstrates the
skill's "a moved source is itself a finding" rule working on its own
references; the B3-42 trims kept third-person + trigger clauses.

**2 · Inception skills — 96**: carried — trials recorded but not repeatable
(−2), no in-kit worked example (−1), density (−1). The second-tier eval pass
(162/162, Haiku 4.5) adds cross-tier evidence for the bodies but doesn't
change the trial-repeatability picture.

**3 · Adapter contract — 100**: row 37 verified closed by execution —
`validateAdapter` enforces `required` recursively on any object schema, the
docblock names it, and smoke-installer proves both routes (pre-write exit 1
naming both missing keys; `--check` advisory on an installed config). The
pattern-compile check covers what JSON Schema can't express. Nothing left
that would materially benefit a downstream project.

**4 · Installer — 98**: Sec −1 — settings.json rewritten in place, no backup;
standing won't-fix. DX −1 — flag micro-semantics undocumented (standing).
Recovered +1: the docblock coverage claim is true again and
`validateBannedApiPatterns` is the install-time counterpart to the runtime
skip — same failure class closed at both ends.

**5 · Hooks & automation — 100**: recovered +2 — stop-gate clamps
non-positive `timeoutSeconds` to the 150 s default (smoke: `0` and `-5`
both exit 0), and banned-api-guard names a non-compiling pattern on stderr
while the valid sibling still blocks (smoke: exit 2 + "non-compiling
pattern" both asserted). The Stop-block path now has first-party live
evidence: 0.23.6's deliberate-drift trial fired the gate, fed the failure
back, and passed a clean end silently — the hook-visibility Watch gate is
closed in BACKLOG on that evidence.

**6 · Testing & CI — 99**: recovered +2 — row 40 shipped complete: mid-rebase
skip, stale-lock retrigger (backdated mtime), no-upstream inertness, and the
manifest `hooks.handlers` ↔ `hooks.json` cross-check, with every new
assertion mutation-tested per the CHANGELOG (guard broken → red → restored).
The pass also fixed a latent flaw this audit's predecessor missed:
status-only "silent" assertions couldn't catch checkpoint-autorun firing
anyway (it always exits 0), so all its cases now assert on stdout content.
Test −1 — README ⇄ `--help` prose sync beyond the merge-source line still has
no automation (standing).

**7 · Security & supply chain — 98**: Test −1 — no scorecard/pin-audit
automation; standing exclusion at personal scale (SHA-pinned actions, weekly
Dependabot observed alive, both alert APIs at zero). **New: Test −1** — the
SECURITY.md handler-size claim has drifted twice in two consecutive audits
("under 70" vs 74; "around 100" vs 135) and is only ever corrected by hand
during an audit. The claim class needs a tripwire: one smoke assert comparing
`hooks/*.mjs` max line count against the documented bound would end the
recurrence. → row 45.

**8 · Versioning & release — 96**: Compl −2 — tag + Release created by hand;
standing exclusion at current volume. **New: Corr −2** — **versions
0.23.5–0.23.9 shipped with no tag and no GitHub Release**; `gh release list`
shows v0.23.4 as Latest while the tree, manifest, and deck all say 0.23.9. A
consumer landing on the Releases page sees a version five releases stale.
The README ritual ("every release commit gets an annotated tag and a
Release") simply stopped being followed one commit after `check-release-ready.mjs`
shipped — the gate answers "is this sha green enough to tag?" but nothing
asks "did you tag at all?". Recovered +2: the green-gate itself is real and
was verified against both a known-green and the known-red v0.23.0 sha at
build time; all eleven shas in this window are green, and release-commit
atomicity (AGENTS.md) held in practice. → row 44.

**9 · Docs & showcase — 98**: Test −2 — external links/badges verified
manually each audit, never by automation; standing exclusion. Checked and
held this pass: README's quality-bar rewrite (97.1 chain, 96.5 harness,
162/162 evals — all three backed by the archive reports read this pass),
BACKLOG's rewritten chain + closed hook-visibility gate, CHANGELOG's four
executable claims (855 tokens, 143 asserts, 75 asserts, 6 stamps) all
reproduced, deck stamps at 0.23.9/2026-08-26.

**10 · Public surface & governance — 96**: Compl −2 — no npm/`npx` channel;
B4-16's demand gate re-confirmed shut live (0 issues, 0 PRs). Compl −1 — no
CoC / issue templates / FUNDING; standing exclusion at personal scale.
Compl −1 — plugin payload ships the whole repo (B4-31); the 08-25
harness-audit re-verified no exclusion mechanism exists, and the harness
changelog is unchanged since. The stale Releases page is scored in group 8,
not double-counted here.

## Drift findings

None. Every doc claim checked this pass matched the code or reproduced by
execution — the first zero-drift pass in the audit chain. (The untagged
releases are a process gap, not a doc-vs-code mismatch: the ritual prose is
correct; it wasn't followed.)

## Goals & gates re-check

- **Goals undrifted**: portable skill library + adapter contract +
  installer, advisory-by-default with opt-in enforcement — the 0.23.x line
  hardened that surface without widening it.
- **Watch — git-root resolution**: changelog head still 2.1.246 (raw fetch
  today); no entry on root resolution since. **Gate not lifted.**
- **Watch — hook-injection visibility**: **closed** by 0.23.6's live
  Stop-fire evidence (BACKLOG records the trial); no reopening datapoint.
- **B4-16 npm packaging**: demand gate shut (0 issues / 0 PRs, live today).
- **B4-31 plugin payload**: exclusion-mechanism gate re-verified 08-25 by the
  harness audit; harness unchanged since (head 2.1.246). Advised-against
  stands.
- **Ecosystem currency**: zero harness releases since the last full-surface
  verification — the 31-event decision log, 11-event `additionalContext`
  set, and plugin-reference verdicts all carry with today's head-check.

## Backlog

Ordered by breadth of value to downstream projects, then depth, then effort.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 44 | release | Backfill tags + Releases for v0.23.5–v0.23.9 (each from its CHANGELOG entry, on its release sha — all verified green this pass), and mechanize tag currency: a CI-or-gate advisory when `VERSION` has no matching `v<version>` tag (e.g. extend `check-version.mjs` to warn, or a `check-release-ready` sibling that lists unshipped versions) | Versioning +2 | S |
| B3 | 45 | security-docs | SECURITY.md handler-size claim gets a tripwire: smoke assert that max `hooks/*.mjs` line count stays under the documented bound (claim drifted twice in two audits, hand-fixed both times) | Security +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — `source: "./"` ships the whole repo; no exclusion mechanism exists (re-verified 2026-08-25). **Advised against** at current scale | Public +1 | L |

Plus the one remaining Watch row (git-root resolution; externally gated).

## Considered and excluded (visible decisions, no rows)

- **In-repo trials for live-verify/tidy/dep-check and repeatable inception
  trials** — standing; the fixture cost outweighs the value at one-consumer
  scale, and the second-tier eval pass now covers the bodies' wording from a
  second angle.
- **README ⇄ `--help` sync automation** — standing; the merge-source line
  (the highest-drift claim) is already smoke-locked.
- **Full release automation (tag-push workflow)** — row 44 adds the
  missing-tag *signal* without the machinery; at current volume the
  judgment call stays human. Worth revisiting only if row 44's advisory
  fires repeatedly.
- **settings.json backup · CoC/templates/FUNDING · link checker in CI ·
  scorecard automation · npm provenance** — standing exclusions re-affirmed.
- **Permissions-allowlist hygiene** (dead machine-local entries) — the 08-25
  harness audit's user-side note; machine-local, not a repo row.

## Verdict

The cleanest delta pass in the chain: eight releases, eleven green shas, zero
doc drift, and every one of the five audit rows verified closed — most by
running the smoke case that now guards it. The adapter contract is back at
100 and hooks join it there, with the Stop-block path now proven live rather
than by construction. The one real finding is a familiar shape in a new
place: 0.23.0 taught that the ritual's green-gate lived in prose, so 0.23.4
mechanized it — and then the *tagging step itself* went unexercised for five
straight releases. The lesson row 44 encodes is the same one row 39 did:
any release-ritual invariant that matters needs a mechanical check, because
at this cadence prose gets skipped. Everything else is a two-point tail:
tripwire the SECURITY claim class, and the standing personal-scale
exclusions that keep 100 out of reach by choice, not by gap.
