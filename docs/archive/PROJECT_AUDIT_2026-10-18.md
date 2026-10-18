# Project audit — 2026-10-18

Tenth audit. Baseline: [PROJECT_AUDIT_2026-08-31](PROJECT_AUDIT_2026-08-31.md)
at 97.1/100, audited at `afb431e` (0.23.15). **Aggregate now: 96.3/100**
(−0.8). Subject: `d204c75` (0.24.9). Thirty-five commits and seventeen
releases landed in the window (0.23.16 → 0.24.9), and for the first time
since the release automation shipped every one of them was tagged by the
bot. The drop is not regression in anything previously verified — it is the
new code surface: two large additions (the `script-exec-guard` trio, 356
lines; the release automation, ~150 lines of YAML + scripts) and one large
rewrite (`inventory.mjs`, +475) had never been read by a project audit, and
reading them found a high-severity open CodeQL alert that has sat for six
weeks, five evasion classes in the one security-class hook, and two bugs in
the inventory script's own hook accounting.

## Method & bounding

Delta pass per the skill: `git diff afb431e..HEAD` (dogfood mirror excluded)
— **59 files, +3,854 / −242**. Data collection ran 2026-10-05/06; the live
forge checks were **re-run 2026-10-18** before writing (HEAD unchanged, one
new Dependabot PR). Code byte-identical to the tree verified on 08-31 carries
by identity: `install.mjs`, `docs/PERMISSIONS.md`, `check-tag-currency.mjs`,
`banned-api-guard`, `context-guard`, `compact-reorient`, `stop-gate`, all
skill bodies except the four touched (`harness-audit`, `live-verify` web
reference, `project-adopt`, `project-init`). Everything else was read.

Three parallel read-only reviews were fanned out on the never-audited code,
each instructed to reproduce before reporting; every finding carried into a
score below was re-run by the parent (file:line and the exact command in the
group sections) or taken from a quoted repro, never from a summary:

- `hooks/script-exec-guard.mjs` + `script-exec-parse.mjs` +
  `script-exec-scan.mjs` against the 0.24.0 contract and SECURITY.md.
- `.github/workflows/{ci,release}.yml`, `cut-release.mjs`,
  `check-release-ready.mjs`, `check-version.mjs` against AGENTS.md and
  README → Rules → Versioning.
- `skills/harness-audit/scripts/inventory.mjs` + `smoke-inventory.mjs`
  against the 0.23.21/0.23.22/0.24.3 claims.

Live checks (exit codes captured un-piped):

- **Full local gate green by execution** at `d204c75`: root `--check` 40
  files in sync at 0.24.9; `skill-lint` 10 skills 0/0, budget 855 portable /
  257 charged; `skill-evals` 33 scenarios · 100 anchors 0/0; `smoke-hooks`
  **225** asserts; `smoke-installer`, `smoke-inventory` (41 ok), `check-version`
  (6 sites) all green. Every adapter fixture (8) installs clean through the
  schema-validated route.
- **Alert APIs (queried, not badge-read)**: `code-scanning/alerts?state=open`
  → **1** (`actions/untrusted-checkout/high`, severity **error / high**,
  `.github/workflows/release.yml:18`, open since **2026-09-02**);
  Dependabot → 0; secret-scanning → 0; push protection enabled. The scheduled
  CodeQL run the previous session flagged as "failure" on `624de53` was
  **cancelled** (both Analyze jobs), not failed; every push-triggered scan in
  the window succeeded.
