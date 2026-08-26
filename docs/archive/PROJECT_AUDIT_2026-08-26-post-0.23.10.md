# Project audit — 2026-08-26 (post-0.23.10)

Eighth audit, second of the day. Baseline:
[PROJECT_AUDIT_2026-08-26](PROJECT_AUDIT_2026-08-26.md) at 97.9/100, audited
at `08a52b0`. **Aggregate now: 98.1/100 — a new peak.** One release landed
since (0.23.10), closing both open rows from the morning pass: B1-44 (tag +
Release backfill with a mechanized tag-currency advisory) and B3-45 (the
SECURITY.md handler-size tripwire). Both verified closed by execution. The
pass found one hair of doc drift (fixed in place) and a small polish tail on
the brand-new advisory's messaging and edge cases — rowed, not inflated.

## Method & bounding

Delta pass per the skill: `git diff 08a52b0..HEAD` — **12 files,
+339 / −23**, two commits: the morning audit's own docs (`635eb4e`) and
0.23.10 (`f58bb26`). Code byte-identical to the tree verified this morning
carries by identity: all skills, all eight handlers, the installer, every
suite outside the one smoke-hooks hunk, CI outside the two-step hunk, all
community files. Read in full: `check-tag-currency.mjs` (new, 50 lines), the
smoke-hooks tripwire hunk, the ci.yml hunk (`fetch-tags: true` + advisory
step), the 0.23.10 CHANGELOG entry, and the README/deck/BACKLOG stamp hunks.

Live checks run this pass (none inherited):

- **Full local gate green by execution**: root `--check` → 36 files in sync
  at 0.23.10; `skill-lint` → 10 skills 0/0, budget **855/900**;
  `skill-evals` → 30 scenarios · 94 anchors 0/0; `smoke-hooks` →
  **151 asserts** (was 143 — the CHANGELOG's +8 claim reproduced: one
  line-bound assert per handler file); `smoke-installer` → all green
  (byte-identical suite); `check-version` → 0.23.10 × 6 sites;
  `check-tag-currency` → zero untagged tagged-era versions.
- **B1-44 verified live, not by narration**: `git tag` shows v0.23.0–v0.23.10
  complete; `gh release list` shows Releases for v0.23.5–v0.23.9 (backfilled
  13:13Z) plus v0.23.10 cut at 13:30Z — six minutes after its own CI went
  green — and **Latest now points at v0.23.10**. The ritual resumed for the
  new release itself, with the green-gate in the loop.
- **B3-45 verified by execution**: the tripwire ran inside the 151-assert
  green run; actual handler line counts max at **135** (checkpoint-autorun)
  against the documented 140 bound — the claim is true and now guarded.
- `gh api …/code-scanning/alerts?state=open` → **0**;
  `…/dependabot/alerts?state=open` → **0**. Issues **0** · PRs **0**
  (B4-16's demand gate re-confirmed shut). CodeQL green on both new commits.
- **CI conclusions per commit**: green on both commits in the window
  (`635eb4e`, `f58bb26`), both workflows. Dependabot weekly cadence was
  verified alive this morning (08-09/08-16/08-23); next run isn't due yet.
- **Authorities re-fetched, not recalled**: harness changelog head still
  **2.1.246** (raw fetch this pass) — zero harness releases since the 08-25
  full-surface verification. 2.1.246's plugin fixes (cache dirs, BOM'd
  plugin.json) don't touch the kit's verdict set; nothing on git-root
  resolution.

## Scores

| # | Group | AM (7th) | Now | Movement |
|---|-------|---------:|----:|----------|
| 1 | Lifecycle skills | 98 | 98 | untouched tree; standing deductions carry |
| 2 | Inception skills | 96 | 96 | untouched tree; standing deductions carry |
| 3 | Adapter contract | 100 | 100 | untouched |
| 4 | Installer | 98 | 98 | untouched; standing won't-fix + DX nit |
| 5 | Hooks & automation | 100 | 100 | untouched (tripwire reads handlers, changes none) |
| 6 | Testing & CI | 99 | 99 | +8 asserts land here; standing −1 unchanged |
| 7 | Security & supply chain | 98 | 99 | row 45 closed by execution (+1) |
| 8 | Versioning & release | 96 | 97 | backfill verified live (+2); new advisory's message/edge polish (−1) |
| 9 | Docs & showcase | 98 | 98 | one CHANGELOG-note nit, root-caused to group 8's tooling and fixed in place |
| 10 | Public surface & governance | 96 | 96 | Releases page now current (scored in 8); standing exclusions |

**Aggregate: 98.1/100** (was 97.9) — new peak for the chain.

## Named deductions

Groups 1–6, 9–10 carry the morning report's deductions verbatim — their code
and docs are byte-identical or stamp-only this window; see
[PROJECT_AUDIT_2026-08-26](PROJECT_AUDIT_2026-08-26.md). Movements:

