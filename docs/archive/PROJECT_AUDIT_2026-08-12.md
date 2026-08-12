# Project audit — 2026-08-12

Third audit. Baseline:
[PROJECT_AUDIT_2026-08-09-post-B3](PROJECT_AUDIT_2026-08-09-post-B3.md) at
96.9/100, audited at `8db3003` (v0.11.0). **Aggregate now: 97.4/100.**

## Method & bounding

Diff-bounded per the skill: `git diff 8db3003..HEAD` (HEAD = `07d1de9`), 13
files. `skills/`, `hooks/`, `adapters/`, and `docs/PLAYBOOK.md` are
**byte-identical** to the audited baseline tree (`manifest.json` moved only its
version stamp) — groups 1–2 and the hook-handler code surface carry the
baseline's findings by identity. The pass was spent on the 0.12.0 surface
(`install.mjs` §8 advisory, the two smoke suites, SECURITY/README/CONTRIBUTING)
plus everything time alone invalidates: the live gate, open-alert APIs,
external Watch gates, ecosystem currency, and the public on-ramp.

Live checks run this pass (not inherited):

- **Full local gate green by execution**: root `--check` → "installed copies
  match kit source (13 files)"; smoke-hooks **32** cases; smoke-installer
  **37** cases (the five 0.12.0 advisory cases included); check-version →
  stamps agree 0.12.0 × 5 sites. Doc'd counts (README, CONTRIBUTING, memory)
  match observed output exactly.
- `gh api …/code-scanning/alerts?state=open` → **0**;
  `…/dependabot/alerts?state=open` → **0** (APIs, not badges). CI + CodeQL
  `success` on `07d1de9`, `d1a3dec`, `c5bd3bc` via `gh run list --json` —
  automation alive on every recent commit, not merely configured.
- Issues 0 · PRs 0 (B4-16 demand gate re-confirmed shut) · topics ×5 live ·
  releases current through `v0.12.0` (Latest; body = full CHANGELOG entry).
- Dependabot config present (weekly, github-actions); both actions SHA-pinned
  with version comments (checkout v7.0.1, setup-node v7.0.0); zero pending
  update PRs.
- Harness changelog head **2.1.228** — no entries past today's doc-audit
  baseline, nothing on hooks/settings/root/`CLAUDE_PROJECT_DIR` → both Watch
  gates shut (changelog side).
- Hooks doc (code.claude.com/docs/en/hooks.md): exec form (`command` + `args`,
  per-element placeholder substitution) and `if`/`timeout`/`statusMessage`
  all still documented — the kit's wiring premise holds;
  `${CLAUDE_PROJECT_DIR}` still defined only as "the project root,"
  subdirectory launches unspecified → git-root gate shut (docs side).
- SECURITY.md trust note verified claim-by-claim against `hooks/` source:
  only `process.exit(0)` (exit 2 never used), no `child_process`, no network
  imports, reads = stdin event + `.claude/ai-dev-kit.config.json` only,
  `timeout: 10` on all four wired entries, exec form everywhere. One count
  claim wrong — see Drift.

## Scores

| # | Group | Post-B3 | Now | Movement |
|---|-------|--------:|----:|----------|
| 1 | Lifecycle skills | 96 | 96 | carried by identity |
| 2 | Inception skills | 95 | 95 | carried by identity |
| 3 | Adapter contract | 98 | 100 | B3-19 advisory re-validation shipped, verified by read + smoke ×5 + live run |
| 4 | Installer | 98 | 98 | advisory block correct; both standing exclusions re-affirmed |
| 5 | Hooks & automation | 98 | 99 | exec-form live-fire loop closed — both classes observed firing 2026-08-12 ×2 sessions |
| 6 | Testing & CI | 96 | 98 | B3-18 smoke gaps closed (cases read + suites run green) |
| 7 | Security & supply chain | 97 | 99 | B3-20 trust note shipped and verified claim-by-claim |
| 8 | Versioning & release | 98 | 97 | −1 new: v0.12.0 release title dropped the descriptive convention |
| 9 | Docs & showcase | 97 | 96 | −1 new drift (trust-note line count); Windows nit closed in-pass |
| 10 | Public surface & governance | 96 | 96 | carried; triage clean, automation live-verified |