- **CI liveness**: 37 green / 3 red push runs since `afb431e`. The three reds:
  `33acf50` (a docs/adapter fix, 09-02), `fffac41` (**0.24.2**, 09-30) and
  `e020963` (**0.24.3**, 10-05) — the last two from one Windows-only local
  gate passing on a hard-coded `\` separator that Linux treats as part of
  the file name. Fixed test-only in `4f69655`, tagged v0.24.3.
- **Releases**: `gh release list` Latest = **v0.24.9**; tags v0.23.16 →
  v0.24.9 all present except **v0.24.2** (its sha never went green;
  `check-tag-currency` names it on every run, see group 8). Twelve tags in
  the window were cut by `github-actions[bot]`, none by hand.
- **Dependabot**: weekly runs alive (09-13 → 10-18, all success); first PR
  of the repo's life opened **2026-10-11** (`actions/setup-node` 7.0.0 →
  7.1.0), CI green on it, **untriaged for 7 days**. Issues 0. Community
  profile 71% (CoC, issue template, PR template absent — standing).
- **Badge + links**: CI badge renders "passing"; every README-internal link
  resolves (18 checked); the one external claim re-fetched
  (anthropics/claude-code#88462) exists and is open as described.
- **Authorities**: harness head 2.1.289 per the 2026-10-05 harness audit;
  local harness 2.1.282. `install.mjs --help` reproduced against the README
  flag list — every documented flag present.

## Scores

| # | Group | 08-31 (9th) | Now | Movement |
|---|-------|------------:|----:|----------|
| 1 | Lifecycle skills | 97 | 95 | B3-54 fixed (+1); `inventory.mjs` two bugs + untested sections (−3) |
| 2 | Inception skills | 96 | 96 | 0.24.1 cite-and-spot-check verified by graded pass; standing deductions carry |
| 3 | Adapter contract | 100 | 100 | two new fleet fixtures + `harnessAudit.kitSourcePath`; all 8 fixtures validate |
| 4 | Installer | 98 | 98 | byte-identical; standing won't-fix + DX nit |
| 5 | Hooks & automation | 97 | 94 | B1-48/B3-53/B1-58/B1-59 shipped (+3); `script-exec-guard` evasion classes + timeout fail-open (−6) |
| 6 | Testing & CI | 98 | 98 | B3-52 full delta pass (+1); two release shas red from a Windows-only pre-push gate (−1) |
| 7 | Security & supply chain | 99 | 93 | **open high-severity alert, six weeks, exploitable from a fork** (−5); no alert-monitoring loop between audits (−1) |
| 8 | Versioning & release | 93 | 97 | rows 47/49/50 shipped and proven over twelve bot-cut tags (+7); orphaned v0.24.2 (−1); non-idempotent cut (−1); unpaginated gate (−1) |
| 9 | Docs & showcase | 97 | 97 | B3-51 shipped (+1); six drift items found, five fixed in place (−1) |
| 10 | Public surface & governance | 96 | 95 | first Dependabot PR untriaged a week (−1); standing exclusions |

**Aggregate: 96.3/100** (was 97.1).

## Named deductions

**1 · Lifecycle skills — 95**: Test −1 — `live-verify`/`tidy`/`dep-check` have
no in-repo-shaped trials (standing). Corr −1 — checkpoint's context-health
arithmetic is judgment prose (standing, by design). **Corr −2** — the
harness-audit inventory script, now the audit's primary instrument, has two
bugs in the section it exists for: (a) `hooksFromFile`
(`inventory.mjs:123`) parses `settings.json` with a bare `JSON.parse`, so a
UTF-8 BOM, a JSONC comment, or a non-array event value **aborts the whole
report with exit 1** — reproduced: a BOM'd `{"hooks":{}}` → `exit=1`, losing
the Hooks, Standing-instruction and Memory sections the header promises
"never fail"; (b) the loaded-hook dedup key (`:208`) is
`event|matcher|handler` without `if`, and the handler regex (`:131`) only
recognises `*.mjs`, so the kit's **own** report says "10 hook(s) loaded"
against the 11 entries actually wired (the `PowerShell(git *)`
live-verify-reminder variant is silently merged), and a consumer with
`.sh`/`.py` or prompt-type hooks gets `?` rows that also make the drift
check vacuous. **Test −1** — `smoke-inventory.mjs` covers only the Memory and
Eval-presence sections, so neither bug has a test (→ row 64, which also
carries the smaller items: inline `plugin.json` hooks unseen despite the
0.23.22 claim, exit 1 with no skills dir, symlinked skill dirs skipped,
`*.json` in `skill-evals/` all treated as fixtures). Verified this pass:
B3-54's reword is in place and no body invokes a guarded skill; the 0.24.1
bundle-secret sweep earned both of its anchors in the 10-05 graded sample.

**2 · Inception skills — 96**: carried — trials not repeatable (−2), no
in-kit worked example (−1), density (−1; `project-adopt` ≈2.78k tokens,
watch-don't-split). The `--deep` cite-and-spot-check (0.24.1) earned 2/2
anchors and prevented 2/2 baseline regressions in the 10-05 graded sample.

**3 · Adapter contract — 100**: `ai-consulting.json` and
`nobody-promotes-the-plumber.json` join the fleet mirrors; all eight
fixtures install through the schema route with exit 0. Nothing left.

**4 · Installer — 98**: Sec −1 — settings.json rewritten in place, no backup
(standing won't-fix). DX −1 — flag micro-semantics beyond `--help`
(standing). Byte-identical this window.

**5 · Hooks & automation — 94**: recovered +3 — B1-48 (33-event pin), B3-53
(PreToolUse twin), B1-58 (PostModelSwitch re-recorded, 12 of 33), B1-59
(drift-guard write intent anchored per segment; `2>&1` no longer fires)
all verified by execution. **Sec −4 / Corr −1 / Docs −1** — the
`script-exec-guard` trio is sound in its contract shape (never exits 2,
never denies, malformed and BOM'd stdin exit 0, helpers-missing fails safe
to the crude scan, no git spawn on the silent path, ReDoS-linear on the
regexes checked, three files inside the 140-line bound) but the scanner
misses everyday forms and can be timed out: (i) `\rm -rf "$HOME"` and
`/bin/rm -rf "$HOME"` in an untracked script are **silent** — reproduced by
the parent with the exact event; the `VERB` prefix class
(`script-exec-scan.mjs:20`) excludes `\` and `/`, while the crude fallback
would have caught both; (ii) `ls "$HOME" | xargs rm -rf` is silent — the
piped-in check (`:46`) wants the text before `rm` to end in `|`; (iii)
`T+="/../.."` and `T="$(mktemp -d)/../.."` defeat the mktemp exemption
(`:108,:122`); (iv) a tracked script with a `-diff` gitattribute shows as
`Binary files … differ`, yields no `+` lines, and is treated as
tracked-clean (`script-exec-guard.mjs:69-78`); (v) `assigns()` is quadratic
(`script-exec-scan.mjs:105-123`): a 192 KB script under the 256 KB cap took
45.7 s, the wiring's `timeout: 10` kills the hook, and the harness proceeds
— **fail-open on the one input class the hook exists for**; (vi) an added
line starting with `++` is dropped as if it were the `+++ b/file` header
(`:76`), desyncing every later line number so the delete on the next line is
missed; (vii) the 256 KB and `node_modules` skips are silent evasions not in
the CHANGELOG's "Known limits", and the heredoc clause only fires for a
target with a script extension (`script-exec-parse.mjs:84`) although the
CHANGELOG promises heredoc-written scripts. The handler is opt-in and
defence-in-depth behind the harness's own `rm` guard, which is why this is
−6 and not a table-stakes failure (→ row 63; each item above is its own
failing-first fixture — the review's repros are the test inputs).

**6 · Testing & CI — 98**: Test −1 — README ⇄ `--help` prose sync beyond
the merge-source line has no automation (standing). Recovered +1 — B3-52's
full delta pass is archived (70/94 skill-earned; 23 free assertions replaced
in place) and the 10-05 sample on the three newest anchors was 4/4 + 3/3.
**Test −1** — two of the window's seventeen release shas went red in CI
(0.24.2, 0.24.3) from one defect a Linux run would have caught in seconds
(a hard-coded `\` in a smoke case); the lesson lives in the maintainer's
memory, not in CONTRIBUTING's "Before you push", which still describes a
single-platform local run (→ row 66).

**7 · Security & supply chain — 93**: Test −1 — no scorecard / pin-audit
automation (standing). **Sec −5** — `release.yml` is a textbook
pwn-request on a public repo: it triggers on `workflow_run` of CI, which
also runs for `pull_request` events from forks; its only guard is
`conclusion == 'success' && head_branch == 'main'`; a fork's default branch
*is* `main`; the job then checks out `workflow_run.head_sha` (the fork's
commit, fetchable from the base repo) with `permissions: contents: write`
and executes `.github/check-release-ready.mjs` and `cut-release.mjs` **from
that checkout** with a write-scoped `GH_TOKEN`. GitHub's own docs: a
`workflow_run` job "is able to access secrets and write tokens, even if the
previous workflow was not". CodeQL has said so since **2026-09-02** (alert
#1, severity high) — six weeks, two project passes' worth of releases cut
under it. Mitigations that soften but don't close it: first-time
contributors need a maintainer to approve their workflow run. Fix is two
conditions in the `if:` (`workflow_run.event == 'push'` and
`workflow_run.head_repository.full_name == github.repository`) — row 62,
**B1, first**. Evidence the branch check does work for the ordinary case:
the Dependabot PR's CI run on 10-11 fired `release.yml` and the job was
`skipped`. **Sec −1** — the alert went unnoticed because nothing between
audits reads the alert API: CI is `contents: read`, the release gate checks
check-run conclusions only, and the project-audit method is the sole
consumer of `code-scanning/alerts` (→ row 67). Verified live: Dependabot
and secret-scanning at zero, push protection on, both actions SHA-pinned,
Dependabot's first pin bump arrived as designed.

**8 · Versioning & release — 97**: recovered +7 — rows 47 (five tags
backfilled), 49 (automation) and 50 (Verification tripwire) all shipped
and **proven over twelve consecutive bot-cut tags** with zero hand cuts;
`check-version` enforces the Verification paragraph on every entry since
0.23.11; the one-release-per-push rule was followed through five releases in
one afternoon. **Corr −1** — **v0.24.2 is orphaned by design**: its sha went
red, 0.24.3 bumped `VERSION`, and `cut-release.mjs` only ever considers the
current `VERSION`, so no automation can ever tag it; `check-tag-currency`
names it on every CI run (local and run 37393682929) and AGENTS.md's rule
doesn't state the consequence or the manual recovery. **Robust −1** —
`cut-release.mjs:17-47` is tag → push → `gh release create`; a push that
succeeds followed by an API failure leaves a tag with no Release and every
re-run no-ops on "already exists"; nor does it check that an existing tag
points at the sha it was handed (the v0.23.17 bad-tag scenario would be
silently no-op'd today). **Robust −1** — `check-release-ready.mjs:28-34`
reads page 1 of `check-runs` only (default 30); at 7 check runs this is
latent, but a failing run on page 2 would be a false green. Nits folded into
row 65: self-exclusion keyed on `GITHUB_JOB` silently breaks if the job gets
a `name:`; Release titles run to 200 chars or end in a colon (v0.24.4).
Drift: the 0.23.17 CHANGELOG entry describes the gate order inverted
(fixed in place).

**9 · Docs & showcase — 97**: Test −2 — external links/badges checked by
hand, never by automation (standing). Recovered +1 — B3-51's two-figure
budget is in `skill-lint`, `inventory.mjs` and README. **Docs −1** — six drift
items, five fixed in place this pass (list below), one rowed (SKILL.md §1 of
`harness-audit` omits the standing-instruction section the script prints —
a versioned body edit, folded into row 64). Checked and held: six version
stamps at 0.24.9; deck stamps 0.24.9 / 2026-10-05; SECURITY's handler
contract (sizes, BOM strip in all 10, no `child_process` in any advisory
handler, timeouts 10/300/30); PLAYBOOK #9's ten-hook count; the 12-of-33
wording in README and manifest.

**10 · Public surface & governance — 95**: Compl −2 — no npm/`npx` channel
(B4-16, demand gate shut: 0 issues). Compl −1 — no CoC / issue / PR
templates (71%; standing exclusion). Compl −1 — plugin payload ships the
whole repo (B4-31; no exclusion mechanism as of the 10-05 harness audit).
**Compl −1** — the repo's first Dependabot PR (`actions/setup-node` 7.0.0 →
7.1.0, CI green) has been open and untriaged since 2026-10-11; the kit ships
a `dep-check` skill whose description names "triaging a Renovate/Dependabot
PR" as its trigger. No row — it is a one-click merge for the maintainer,
noted here so it is visible.

## Drift findings

1. **README hooks table** — three rows still showed the pre-0.24.4 matchers
   (`dep-check-nudge` `Edit|Write|Bash`, `live-verify-reminder` `Bash`,
   `skill-drift-guard` `Bash`) and the pre-0.24.7 drift-guard trigger list.
   **Fixed in place**: matchers now `…|PowerShell`, the two-entry `if`
   wiring explained, the anchored write-intent rule stated.
2. **README "Each skill carries three scenarios"** — `live-verify`,
   `project-adopt`, `project-init` carry four since 0.24.1. **Fixed**:
   "three or more".
3. **SECURITY.md "wires ten hook entries"** — `settings.json` carries eleven
   entries for ten handlers. **Fixed**: counts both, with the reason.
4. **CHANGELOG 0.24.3 "`smoke-inventory.mjs` (9 cases)"** — the file has ten
   (the submodule case 3b landed in the same commit). **Fixed in place**.
5. **CHANGELOG 0.23.17** said `release.yml` "reads `VERSION`, no-ops if
   already tagged, otherwise runs `check-release-ready.mjs`" — the YAML runs
   the gate first and the no-op lives inside `cut-release.mjs`. README
   already matched the YAML. **Fixed in place**.
6. **`skills/harness-audit/SKILL.md` §1** lists the script's outputs without
   the `## Standing-instruction file` section shipped in 0.23.21. Versioned
   body — **rowed** (64), not edited.

