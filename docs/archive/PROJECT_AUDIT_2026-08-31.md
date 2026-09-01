# Project audit — 2026-08-31

Ninth audit. Baseline:
[PROJECT_AUDIT_2026-08-26-post-0.23.10](PROJECT_AUDIT_2026-08-26-post-0.23.10.md)
at 98.1/100, audited at `f58bb26` (0.23.10). **Aggregate now: 97.1/100**
(−1.0). Five releases landed since (0.23.11 → 0.23.15) plus two docs-only
commits; every line of changed code verified sound, most by execution. The
drop is almost entirely group 8: **the tag + Release ritual stalled again the
very release after it was backfilled** — v0.23.11–v0.23.15 have no tag and no
GitHub Release, the tag-currency advisory has been warning in CI on four of
them since 2026-08-30 without effect, and one of the five (0.23.12) was pushed
in a batch so **its sha never got a CI run at all** and the green-gate can
never pass it. The "advisory is enough at this volume" exclusion from the last
three reports has now met its own revisit trigger.

## Method & bounding

Delta pass per the skill: `git diff f58bb26..HEAD` (HEAD = `afb431e`) —
**39 files, +623 / −155** across seven commits, plus an **uncommitted working
tree** (harness-audit run 3: `docs/archive/HARNESS_AUDIT_2026-08-31.md` new;
`skills/harness-audit/references/{sources,stack}.md` and their `.claude/`
mirrors, 4 files +68/−28). Code byte-identical to the tree verified on 08-26
carries by identity: `install.mjs`, all eight handler bodies except
`stop-gate.mjs` (header comment only — body unchanged, read in full), all
skill bodies except `harness-audit` (two mirror paragraphs + `${CLAUDE_SKILL_DIR}`
path), CI workflow outside the unchanged step list, CONTRIBUTING, PERMISSIONS,
PLAYBOOK, the adapter validator. Read in full: the `check-tag-currency.mjs`
B3-46 hunk, the `smoke-hooks` trailing-newline fix, `skill-lint`'s two new
allowed keys, `skill-evals`'s `--delta` block, `inventory.mjs`'s
settings-aware discovery, the `harnessAudit.kitSourcePath` schema addition,
both `hooks.json` files' `asyncRewake: true`, `stop-gate.mjs`, the five new
CHANGELOG entries, every README/SECURITY/BACKLOG/deck hunk, and the
uncommitted reference-file diff.

Live checks run this pass (none inherited; exit codes captured un-piped after
a first pass that had masked them behind `| tail`):

- **Full local gate green by execution**: root `--check` → 36 files in sync
  at 0.23.15; `skill-lint` → 10 skills 0/0, budget **855/900**;
  `skill-evals` → 30 scenarios · 94 anchors 0/0; `smoke-hooks` → **151**
  asserts incl. `installer-hooks.json ≡ hooks.json` parity (which is what
  makes the 0.23.12 "wired identically" claim true — `asyncRewake` is inside
  the deep-equal) and the 31-event decision-log completeness assert;
  `smoke-installer` → all green (merge deep-equals `installer-hooks.json`
  entries, so the installed `settings.json` carries `asyncRewake` — verified
  by grep at `.claude/settings.json:94`); `check-version` → 0.23.15 × 6
  sites; `skill-evals --report --delta` → run sheet renders Run A / Run B /
  "Computing the delta" blocks as the CHANGELOG describes.
- **`check-tag-currency.mjs` (local)** → *Advisory: 4 shipped version(s)
  have no matching git tag: v0.23.14, v0.23.13, v0.23.12, v0.23.11* (0.23.15
  exempt as newest). The same step ran in CI on `afb431e` (step present in
  the windows/node-22 job log). `git tag` stops at **v0.23.10**;
  `gh release list` Latest = **v0.23.10** (2026-08-26).
- **`check-release-ready.mjs` per untagged sha**: `0082a38` (0.23.11) green
  8/8 · `6e7a0b0` (0.23.13) 6/6 · `34186ee` (0.23.14) 6/6 · `5a6fa5a`
  (0.23.15) 6/6 · **`33661c7` (0.23.12) → exit 1, "No check runs found"**.
  `gh run list --commit 33661c7` → 0 runs; the commits/check-runs API → 0.
  Cause by timestamps: 0.23.12 committed 12:14, 0.23.13 at 13:58, pushed
  together — GitHub runs push-triggered CI on the push head only. `ci.yml`
  has no `workflow_dispatch`, so the sha cannot be re-run after the fact.
