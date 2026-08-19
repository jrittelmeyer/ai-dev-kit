# Project audit — 2026-08-19

Fourth audit. Baseline: [PROJECT_AUDIT_2026-08-12](PROJECT_AUDIT_2026-08-12.md)
at 97.4/100, audited at `07d1de9` (recorded `8498196`). **Aggregate now:
97.9/100.**

## Method & bounding

Diff-bounded per the skill: `git diff 8498196..HEAD` (HEAD = `cc52082`), 9
files — one behavior change (`skills/checkpoint/SKILL.md`, checkpoint 0.3.0,
plus its installed copy), five version-stamp sites, and three docs
(README/BACKLOG/deck). `hooks/`, `install.mjs`, `adapters/`, `.github/`, and
every other skill are **byte-identical** to the audited baseline tree — groups
2–4, 7, and the code surfaces of 5–6 carry the baseline's findings by
identity. The pass was spent on the 0.13.0 surface (checkpoint 0.3.0 and its
doc ripple) plus everything time alone invalidates: the live gate, open-alert
APIs, external Watch gates, ecosystem currency, and the public on-ramp.

Same-day note: a doc-audit ran earlier today (`cc52082`) and swept doc↔code
alignment. This pass independently re-verified the changed docs' checkable
claims and re-ran every live check below rather than inheriting that sweep.

Live checks run this pass (not inherited):

- **Full local gate green by execution**: root `--check` → "installed copies
  match kit source (13 files)"; smoke-hooks **32** cases; smoke-installer
  **37** cases; check-version → stamps agree **0.13.0 × 5 sites**. Doc'd
  counts (README, CONTRIBUTING, memory) match observed output exactly. Tree
  clean at `cc52082`.
- `gh api …/code-scanning/alerts?state=open` → **0**;
  `…/dependabot/alerts?state=open` → **0** (APIs, not badges). CI + CodeQL
  `success` on all three post-audit commits (`53a8e54`, `b0a0e58`,
  `cc52082`) via `gh run list --json`; a `Dependabot Updates` run also
  succeeded on `b0a0e58` — automation alive, not merely configured.
- Issues 0 · PRs 0 (B4-16 demand gate re-confirmed shut) · releases current
  through `v0.13.0` (Latest) — **all six releases now titled
  `v<ver> — <subject>`**, including the retitled v0.12.0: B3-21 verified
  live, in the release list itself.
- Harness changelog head **2.1.235**. Two adjacent-looking entries checked
  and distinguished: 2.1.232's `CLAUDE_CODE_PROJECT_DIR_NAME` is a
  config-directory naming knob for hosts, and 2.1.233's nested-git fix
  concerns trust confirmation — neither touches root *resolution* for
  `${CLAUDE_PROJECT_DIR}` nor hook-injection visibility → both Watch gates
  stay shut (changelog side).
- Hooks doc (code.claude.com/docs/en/hooks.md): `${CLAUDE_PROJECT_DIR}`
  still defined only as "the project root" (subdirectory launches
  unspecified; the doc now also notes the variable is exported to stdio MCP
  / plugin LSP servers — no bearing on resolution); exec form (`command` +
  `args`, per-element substitution) and `if`/`timeout`/`statusMessage` all
  still documented — the kit's wiring premise holds.

## checkpoint 0.3.0 — the one changed surface, verified