**7 · Security & supply chain — 99**: recovered +1 — the SECURITY.md
line-bound claim class that drifted twice across prior audits is now
tripwired: one assert per handler file inside smoke-hooks, verified in the
151-green run with real counts (max 135 vs bound 140). Standing Test −1 —
no scorecard/pin-audit automation (personal-scale exclusion; SHA-pinned
actions, both alert APIs at zero live). Note without deduction: the tripwire
counts `split("\n")` including the trailing-newline element, so it fires at
an *actual* 139 lines — one line stricter than the documented "under 140".
Strictly conservative (can only false-positive, never miss), three lines of
real headroom today; boundary precision folded into row 46.

**8 · Versioning & release — 97**: recovered +2 — the five untagged releases
are backfilled with tags + Releases on their verified-green shas, Latest is
current, and the class is mechanized: `check-tag-currency.mjs` runs in CI
(with `fetch-tags: true` so it sees real tag state) and warns on any
tagged-era CHANGELOG version without a matching tag. Design is sound: newest
entry exempt (tags are cut post-CI by design), pre-v0.8.0 history exempt.
**New: Corr/DX −1** — the advisory's periphery is imprecise in three small
ways: (a) the success line counts all 38 prior entries as "tagged" when 12
are pre-tagging-era exempt (26 tagged + 12 exempt is the true split); (b) it
prints "v0.23.10 pending its ritual tag" even when the newest *is* already
tagged, as it is right now; (c) with zero tags present at all — a fork's CI,
where GitHub copies no tags by default — `floor` is `undefined` and
`compareVersions` throws, failing the step hard instead of degrading
advisory-style. Detection logic is correct in this repo's CI today; the
polish is row 46. Standing Compl −2 — tag + Release remain a hand ritual
(standing exclusion at current volume; the advisory now watches the gap).

**9 · Docs & showcase — 98**: standing Test −2 (external links/badges checked
manually, never by automation) carries. The one drift found this pass — the
0.23.10 CHANGELOG verification note — is scored as part of group 8's −1
(same root cause: the script's conflated tally), and the note is fixed in
place this pass. Checked and held: the +8/143→151 assert claim, six version
stamps, deck at 0.23.10/2026-08-26, README's "nothing open" status true at
audit time.

## Drift findings

One, fixed in place: **CHANGELOG 0.23.10's verification note** read "reports
all 37 prior tagged-era versions tagged". The script tallies *all* prior
shipped entries (including the 12 pre-v0.8.0 exempt ones), so "tagged-era"
mislabels it — and the note's 37 was true only of the pre-entry run; with
the 0.23.10 entry in place it prints 38. Reworded to the time-stable form
("zero untagged tagged-era versions; pre-v0.8.0 history exempt"). The
message conflation that made the mislabel easy is row 46's code half.

## Goals & gates re-check

- **Goals undrifted**: same portable-kit surface; 0.23.10 added release
  mechanization, no scope widening.
- **Watch — git-root resolution**: head still 2.1.246 (raw fetch this pass);
  no entry on root resolution. **Gate not lifted.**
- **B4-16 npm packaging**: demand gate shut (0 issues / 0 PRs, live).
- **B4-31 plugin payload**: harness unchanged since the 08-25 verification
  (head 2.1.246) — exclusion-mechanism gate unchanged; advised-against
  stands.
- **Ecosystem currency**: zero harness releases since 08-25; all verdicts
  carry with today's head-check as evidence.

## Backlog

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B3 | 46 | release-tooling | `check-tag-currency.mjs` polish: success tally splits tagged vs pre-era-exempt (26/12 today, not "all 38 tagged"); "pending its ritual tag" suffix only when the newest is genuinely untagged; empty-tag-set guard (fork CI has no tags — degrade to an advisory note, don't throw). Plus the smoke tripwire's boundary: count actual lines (trailing-newline aware) so a 139-line handler — legal under "under 140" — doesn't false-fail | Versioning +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — no exclusion mechanism exists (re-verified 2026-08-25). **Advised against** at current scale | Public +1 | L |

Plus the one remaining Watch row (git-root resolution; externally gated).

## Considered and excluded (visible decisions, no rows)

- **All morning-pass exclusions re-affirmed unchanged**: in-repo trials for
  live-verify/tidy/dep-check, repeatable inception trials, README ⇄ `--help`
  sync automation, settings.json backup, CoC/templates/FUNDING, link checker
  in CI, scorecard automation, npm provenance.
- **Full release automation (tag-push workflow)** — the advisory now exists
  and reported clean on its first CI runs; the revisit trigger stays "the
  advisory fires repeatedly", and it hasn't fired once.
- **Scoring the tripwire's strict boundary as a deduction** — declined; it
  can only fail safe, and row 46 tidies it.

## Verdict

The shortest delta in the chain and the first to set a new peak: one
release, both open rows closed, and both closures verified by running the
thing that now guards them — the tripwire inside the 151-assert green run,
the advisory against the real tag state it just repaired. The Releases page
tells the truth again, and for the first time the repo would notice on its
own if it stopped. What's left is exactly one S-effort polish row on
day-one tooling, two demand-gated B4s, and the externally-gated watch —
the remaining distance to 100 is either deliberate (personal-scale
exclusions) or waiting on someone else's release notes.