No `file:line` reference in README, SECURITY, CONTRIBUTING or the deck was
wrong. README's status block pointed at the ninth report; refreshed this
pass to the tenth and to the 10-05 harness run.

## Goals & gates re-check

- **Goals undrifted**: same portable-kit surface. 0.23.16–0.24.9 were
  release mechanics, eval tooling, one new opt-in guard, three small skill
  additions and PowerShell parity — no scope change.
- **Watch — git-root resolution**: re-checked 2026-10-05 at harness 2.1.289
  (ninth pass); definition unchanged, gate not lifted.
- **B4-16 npm packaging**: demand gate shut (0 issues; the one PR is a bot).
- **B4-31 plugin payload**: no exclusion mechanism (re-verified 10-05).
- **Release-automation**: the 08-31 revisit trigger was met and row 49
  shipped; this pass is the first to score the automation on evidence
  (twelve bot tags) rather than design. It works; the deductions above are
  its edges.
- **Ecosystem currency**: covered by the 10-05 harness audit (head 2.1.289;
  Mods, native plugin evals, Anthropic's directory all logged
  documented-not-adopted). Nothing there changes a score here.

## Backlog

Ordered by breadth of value to downstream projects, then depth, then effort.
Bands: B1 do-next · B2 next after · B3 polish · B4 pivot-only. Numbering
continues forward from 61.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 62 | ci-security | **Close the `release.yml` pwn-request (CodeQL alert #1, open since 2026-09-02).** Gate the job on `github.event.workflow_run.event == 'push'` **and** `github.event.workflow_run.head_repository.full_name == github.repository` beside the existing branch/conclusion checks; keep `contents: write` as the only permission. Verify by (a) the alert closing on the next scan, (b) a throwaway fork PR from a branch named `main` showing the job `skipped`. Risk: none to the release path — every legitimate release is a push to `main` from this repo | Security +5 | S |
| B1 | 63 | hooks | **`script-exec-guard` hardening**, each item shown failing first with the review's repro as the fixture: `VERB` accepts `\rm` and `/bin/rm`; piped-in detection sees `xargs rm`; `+=` and a climbing mktemp RHS lose the exemption; `Binary files … differ` (a `-diff` attribute) counts as "all"; `assigns()` memoised or short-circuited at the first live hit so a 192 KB script scans inside the 10 s wiring timeout instead of failing open; `+++` skipped only before the first `@@`; the heredoc clause fires for an extensionless target; `timeout`/`nice`/`flock` added as wrappers. Document the 256 KB / `node_modules` skips and `cd "$HOME"; rm -rf .` as known limits in CHANGELOG and SECURITY. Stay inside the 140-line bound (split the scanner if needed) | Hooks +6 | M |
| B2 | 64 | harness-audit | **`inventory.mjs` robustness**: `hooksFromFile` goes through `readJson` with a BOM strip and degrades to an "unreadable: <file>" line instead of aborting; dedup key = full command/args + `if`; handler name falls back to the last path token for non-`.mjs` and prompt/agent hooks; inline `plugin.json` `hooks` read; no-skills-dir prints "Skills: none" and continues; symlinked skill dirs followed; only known fixture shapes read from `skill-evals/`. Smoke cases for the Skills and Hooks sections (today: Memory + Eval presence only). SKILL.md §1 names the standing-instruction section; `harness-audit` version bump | Lifecycle +3 | M |
| B2 | 65 | release-tooling | **`cut-release.mjs` idempotence + gate pagination + the orphan rule**: when the tag exists, compare `git rev-parse <tag>^{}` to the handed sha (fail loudly on mismatch) and fall back to `gh release view`/`create` so a tag-without-Release re-run completes; `check-release-ready.mjs` fetches `check-runs?per_page=100`; AGENTS.md's one-release-per-push rule states the consequence of a red release sha (the version is orphaned — cut the tag by hand on the fix sha or skip it with a CHANGELOG note) and `check-tag-currency` accepts a documented skip; comment the `GITHUB_JOB` self-exclusion in `release.yml`; cap Release titles and strip a trailing colon | Versioning +3 | S |
| B3 | 66 | ci | **CONTRIBUTING "Before you push" gains the Linux run** (`docker run --rm -v <kit>:/kit -w /kit node:22 …` over the gate array) with the reason — 0.24.2 and 0.24.3 both went red on ubuntu from a `\` a Windows-only run can't see; the lesson currently lives only in the maintainer's memory | Testing +1 | S |
| B3 | 67 | ci-security | **Alert monitoring between audits**: `check-release-ready.mjs` also queries `code-scanning/alerts?state=open` and refuses to cut a release while an alert of severity ≥ high is open (the Release job gains `security-events: read`); a weekly `schedule:` step in CI fails the same way. Today the alert API's only reader is a quarterly audit; this one sat through seventeen releases | Security +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — no exclusion mechanism exists (re-verified 2026-10-05). **Advised against** at current scale | Public +1 | L |

Plus the one remaining Watch row (git-root resolution; externally gated).

## Considered and excluded (visible decisions, no rows)

- **Standing exclusions re-affirmed unchanged**: in-repo trials for
  live-verify/tidy/dep-check, repeatable inception trials, README ⇄ `--help`
  sync automation, settings.json backup, CoC/templates/FUNDING, link checker
  in CI, scorecard automation, npm provenance, `claude plugin validate` as a
  gate step, per-skill `evals/` directories, the new frontmatter fields,
  Claude Mods, Anthropic's directory (all logged in the 10-05 harness audit).
- **Merging the Dependabot PR inside this audit** — declined: the audit is
  docs-only by contract; it is the maintainer's one click (the kit's own
  `dep-check` discipline applies — a pin bump from a trusted bot with CI
  green passes it).
- **Hard-failing `check-tag-currency` on the orphaned v0.24.2** — declined
  again; row 65 gives it a documented-skip path instead.
- **Rewriting `script-exec-guard` as a Claude Mod** (`tool.call` deny) —
  declined, per the 10-05 harness audit's verdict: in-process code with
  broader reach than the kit's one-screen handler contract.
- **Hand-tagging v0.24.2 during this audit** — declined: a tag is a release
  action with a Release note, not a doc edit; row 65 decides between tagging
  the fix sha and a documented skip.
- **Machine-local permissions hygiene** (`.claude/settings.local.json` dead
  entries — now a fifth reminder) — not a repo row.

## Verdict

The release ritual that cost the last two audits their points is fixed and
proven — twelve tags cut by the bot, none by hand, the Verification rule
mechanized — and every row the 08-31 report proposed has shipped. What this
pass found is the cost of the surface that shipped in the meantime: the
automation that made releases reliable also opened a write-token path to
anyone with a fork, and the one hook that exists to catch a dangerous script
can be walked around with `\rm` or outrun with a long file. Neither was
caught by the kit's own instruments — the alert sat behind an API nothing
reads between audits, and the hook's smoke suite tests the shapes its author
thought of. Row 62 is a two-line YAML change and should land before anything
else is pushed; row 63 is the guard earning the trust SECURITY.md already
extends to it. The rest is the same shape as every pass before it: polish
the kit's audits proposed against themselves.