- Contract read in full diff: a handoff response now ends with
  `Launch: <model> @ <effort> — <why>` as the literal last line, mirrored at
  the top of the handoff file so it survives when only the file does.
  Rubric maps the §2 step-shape estimate onto the harness's current tier
  ladder: Mechanical → smallest tier @ low; Standard build → mid @ medium
  (high on concurrency/authz/money paths); Judgment → top @ high+; mixed
  steps split by session; ties on product code or quality scoring resolve
  upward. Coherent with the existing handoff structure (the mirror sits
  under the file's title; the five required prompt contents are untouched).
- Source and installed copies byte-identical (also pinned by root
  `--check`). Five stamps rode together (CI-gated). Manifest summary
  (checkpoint 0.3.0), README skill row, and deck card all match the new
  contract; CHANGELOG entry matches the diff claim-for-claim and honestly
  notes "no smoke surface" (skill-body prose has none).
- **Live trial exists**: the standing resume prompt in kit memory opens with
  a conforming `Launch:` line that correctly exercises the mixed-step rule —
  Mechanical (small tier @ low) for gate re-checks, with the audit branch
  explicitly relaunching top-tier @ high. This audit session is that
  branch's execution.

## Scores

| # | Group | 08-12 | Now | Movement |
|---|-------|------:|----:|----------|
| 1 | Lifecycle skills | 96 | 96 | carried; 0.3.0 is additive capability, live-trialed, no named deduction touched |
| 2 | Inception skills | 95 | 95 | carried by identity |
| 3 | Adapter contract | 100 | 100 | carried by identity |
| 4 | Installer | 98 | 98 | carried; both standing exclusions re-affirmed |
| 5 | Hooks & automation | 99 | 100 | onset-variance point closed by accumulated evidence (see below); Watch row stays as tripwire |
| 6 | Testing & CI | 98 | 99 | 08-12 in-pass CONTRIBUTING fix returns; only the excluded sync-automation point remains |
| 7 | Security & supply chain | 99 | 99 | carried; alerts 0/0 live |
| 8 | Versioning & release | 97 | 98 | B3-21 shipped and verified live (retitle + pinned convention + v0.13.0 conforms) |
| 9 | Docs & showcase | 96 | 98 | both 08-12 in-pass fixes return; zero new drift |
| 10 | Public surface & governance | 96 | 96 | carried; every consumer-visible check live-verified |

**Aggregate: 97.9/100** (was 97.4). No new deductions this pass — a first:
the 0.13.0 surface shipped clean (stamps, docs, release title all conforming
on arrival). Every remaining point maps to a demand-gated row, a standing
exclusion, or an explicit won't-fix.

## Named deductions

**1 · Lifecycle skills — 96**: Compl −2 — live-verify/tidy lean
web-app-shaped; standing exclusion (accepted scope). Test −1 —
live-verify/tidy/dep-check still have no in-repo-shaped trials (checkpoint,
the audit pair, and now checkpoint 0.3.0's launch line all do). Corr −1 —
checkpoint's context-health arithmetic is judgment prose, unfalsifiable;
kept as designed. Nothing time-invalidated the carry; the 0.3.0 rubric's
date-stamped ladder example is a currency surface, not a deduction (see
excluded list).

**2 · Inception skills — 95**: carried whole by identity (trials recorded
but not repeatable; no in-kit worked example; density — all standing
exclusions).

**3 · Adapter contract — 100**: carried by identity; advisory re-validation
re-observed incidentally this pass (root `--check` quiet on the valid
dogfood config).

**4 · Installer — 98**: Sec −1 — settings.json rewritten in place with no
backup; explicit won't-fix stands (byte-stable merge, regression-tested, git
is the backup; revisit on a consumer report). DX −1 — flag micro-semantics
undocumented; excluded as trivia.

**5 · Hooks & automation — 100**: the last point (within-session onset
variance, 99 at 08-12) is closed by the accumulated record: every session on
harness ≥ 2.1.228 — four consecutive through 2026-08-19, spanning
2.1.228 → 2.1.234 — fired **both** hook classes on their **first** probe
with zero misses (live-verify 1/1 · 2/2 · 1/1; context-guard 7/7 · every
write · 3/3). The one late-onset session is pinned to superseded 2.1.226 and
never recurred. Kit-side, nothing remained at all (handlers hash-identical,
smoke 32/32, CI green on windows-latest). The Watch row no longer backs a
deduction — it stays as the regression tripwire with its reopening condition
unchanged (only a full-session all-silent run matching 2026-08-09 reopens);
if it ever trips, the next audit re-costs the point.

**6 · Testing & CI — 99**: Test −1 — README flag prose vs `--help` has no
sync automation; excluded, cost exceeds breadth (re-verified by identity:
`install.mjs` unchanged, so the 08-12 manual match still binds). The 08-12
in-pass DX fix (CONTRIBUTING Windows clause) verified carried — byte-identical
since.

**7 · Security & supply chain — 99**: Test −1 — no scorecard/pin-audit
automation; standing exclusion at personal scale (SHA-pinned actions +
weekly Dependabot — observed alive this pass — + alert APIs cover the
practical surface).

**8 · Versioning & release — 98**: Compl −2 — tag + Release created by
hand; standing exclusion at current volume (five-site gate + root `--check`
make stamp drift impossible). B3-21's DX point recovered: v0.12.0 retitled,
convention pinned in README Rules, and v0.13.0 conformed on arrival.

**9 · Docs & showcase — 98**: Test −2 — external links/badges verified
manually each audit, never by automation; standing exclusion. Both 08-12
in-pass fixes (trust-note line count, CONTRIBUTING clause) verified carried.
Deck stamps 0.13.0 with an honest "current as of 2026-08-12" footer; zero
new drift found this pass.

**10 · Public surface & governance — 96**: Compl −3 — no npm/`npx`
distribution; B4-16, demand gate re-confirmed shut this pass (0 issues, 0
PRs, live). Compl −1 — no CoC / issue templates / FUNDING; standing
exclusion at personal scale. Everything a consumer hits was live-verified
this pass: release titles now uniform, badge workflow green on HEAD, alerts
zero via API, triage empty.

## Drift findings

**None.** First zero-drift pass in the program. Independently spot-checked
(not inherited from this morning's doc-audit): README hook paragraph vs. the
observation log; BACKLOG Watch rows vs. memory and vs. today's changelog
sweep; README skill row + manifest summary + deck card vs. the 0.3.0
contract; release-title claim vs. the live release list; smoke counts vs.
observed output; stamps vs. check-version. The two step-5 pointer updates
this pass makes (BACKLOG source line, README quality-bar paragraph) are
outputs, not drift.

## Goals & gates re-check

- Goals undrifted: portable skill library + adapter contract + advise-only
  automation. checkpoint 0.3.0 (a handoff recommends its own relaunch
  configuration) sits squarely inside the "token-lean, verification-first
  operating method" goal — no scope creep.
- **B4-16 npm packaging**: demand gate shut (0 issues / 0 PRs, live). Stays
  B4.
- **Watch — git-root resolution**: changelog swept through head 2.1.235 —
  the two adjacent entries (2.1.232 config-dir naming, 2.1.233 nested-git
  trust) explicitly do not concern root resolution; hooks doc still defines
  the placeholder only as "the project root." Gate not lifted; row stands.
- **Watch — hook-injection visibility**: no longer costed (group 5 at 100);
  row retained as tripwire. Gate logic unchanged: a silent probe is an
  intermittency datapoint; only a full-session all-silent run matching
  2026-08-09 reopens visibility. This session adds its own datapoints at
  checkpoint time (context-guard on the memory writes, live-verify on the
  audit commit); per protocol they extend the log either way.
- Ecosystem currency: hooks-config fields re-verified today; action pins
  current (Dependabot run observed green, zero pending PRs); the 0.3.0
  rubric's tier-ladder example is accurate as of late-2026.

## Backlog

**No new rows** — this pass found no new deductions. Carried, with gates
re-confirmed shut above:

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand | Public +1 | M |

Plus the two Watch rows (externally gated; the hook-visibility row now backs
no deduction — tripwire only). Backlog-doc edit this pass: source-pointer
refresh only.

## Considered and excluded (visible decisions, no rows)

- **checkpoint 0.3.0's date-stamped ladder example** ("Haiku < Sonnet <
  Opus < Fable, late-2026") — a deliberately self-aging string: the
  instruction is "the harness's *current* ladder," the example is dated so
  staleness self-identifies, and doc-audit's currency hunt owns the refresh.
  No deduction, no row.
- **settings.json backup before merge** — won't-fix stands; git is the
  backup. Revisit on a consumer report.
- **Release automation (tag-push workflow)** — manual + five-site gate
  suffices at current volume; release-title uniformity now proven by
  convention + live list, not tooling.
- **README ⇄ `--help` prose sync gate · link checker in CI** — cost exceeds
  breadth; both surfaces re-verified (by identity / live) this pass.
- **CoC / issue+PR templates / FUNDING · scorecard automation** — standing
  exclusions at personal scale, re-affirmed.
- **Uninstall flag** — minority need; deletion paths documented.
- **npm provenance/SLSA attestation** — premature with no npm distribution;
  folds into B4-16 if that gate ever opens.

## Verdict

0.13.0 shipped the way the kit says releases should ship: one surface, five
stamps together, docs refreshed in the same commit, release titled per the
convention it had just pinned, CI green, and the feature already live-trialed
by the very resume prompt that launched this session. The pass recovered four
points without writing a line of product code — two were 08-12 in-pass fixes
returning on schedule, one was B3-21 verified live, and one was the hooks
onset-variance question dissolving under four sessions of zero-miss evidence
across three harness versions. At **97.9/100** the remaining deficit is fully
accounted for: a demand-gated npm row (−3), and standing
exclusions/won't-fixes that are re-affirmed — not forgotten — each pass. The
program stays dormant-stable; the next real movement waits on a gate opening,
and every gate was re-checked shut today.