**Aggregate: 97.4/100** (was 96.9). The 0.12.0 S-tail recovered every rowed
point it targeted (+2 adapter, +2 testing, +2 security, +1 hooks); the new
surface itself cost two fresh points (release title, one imprecise count in
the new trust note) — the honest churn of shipping.

## Named deductions

**1 · Lifecycle skills — 96**: carried whole by identity (Compl −2
live-verify/tidy web-app-shaped — standing exclusion; Test −1 no
in-repo-shaped trials for live-verify/tidy/dep-check; baseline component
deductions). Nothing time-invalidated it: hooks-doc fields current, harness
head unchanged.

**2 · Inception skills — 95**: carried whole by identity (trials recorded but
not repeatable; no in-kit worked example — both standing exclusions).

**3 · Adapter contract — 100**: the sole named deduction (no post-install
re-validation) closed by B3-19. Verified this pass: `install.mjs` §8 read —
advisory only when the config exists, unparseable JSON caught, violations
named with `config.`-prefixed paths, exit decision provably drift/stale-only
(§9 consults only those arrays); five smoke cases pin it; live root `--check`
quiet on the valid dogfood config. Nothing left that would benefit a majority
of consumers.

**4 · Installer — 98**: Sec −1 — settings.json rewritten in place with no
backup; explicit won't-fix stands (byte-stable merge, regression-tested, git
is the backup; revisit on a consumer report). DX −1 — micro-semantics
undocumented (duplicate value flags take last occurrence; `--check` ignores
`--adapter`); excluded as trivia. The new advisory block adds no deduction.

**5 · Hooks & automation — 99**: Test −1 (was −2) — the exec-form live-fire
observation the post-B3 pass found missing now exists: 2026-08-12 both hook
classes observed firing on Windows across two sessions (live-verify 3/3 then
1/1 Bash-tool commits; context-guard late-onset 2/8 then first-probe 7/7).
The remaining point: within-session onset/intermittency varies by session
(2.1.226 late-onset vs 2.1.228 immediate; changelog offers no attributable
fix) — harness-side, kit exonerated (hash-identical handlers, smoke green,
CI windows-latest), tracked by the hook-visibility Watch row, which owns the
observation protocol and reopening condition.