- **CI per commit**: green on every commit that *has* a run in the window
  (`f696e6a` → `afb431e`, both CI and CodeQL). Dependabot Updates alive
  weekly (08-09/16/23/30, all success). No Dependabot PRs opened — nothing to
  bump; the two actions are at current pins.
- `gh api …/code-scanning/alerts?state=open` → **0**;
  `…/dependabot/alerts?state=open` → **0**; `…/secret-scanning/alerts?state=open`
  → **0**; push protection **enabled**. Issues **0** · PRs **0** (B4-16 demand
  gate shut). Community profile 71%: CoC, issue template, PR template absent
  (standing exclusion).
- **Authorities re-fetched, not recalled**: harness changelog head
  **2.1.252** (raw fetch; `PreModelSwitch`/`PostModelSwitch` sit under the
  2.1.251 heading, line 12 — README/BACKLOG's attribution is correct). No
  root-resolution entry. Hooks-doc detail (33 events, 11 `additionalContext`)
  taken from today's harness-audit fetch, same date. Local harness 2.1.251.
- **`install.mjs --help`** reproduced against the README flag list — every
  documented flag present, merge source named as `installer-hooks.json`.

## Scores

| # | Group | 08-26 (8th) | Now | Movement |
|---|-------|------------:|----:|----------|
| 1 | Lifecycle skills | 98 | 97 | 0.23.13/14/15 verified; `project-audit`'s closing "run `/checkpoint`" became unexecutable in 0.23.13 (−1) |
| 2 | Inception skills | 96 | 96 | frontmatter-only change; standing deductions carry |
| 3 | Adapter contract | 100 | 100 | `harnessAudit.kitSourcePath` lands schema-described, closed-key, optional |
| 4 | Installer | 98 | 98 | byte-identical; standing won't-fix + DX nit |
| 5 | Hooks & automation | 100 | 97 | two harness events unjudged (−2, B1-48); drift-guard redirects post-edit (−1) |
| 6 | Testing & CI | 99 | 98 | delta tooling shipped but no full lift measurement (−1); standing −1 |
| 7 | Security & supply chain | 99 | 99 | three alert APIs at zero, push protection on; standing −1 |
| 8 | Versioning & release | 97 | 93 | row 46 polish verified (+1); five untagged again (−3); a CI-less release sha (−1); five entries without Verification paragraph (−1) |
| 9 | Docs & showcase | 98 | 97 | always-loaded figure is the portable worst case, not the Claude-Code cost (−1); standing −2 |
| 10 | Public surface & governance | 96 | 96 | Releases staleness scored in 8; standing exclusions |

**Aggregate: 97.1/100** (was 98.1).

## Named deductions

**1 · Lifecycle skills — 97**: Test −1 — `live-verify`/`tidy`/`dep-check`
have no in-repo-shaped trials (standing). Corr −1 — checkpoint's
context-health arithmetic is judgment prose (standing, by design). **New:
Corr −1** — `project-audit` step 5 ends "Then run `/checkpoint` (standing
agreement)" (`SKILL.md:132`), but 0.23.13 put `disable-model-invocation:
true` on `checkpoint`, and the harness now refuses a model-initiated
invocation outright (observed live at the end of this pass: "cannot be used
with Skill tool due to disable-model-invocation … do not replicate this
skill's workflow"). The instruction is unexecutable as written and the
frontmatter change that broke it shipped without sweeping the bodies that
name the skill (→ row 54; skill-body edit ⇒ version bump, so not fixed
inline). Verified this pass: `disable-model-invocation: true` on the five side-effect skills
and `effort: high` on the two audits match the skills reference the
harness-audit re-fetched today; `harness-audit`'s `allowed-tools` pattern now
covers the exact command its body issues (`${CLAUDE_SKILL_DIR}`); the
kitSourcePath mirror instruction closed a real self-audit gap (0.23.14's
"fixes reverting on reinstall") and the uncommitted reference files are the
first evidence of it working — both files carry today's date in source *and*
mirror, with `--check` green.

**2 · Inception skills — 96**: carried — trials not repeatable (−2), no
in-kit worked example (−1), density (−1; `project-adopt` ≈2.7k tokens,
watch-don't-split).

**3 · Adapter contract — 100**: `harnessAudit.kitSourcePath` is optional,
`additionalProperties: false`, described, and consumed by exactly the skill
that names it. The schema-validated route (`--adapter`) and the `--check`
advisory both cover it by construction (object-schema recursion verified in
0.23.2). Nothing left.

**4 · Installer — 98**: Sec −1 — settings.json rewritten in place, no backup
(standing won't-fix). DX −1 — flag micro-semantics beyond `--help`
(standing). Byte-identical this window.

**5 · Hooks & automation — 97**: **Compl −2** — the harness documented two new
events on 2026-08-30 (`PreModelSwitch`, `PostModelSwitch`); the kit's
decision log, `EVENT_SURFACE` pin, README, deck, and manifest
`reviewedAgainst` all say 31 of what is now 33. The tripwire design worked
(harness-audit's changelog re-fetch found them the next day and row B1-48
exists), so this is an open row, not a design gap; both events are
non-advisory (decision-only / display-only), so the verdicts are reject /
reject and the 11-event `additionalContext` count is unchanged.
`marketplace.json`'s entry description ("five advisory hooks (advise, never
block)") predates the 0.23.0 enforcement trio and folds into the same
refresh. **Compl −1** — `skill-drift-guard` fires on `PostToolUse`, i.e.
after the wrong-directory edit has already landed; today's graded pass
observed the wasted edit live. A `PreToolUse` `Edit|Write` twin on the same
path match would redirect first (→ row 53). Verified this pass:
`stop-gate.mjs`'s `asyncRewake` wiring is present in all four wiring sites
(plugin, installer, dogfood `settings.json`, dogfood `hooks.json`) and the
handler body is unchanged — the semantics change is entirely in the harness's
handling of exit 2, which today's hooks-doc fetch confirms ("runs in
background and wakes Claude on exit code 2").

**6 · Testing & CI — 98**: Test −1 — README ⇄ `--help` prose sync beyond
the merge-source line has no automation (standing). **Test −1** — the
`--delta` run sheet exists and a three-scenario Sonnet sample ran today (8/9
expected behaviors only with the skill, 2 rejects prevented, ≈+55% tokens),
but no full with/without pass is recorded, and the sample already found one
assertion (`dep-check` "reads release notes") that passes in both
configurations — by the reference method's own rule it measures nothing and
should be replaced (→ row 52). Both 2026-08 graded passes measured
compliance, not lift.

**7 · Security & supply chain — 99**: Test −1 — no scorecard / pin-audit
automation (standing, personal scale). Verified live: code-scanning,
Dependabot, and secret-scanning open-alert APIs all at zero; push protection
enabled; both actions SHA-pinned and Dependabot-watched weekly. The
handler-size tripwire ran inside the 151-green run with its 0.23.11
boundary fix (max actual 135 vs bound 140).

**8 · Versioning & release — 93**: recovered +1 — row 46 shipped: the
tagged/exempt split, the conditional "pending" suffix, and the zero-tag guard
all read correctly and the advisory's output in this repo is precise
(four named versions, newest exempt). **Corr −3** — **v0.23.11–v0.23.15
shipped with no tag and no GitHub Release**; Latest is v0.23.10 while the
plugin manifest, VERSION, and deck say 0.23.15. This is the second
consecutive stall (08-26 found v0.23.5–v0.23.9 the same way), it began one
release after the backfill, and the advisory built to prevent it has warned
on four consecutive green CI runs (`6e7a0b0` → `afb431e`) without changing
the outcome — an advisory nobody reads is not a control. Scored harder than
08-26's −2 because the mechanism meant to catch the class has now been
observed failing to. **Corr −1** — **0.23.12's sha (`33661c7`) has no CI run**:
it was pushed in the same push as 0.23.13, GitHub tested only the push head,
and `check-release-ready.mjs` correctly refuses it (exit 1, "No check runs
found"). The AGENTS.md atomicity rule ("a release commit is self-contained")
held, but its sibling — *one release per push*, so the release sha is the
one CI tests — is unwritten, and `ci.yml` has no `workflow_dispatch` to
green-gate a sha retroactively. Row 47's "on their CI-green shas" premise is
false for one of five (drift, fixed in BACKLOG this pass). **Compl −1** —
five consecutive CHANGELOG entries (0.23.11–0.23.15) end without the
Verification paragraph `AGENTS.md:17` requires; the rule is prose-only and
drifted five times in five releases — same shape as rows 39/44/45, same fix
class (→ row 50). Standing Compl −2 (hand ritual) is **replaced** by row 49:
the last three reports excluded release automation with the trigger "revisit
if the advisory fires repeatedly" — it has.

**9 · Docs & showcase — 97**: Test −2 — external links/badges checked by
hand, never by automation (standing). **DX −1** — the "always-loaded 855
tokens" figure (CHANGELOG 0.23.8, `skill-lint`, `inventory.mjs`) is the
portable worst case; on Claude Code the seven `disable-model-invocation`
skills' descriptions are not loaded (skills reference, fetched today), so the
harness-charged figure is ≈257 tokens — the kit's own instruments understate
its best property (→ row 51). Checked and held: six version stamps at
0.23.15; deck at 0.23.15/2026-08-31 with the stop-gate row and the "pinned
list + audit moves the pin" wording; README's handler table, `--delta`
sentence, and "31 events at the 2026-08-24 review" wording; SECURITY's
`asyncRewake` paragraph; the 0.23.12 "parity-checked" claim; the 0.23.10
Verification-note fix from last pass.

**10 · Public surface & governance — 96**: Compl −2 — no npm/`npx` channel
(B4-16, demand gate shut live). Compl −1 — no CoC / issue / PR templates
(community profile 71%; standing exclusion). Compl −1 — plugin payload ships
the whole repo (B4-31; plugins reference re-fetched today still has no
exclusion mechanism). The stale Releases page is scored in group 8.

## Drift findings

1. **`docs/BACKLOG.md` row 47** said all five untagged releases sit "on
   their CI-green shas" — `33661c7` (0.23.12) has no check runs at all
   (batched push). **Fixed in place** this pass: the row now names the
   CI-less sha and the decision it forces (tag on the visible-green
   neighbor's evidence with a note, or re-run CI via a new
   `workflow_dispatch` — row 49's first half).
2. **`docs/BACKLOG.md` row 48** sub-item "re-stamp `sources.md` changelog
   row (still 2.1.246)" — already done in the uncommitted harness-audit run
   (row reads `head 2.1.252`, dated 2026-08-31). **Fixed in place**: the
   sub-item now points at the pending commit instead of asking for the edit
   again; the `marketplace.json` description fix is folded into the row per
   the harness audit's proposal.
3. **`.claude-plugin/marketplace.json:14`** description: "five advisory hooks
   (advise, never block)" — stale since 0.23.0 (`plugin.json` already says
   "plus three opt-in enforcement hooks"). Packaging metadata, not a doc —
   **rowed** (B1-48), not edited here.
4. **CHANGELOG 0.23.11–0.23.15** lack the Verification paragraph AGENTS.md
   mandates — a gap against a stated rule, already inside row 47's scope;
   the mechanization is row 50.
5. **`skills/project-audit/SKILL.md:132`** instructs the model to run
   `/checkpoint`, which the harness has refused model-side since 0.23.13 —
   skill-body drift against the kit's own frontmatter. **Rowed** (B3-54),
   not edited: a body edit is a versioned change.

No `file:line` reference, count, or "verified" claim checked this pass was
wrong. README's status block pointed at the eighth report and the 08-25
harness score; refreshed this pass to the ninth report and the 08-31
harness run (96.1).

## Goals & gates re-check

- **Goals undrifted**: same portable-kit surface; 0.23.11–0.23.15 were
  polish, wiring semantics, frontmatter, and eval tooling — no scope change.
- **Watch — git-root resolution**: head 2.1.252 (raw fetch this pass); no
  entry. **Gate not lifted.**
- **B4-16 npm packaging**: demand gate shut (0 issues / 0 PRs, live).
- **B4-31 plugin payload**: no exclusion mechanism (plugins reference
  re-fetched today by the harness audit). Advised-against stands.
- **Release-automation exclusion**: revisit trigger ("the advisory fires
  repeatedly") **met** — four consecutive CI runs. Lifted into row 49.
- **Ecosystem currency**: two harness releases since the 08-26 pass; the one
  with kit consequences (2.1.251's two hook events) is rowed. 2.1.251's
  `env` restriction (project settings can't set `CLAUDE_CONFIG_DIR`/`TMPDIR`)
  doesn't touch the kit — it writes no `env`.

## Backlog

Ordered by breadth of value to downstream projects, then depth, then effort.
Bands: B1 do-next · B2 next after · B3 polish · B4 pivot-only.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 47 | release | Tag + Release v0.23.11–v0.23.15. Four shas pass `check-release-ready.mjs`; `33661c7` (0.23.12) has **no CI run** (batched push) and the gate refuses it — either tag it on the strength of its untested-but-superseded position with a Release note saying so, or land row 49's `workflow_dispatch` first and green-gate it retroactively. Backfill (or relax `AGENTS.md:17` for) the five missing Verification paragraphs | Versioning +4 | S |
| B1 | 48 | hooks | Verdicts for `PreModelSwitch`/`PostModelSwitch` (reject/reject — non-advisory); `EVENT_SURFACE` 31→33 shown failing first; README/deck/manifest "31" → 33 with the new review date; fix `marketplace.json`'s stale "five advisory hooks (advise, never block)" description | Hooks +2 | S |
| B2 | 49 | release-tooling | Release automation — the advisory has fired on four consecutive CI runs without effect: (a) add `workflow_dispatch` to `ci.yml` so any sha can be green-gated; (b) a `release.yml` on `workflow_run` (CI success, `main`) that, when `VERSION` has no `v<version>` tag, runs `check-release-ready` on that sha, cuts the annotated tag, and creates the Release titled `v<version> — <subject>` from the CHANGELOG entry; (c) AGENTS.md gains "one release commit per push" so the release sha is the one CI tests. Risk: an auto-cut tag on a green-but-wrong sha — mitigated by the same gate the hand ritual uses | Versioning +3 | M |
| B3 | 50 | release-tooling | Mechanize `AGENTS.md:17`: `check-version.mjs` (or a sibling) fails when any CHANGELOG entry ≥ v0.23.11 lacks a `Verification:` paragraph — the rule drifted five releases running with no tripwire | Versioning +1 | S |
| B3 | 51 | evals | Two-figure always-loaded budget: `skill-lint` and `inventory.mjs` print *portable* (all descriptions, keeps the 900 lint budget) and *Claude Code charged* (auto-invocable only, ≈257 today); README/deck quote both | Docs +1 | S |
| B3 | 52 | evals | Full delta-mode eval pass: all 30 scenarios `--report --delta` on one tier, archived as `SKILL_EVALS_<date>.md` with pass-rate lift + token cost; replace every assertion that passes in both configurations, starting with dep-check "reads release notes" | Testing +1 | M |
| B3 | 53 | hooks | `skill-drift-guard` PreToolUse twin: `PreToolUse` `Edit\|Write` advisory on the same `.claude/(skills\|hooks)/` match so the redirect precedes the wasted edit; keep the PostToolUse handler for Bash-path edits; record the verdict in `hooks.reviewed` either way | Hooks +1 | S |
| B3 | 54 | skills | `project-audit` step 5's "Then run `/checkpoint`" is unexecutable since 0.23.13 made `checkpoint` `disable-model-invocation` — reword to "ask the user to run `/checkpoint`" (or hand back a ready commit summary); sweep other bodies for model-side invocations of the seven guarded skills (grep this pass: only this one line) | Lifecycle +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — no exclusion mechanism exists (re-verified 2026-08-31). **Advised against** at current scale | Public +1 | L |

Plus the one remaining Watch row (git-root resolution; externally gated).

## Considered and excluded (visible decisions, no rows)

- **Standing exclusions re-affirmed unchanged**: in-repo trials for
  live-verify/tidy/dep-check, repeatable inception trials, README ⇄ `--help`
  sync automation, settings.json backup, CoC/templates/FUNDING, link checker
  in CI, scorecard automation, npm provenance, `claude plugin validate` as a
  gate step, per-skill `evals/` directories, the new frontmatter fields.
- **Making `check-tag-currency` a hard CI failure** — declined: it would
  redden every docs commit that follows an untagged release and train
  bypass; row 49 removes the human step instead of shouting louder about it.
- **Enabling GitHub's Dependabot *security* updates toggle** (currently
  disabled; version updates are on) — user-side one-click, no repo row; the
  only ecosystem is two SHA-pinned actions with zero open alerts.
- **Machine-local permissions hygiene** (`.claude/settings.local.json` dead
  entries — fourth reminder from the harness audit) — not a repo row.
- **Committing the harness-audit reference files as part of this audit** —
  declined: they are shipped skill content, so AGENTS.md's "behavior change ⇒
  version bump" applies (the 0.23.7 precedent); that is a release commit
  needing sign-off, not an audit side effect. The report file itself is
  docs and commits with this pass so the links above resolve.

## Verdict

The code shipped this window is clean — five releases, every changed line
read or executed, zero false claims in the docs — and the harness layer is a
day behind the ecosystem on exactly one axis with the row already open. What
cost a point is the same lesson for the third time in three weeks: the
release ritual has a prose half, and prose halves get skipped. 08-26 answered
"did you tag?" with an advisory; this pass finds the advisory fired four
times into a void while a fifth release shipped without ever touching CI.
Row 49 is the point where the kit stops asking a human to remember the tag
and starts cutting it from the same green signal the human was supposed to
check — the last hand-held invariant in an otherwise mechanized release
path. Everything else on the list is polish the kit's own audits proposed
against themselves.
