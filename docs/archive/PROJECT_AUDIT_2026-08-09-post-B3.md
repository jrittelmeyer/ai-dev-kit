# Project audit — 2026-08-09 (post-B3 re-score)

Second audit of the day, run after B1–B3 shipped whole (0.9.0 → 0.11.0).
Baseline: [PROJECT_AUDIT_2026-08-09](PROJECT_AUDIT_2026-08-09.md) at 90.4/100,
audited at `97c8eb0`. **Aggregate now: 96.9/100.**

## Method & bounding

Diff-bounded per the skill: `git diff 97c8eb0..HEAD` (HEAD = `8db3003`,
v0.11.0). `skills/` and `docs/PLAYBOOK.md` are **byte-identical** to the
audited baseline tree — groups 1–2 carry the baseline's findings by identity;
the pass was spent on the changed surface (hooks, installer, `.github/`,
governance docs, tracked `.claude/`, README/CHANGELOG/deck) plus the checks
time alone invalidates: open-alert APIs, external gates, ecosystem currency,
and the live public on-ramp. Calibration unchanged: graded against "the most
competently executed, robust starter of its kind available today," not against
the repo's history.

Live checks run this pass (not inherited):

- `gh api …/code-scanning/alerts?state=open` → **0**;
  `…/dependabot/alerts?state=open` → **0** (APIs queried directly, not badge
  conclusions). CI + CodeQL on `8db3003`: both `success` via `gh run view`.