**6 · Testing & CI — 98**: B3-18's two baseline-named smoke gaps closed
(`npm install left-pad`; `git -c core.autocrlf=false commit`) — cases read in
source, suites run green this pass, passed-on-arrival honestly noted in the
CHANGELOG. Test −1 — README flag prose vs `--help` text has no sync
automation; excluded, cost exceeds breadth. DX −1 — CONTRIBUTING's suite
block is bash-shaped and silent about working on Windows; found still open
(the 0.12.0 CONTRIBUTING touch added the BOM note but the promised clause
didn't ride along) — **closed in-pass** per the recorded ride-along decision.

**7 · Security & supply chain — 99**: B3-20's two points recovered — the
trust note exists and every behavioral claim in it verified against source
this pass. Test −1 — no scorecard/pin-audit automation; standing exclusion at
personal scale (SHA-pinned actions + weekly dependabot + alert APIs cover the
practical surface).

**8 · Versioning & release — 97**: Compl −2 — tag + Release created by hand;
standing exclusion at current volume (five-site gate + root `--check` make
stamp drift impossible). DX −1 **new** — the v0.12.0 GitHub Release is titled
bare "0.12.0" where v0.10.1/v0.11.0 set a descriptive `v<ver> — <subject>`
convention; body is complete, title is the inconsistency → **B3-21**.

**9 · Docs & showcase — 96**: Test −2 — external links/badges verified
manually each audit, never by automation; standing exclusion. DX −1 — the
CONTRIBUTING Windows clause (same nit as group 6; closed in-pass). Docs −1
**new drift** — SECURITY.md claims handlers are "auditable in ~40 lines
each"; context-guard is 70 lines (the four are 35/36/45/70) — the only
checkable-count miss in an otherwise fully verified trust note; fixed
in-pass. Both in-pass closures return next audit for free.

**10 · Public surface & governance — 96**: Compl −3 — no npm/`npx`
distribution; B4-16, demand gate re-confirmed shut this pass (0 issues, 0
PRs). Compl −1 — no CoC / issue templates / FUNDING; standing exclusion at
personal scale. Everything a consumer hits is live-verified this pass:
quickstart flags match `--help`, badge workflow green, releases current,
alerts zero via API.

## Drift findings

1. **SECURITY.md** — "auditable in ~40 lines each" vs. a 70-line
   context-guard (35/36/45/70). Fixed in-pass: reworded to "in under 70
   lines each". Costed in group 9.
2. **BACKLOG hook-visibility Watch row** — carried only session 1's
   2026-08-12 observations ("one session", PostToolUse 2/8 late onset) while
   kit memory records session 2 (harness 2.1.228: both classes fired on
   their first probe, context-guard 7/7, live-verify 1/1, zero misses). Row
   advanced in-pass to the full two-session record. Not costed — the lag was
   hours old and the memory↔doc pointer contract explicitly names the
   BACKLOG as the public summary.
3. Everything else checked clean: README quickstart/flags vs `--help`,
   hook-table matchers vs `hooks.json`, smoke counts 32/37 vs docs vs
   observed output, deck stamps 0.12.0, CHANGELOG failing-first claims vs
   smoke source, installed.json vs manifest versions.

## Goals & gates re-check

- Goals undrifted: portable skill library + adapter contract + advise-only
  automation — the repo is what the README says it is. No scope creep in the
  0.12.0 surface.
- **B4-16 npm packaging**: demand gate shut (0 issues / 0 PRs, live). Stays
  B4.
- **Watch — git-root resolution**: changelog head 2.1.228 with no
  settings/root/`CLAUDE_PROJECT_DIR` entry; hooks doc still defines the
  placeholder only as "the project root," subdirectory launches unspecified.
  Gate not lifted; row stands.
- **Watch — hook-injection visibility**: both classes proven visible
  2026-08-12 ×2 sessions; open question is within-session onset variance
  (late-onset on 2.1.226, immediate on 2.1.228, no attributable changelog
  fix). Gate logic unchanged: a silent probe is an intermittency datapoint;
  only a full-session all-silent run matching 2026-08-09 reopens visibility.
- Ecosystem currency: hooks-config fields re-verified today (exec form,
  `if`/`timeout`/`statusMessage` unchanged); action pins current (Dependabot
  live, zero pending PRs).

## Backlog

New row this pass (band per repo convention B1 do-next → B4 pivot-only):

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B3 | 21 | release | Retitle the v0.12.0 GitHub Release to the descriptive `v<ver> — <subject>` convention its predecessors set, and pin the convention in one clause where releases are described (README Rules or CONTRIBUTING) | Versioning +1 | S |

Carried: B4-16 (npm packaging, demand-gated) and the two Watch rows — both
gates re-confirmed shut above.

## Considered and excluded (visible decisions, no rows)

- **settings.json backup before merge** — won't-fix stands; git is the
  backup. Revisit on a consumer report.
- **Release automation (tag-push workflow)** — manual + five-site gate
  suffices at current volume. (B3-21 is a title-convention fix, not
  automation.)
- **README ⇄ `--help` prose sync gate · link checker in CI** — cost exceeds
  breadth; both re-verified manually this pass.
- **CoC / issue+PR templates / FUNDING · scorecard automation** — standing
  exclusions at personal scale, re-affirmed.
- **Uninstall flag** — minority need; deletion paths documented.
- **npm provenance/SLSA attestation** — premature with no npm distribution;
  folds into B4-16 if that gate ever opens.

## Verdict

0.12.0 did what its CHANGELOG claims: every rowed S-tail point was recovered
and is now verified by execution in this pass — the adapter contract reaches
100, and hooks/security sit at 99 with their last points held by an external
harness question and a personal-scale exclusion. The two points the pass
newly named are the cost of shipping surface at all (a release title, one
rounded count in a new security note), and one of them is already fixed. At
97.4 with one S row, one demand-gated M, and two externally gated Watch rows,
the kit remains dormant-stable: nothing in-repo is actionable beyond a
one-line title edit, and the program's next real movement waits on a gate
opening.