- Issues 0 · PRs 0 (B4-16's demand gate re-confirmed shut) · topics ×5 live ·
  releases current through `v0.11.0` with full notes.
- Hooks-docs currency re-verified today (code.claude.com/docs/en/hooks.md):
  exec form (`args`) + per-element `${CLAUDE_PROJECT_DIR}` substitution
  documented — the B3-14 premise held before the flip shipped.
- Watch-row gate re-checked today via the docs + changelog: **not lifted** —
  `${CLAUDE_PROJECT_DIR}` is defined only as "Project root," docs silent on
  subdirectory launches, no related changelog entry through 2026-08-09.
- In-session hook probe: an `AGENTS.md` write, agent-memory edits, and a
  `git commit` — three matching events — produced **no observed hook
  injection this session**, while the 0.10.1 session recorded fires. Handlers
  and merge are proven by piped smoke on two OSes; the unproven layer is
  harness spawn/display for this session shape. Scored as a Test deduction in
  group 5 and banded **B1-17** (verify in a fresh session before treating
  "hooks live" as standing).

## Scores

| # | Group | Baseline | Now | Movement |
|---|-------|---------:|----:|----------|
| 1 | Lifecycle skills | 95 | 96 | +1 — recorded native dogfood trials (checkpoint ×3 closes, audit pair) |
| 2 | Inception skills | 95 | 95 | carried by identity |
| 3 | Adapter contract | 92 | 98 | B1-3: schema-validated at install, CI-exercised; dogfood adapter second live example |
| 4 | Installer | 86 | 98 | B2-7 stale-prune · B3-13 strict flags/`--help` · B1-4 idempotency gate · B2-6 merge net · B3-14 args-aware marker |
| 5 | Hooks & automation | 90 | 98 | B1-1 cwd config read · B3-12 stdin tolerance · B3-15 precision · B3-14 exec-form |
| 6 | Testing & CI | 85 | 96 | version gate, real idempotency assert, merge/override/garbage cases, floor matrix, badge |
| 7 | Security & supply chain | 91 | 97 | SECURITY.md + PVR, dependabot live, actions v7 pinned, zero open alerts (API-checked) |
| 8 | Versioning & release | 90 | 98 | tags v0.8.0…v0.11.0 + Releases, five-site CI gate, failing-first evidence in CHANGELOG |
| 9 | Docs & showcase | 93 | 97 | Node floor declared, deck claims true, zero drift found this pass |
| 10 | Public surface & governance | 87 | 96 | dogfood self-install tracked, governance files, topics/badge, clean triage surface |

**Aggregate: 96.9/100** (was 90.4). The backlog's "closing B3 recovers ~100 as
scored" held for the *named* deductions — every rowed point was recovered —
but a fresh pass at today's bar finds a small honest tail: one pending live
observation, two baseline-named smoke gaps that were never rowed, and two
polish items surfaced by the new surface itself.

## Named deductions (delta focus; baseline details carry for identical code)

**1 · Lifecycle skills — 96**: Compl −2 carried (live-verify/tidy lean
web-app-shaped; accepted scope, standing exclusion). Test −1 (was −2):
checkpoint and the audit pair now have recorded native in-repo trials via the
dogfood loop; live-verify/tidy/dep-check still have none that fit this repo's
shape. Remaining baseline component deductions carry by identity.

**2 · Inception skills — 95**: carried whole (trials recorded but not
repeatable; no in-kit worked example — both standing exclusions).

**3 · Adapter contract — 98**: Compl −2 — a user-edited
`.claude/ai-dev-kit.config.json` is never re-validated anywhere after
install; deliberate (user-owned, skills degrade gracefully), but a warn-only
schema advisory on `--check` (exit code untouched) would catch silent typos
for most consumers → **B3-19**.

**4 · Installer — 98**: Sec −1 — settings.json is rewritten in place with no
backup; parked deliberately: the merge is byte-stable and regression-tested,
and git is the backup in every real consumer (explicit won't-fix, revisit only
on a consumer report). DX −1 — micro-semantics undocumented (duplicate value
flags take the last occurrence; `--check` ignores `--adapter`); excluded as
trivia.

**5 · Hooks & automation — 98**: Test −2 — the harness-integration layer has
one verified session (0.10.1, string form) and one non-observing session
(today, three matching events, no injection seen), and exec-form firing has
zero live observations yet (docs + smoke + real merge all confirm, but the
loop isn't closed) → **B1-17**.

**6 · Testing & CI — 96**: Compl −2 — the two baseline-named smoke gaps are
still open: no dep-check case for `npm install <pkg>` (install-with-args
variant) and no live-verify case for `git -c k=v commit` (both regexes handle
them; neither is pinned by a test) → **B3-18**. Test −1 — no automation ties
README flag docs to the installer's usage text (stamps are gated; prose is
not); excluded — cost exceeds breadth. DX −1 — CONTRIBUTING's suite block is
bash-shaped (`/tmp/kit-scratch`); it works on Windows via Node path
resolution but doesn't say so; excluded as a nit.

**7 · Security & supply chain — 97**: Compl −1 / DX −1 — neither README nor
SECURITY.md states the consumer-side trust model for `--hooks` (you are
installing code that runs in your sessions: advise-only, pure Node, no
network, drift-guarded) — one sentence closes it → **B3-20**. Test −1 —
no scorecard/pin-audit automation; standing exclusion at personal scale.

**8 · Versioning & release — 98**: Compl −2 — tag + GitHub Release are
created by hand from the CHANGELOG; a tag-push workflow could automate.
Excluded at current volume: the five-site version gate + root `--check`
already make stamp drift impossible, and release cadence is human-paced.

**9 · Docs & showcase — 97**: Test −2 — external links and badges are
verified manually each audit, never by automation; standing exclusion
(link-checker cost exceeds breadth). DX −1 — the CONTRIBUTING Windows nit
above. **Zero drift found this pass**: README quickstart/flags verified by
execution today, deck slide claims (schema-validated · piped-event smoke on
two OSes · advise-never-block) all true, CONTRIBUTING suite = CI steps
exactly, stamps agree at 0.11.0 across all five sites, installed.json matches
manifest versions.

**10 · Public surface & governance — 96**: Compl −3 — no npm/`npx`
distribution; **B4-16**, demand-gated by design and the gate is verifiably
shut (0 issues, 0 PRs, no consumer signal). Compl −1 — no CoC / issue
templates / FUNDING; standing exclusion at personal scale.

## Drift findings

None. Every checkable claim spot-checked this pass matched code or live
state. (The one *observation* mismatch — hooks not visibly firing this
session — is a verification gap, not doc drift: no doc claims hooks fired in
this session.)

## Goals & gates re-check

- Goals unchanged and undrifted: portable skill library + adapter contract +
  advise-only automation; the repo is what the README says it is.
- **B4-16 npm packaging**: demand gate re-confirmed shut today (zero
  issues/PRs). Stays B4.
- **Watch (harness `CLAUDE_PROJECT_DIR` git-root resolution)**: re-checked
  2026-08-09 against current docs + changelog — placeholder documented only
  as "Project root," subdirectory behavior unspecified, no related changelog
  entry. Gate not lifted; row stands. Kit-side share remains closed (B1-1).
- Ecosystem currency: hooks-config fields re-verified today (exec form
  documented; `if`/`timeout`/`statusMessage` unchanged); action pins current
  (Dependabot: zero PRs pending).

## Backlog (new rows; bands per repo convention B1 do-next → B4 pivot-only)

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 17 | hooks/verify | Fresh-session live-fire check: one matching event in a new kit session must show exec-form hook injection; record verified-where. Silent again ⇒ harness investigation item (kit code exonerated by smoke) | Hooks +2 | S |
| B3 | 18 | testing | Close the two baseline-named smoke gaps: dep-check `npm install <pkg>` variant; live-verify `git -c k=v commit` | Testing +2 | S |
| B3 | 19 | installer/adapter | Warn-only adapter re-validation on `--check` (schema advisory, exit code unchanged — user-owned config stays unpoliced) | Adapter +2 | S |
| B3 | 20 | docs/security | Consumer trust note for `--hooks` in README/SECURITY: what installing hooks executes in your sessions (advise-only, pure Node, no network, drift-guarded) | Security +1, Docs +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — carried; opens on consumer demand (gate re-confirmed shut 2026-08-09) | Public +1 | M |

## Considered and excluded (visible decisions, no rows)

- **settings.json backup before merge** — git is the backup; a `.bak` litters
  every consumer on every install. Revisit only on a real consumer report.
- **Release automation (tag-push workflow)** — manual + five-site gate + root
  `--check` suffices at current volume.
- **README ⇄ `--help` prose sync gate · link checker in CI** — cost exceeds
  breadth; both re-verified manually each audit.
- **CoC / issue+PR templates / FUNDING · scorecard automation** — standing
  exclusions at personal scale, re-affirmed.
- **Uninstall flag** — minority need; deleting `.claude/skills/<kit>/` +
  `.claude/hooks/ai-dev-kit/` is the documented shape of the answer.
- **PowerShell-native CONTRIBUTING suite block** — works today via Node path
  resolution; a one-clause mention rides along the next docs touch.

## Verdict

The banded program did what it claimed: every deduction the baseline rowed is
recovered, verified by execution, and gated so it can't silently regress —
the installer and hooks moved from the weakest groups (86, 90) to the
strongest (98, 98), and the enforcement story (failing-first tests, five-site
stamps, alert-API checks, self-install drift gate) is now the repo's
signature. What separates 96.9 from 100 is a short, honest tail: one live
observation to close (B1-17), two never-rowed smoke cases (B3-18), two
one-sentence polish items (B3-19/20), and the two standing gates that are
outside the kit's control (npm demand; upstream `CLAUDE_PROJECT_DIR`
resolution). Nothing left in-repo is bigger than an S.
