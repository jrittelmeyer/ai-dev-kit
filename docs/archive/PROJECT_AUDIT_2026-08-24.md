# Project audit — 2026-08-24

Fifth audit. Baseline: [PROJECT_AUDIT_2026-08-19](PROJECT_AUDIT_2026-08-19.md)
at 97.9/100, audited at `cc52082`. **Aggregate now: 96.8/100** — a deliberate
*decrease*. Five feature releases (0.14.0 → 0.19.0) landed since the last pass;
the new surface is strong, but this audit found real doc drift and one genuine
currency gap that the previous "dormant-stable" framing had no way to see.
Scores are graded against the best conceivable product of this kind today, not
against the repo's own history.

## Method & bounding

Diff-bounded per the skill: `git diff cc52082..HEAD` (HEAD = `409143c`) —
**103 files, +5,924 / −1,305**. Effectively the whole tree moved: every skill
body was split into `references/`, two CI harnesses were added
(`skill-lint`, `skill-evals`), plugin packaging shipped, and two new skills
(`harness-audit`, `retro`) plus a fifth hook (`compact-reorient`) arrived.
**Nothing carried by identity** — this was a full pass, not a delta pass.

Live checks run this pass (none inherited):

- **Full local gate green by execution**: root `--check` → "installed copies
  match kit source (**33 files**)"; `skill-lint` → 10 skills clean, 0/0,
  description budget **897/900**; `skill-evals` → 10 skills · 30 scenarios ·
  **94 anchors** resolved, 0/0; smoke-hooks → **42 reported** (53 assertions
  actually run — see Testing); smoke-installer → **56** assertions;
  `check-version` → stamps agree **0.19.0 × 6 sites**. Tree clean at `409143c`.
- `gh api …/code-scanning/alerts?state=open` → **0**;
  `…/dependabot/alerts?state=open` → **0** (APIs, not badges). CI + CodeQL
  `success` on all five release commits; a `Dependabot Updates` run succeeded
  on `7fc59cc` — automation alive, not merely configured.
- Issues **0** · PRs **0** (B4-16 demand gate re-confirmed shut) · releases
  current through **v0.19.0** (Latest), all thirteen titled
  `v<ver> — <subject>` per the pinned convention.
- `harness-audit`'s `inventory.mjs` executed against the live tree; its
  measured table is the basis for the skill/hook figures above.
- **Authorities re-fetched**, not recalled: the hooks reference (raw markdown,
  283 KB, grepped directly), the plugin-marketplace guide, the plugins
  reference, and the skill-authoring rubric. Harness changelog head is now
  **2.1.241** (was 2.1.235).

### One claim checked and rejected

An intermediate read of the hooks doc reported that `additionalContext` is
"unavailable" on `PostToolUse` and `SessionStart` — which would make **four of
the kit's five hooks dead on arrival**. That was a summarization error, not
reality. Re-checked against the raw document: `SessionStart` is listed under
"Context only — `hookSpecificOutput.additionalContext` adds context for
Claude", and `PostToolUse`'s own section documents `additionalContext` as
"String added to Claude's context alongside the tool result", with a JSON
example matching the kit's exact output shape. **The kit's hook wiring is
correct.** Recorded here because the failure mode — an audit propagating a
plausible-but-wrong secondary reading — is exactly what this pass exists to
prevent.

## Scores

| # | Group | 08-19 | Now | Movement |
|---|-------|------:|----:|----------|
| 1 | Lifecycle skills | 96 | 98 | per-domain `references/` closed the "web-app-shaped" completeness gap |
| 2 | Inception skills | 95 | 95 | shared-by-copy conventions added, lint-guarded; standing exclusions unchanged |
| 3 | Adapter contract | 100 | 100 | schema grew; 4 fixtures × 3 smoke cases + enum gate |
| 4 | Installer | 98 | 97 | `--help` and docblock name the wrong `--hooks` source |
| 5 | Hooks & automation | 100 | 96 | harness event surface expanded to ~31; kit's decision log covers 2 |
| 6 | Testing & CI | 99 | 96 | smoke tally understates; graded eval tier never run; lint misses a spec rule |
| 7 | Security & supply chain | 99 | 97 | SECURITY.md misstates what `--hooks` wires |
| 8 | Versioning & release | 98 | 98 | six-site gate; five releases shipped conforming |
| 9 | Docs & showcase | 98 | 95 | pipeline diagrams and hook counts drifted in README + PLAYBOOK |
| 10 | Public surface & governance | 96 | 96 | marketplace shipped; plugin payload hygiene costs the recovered point |

**Aggregate: 96.8/100** (was 97.9).

## Named deductions

**1 · Lifecycle skills — 98**: Test −1 — `live-verify`/`tidy`/`dep-check`
still have no in-repo-shaped trials. Corr −1 — checkpoint's context-health
arithmetic is judgment prose, unfalsifiable; kept as designed. The prior
Compl −2 ("lean web-app-shaped") is **recovered**: `live-verify` now carries
five per-domain references (web · game · cli · library · data), `tidy` carries
`hygiene-recipes.md`, and `dep-check` carries nine-ecosystem registry recipes.

**2 · Inception skills — 95**: carried — trials recorded but not repeatable;
no in-kit worked example; density. `inception-shared.md` is duplicated by copy
across both skills, but `skill-lint` enforces byte-equality, so the smell is
guarded rather than latent.

**3 · Adapter contract — 100**: every field optional, unknown keys rejected
pre-write, four shipped fixtures each exercised install → idempotent re-run →
`--check`, advisory re-validation observed quiet on the valid dogfood config.

**4 · Installer — 97**: Sec −1 — `settings.json` rewritten in place with no
backup; explicit won't-fix stands. DX −1 — flag micro-semantics undocumented.
**New: DX −1** — `install.mjs`'s docblock (line 20) and `--help` output
(line 51) both say `--hooks` merges **`hooks/hooks.json`**. The merge source is
actually `hooks/installer-hooks.json` (line 268). `hooks/hooks.json` is the
plugin-form twin, `${CLAUDE_PLUGIN_ROOT}`-anchored — a consumer who follows
`--help` to hand-wire copies paths that cannot resolve outside a plugin
install. Behavior is correct; its self-documentation is not. → row 24.

**5 · Hooks & automation — 96**: **New: Compl −3** — the harness now documents
roughly **31 hook events** (`Setup`, `UserPromptExpansion`, `PermissionRequest`,
`PermissionDenied`, `PostToolUseFailure`, `PostToolBatch`, `MessageDisplay`,
`SubagentStart`, `TaskCreated`, `TaskCompleted`, `StopFailure`, `TeammateIdle`,
`InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`,
`FileChanged`, `WorktreeCreate`, `WorktreeRemove`, `PostCompact`,
`Elicitation`, `ElicitationResult`, `SessionEnd`, …). The kit's decision log
(`manifest.json` → `hooks.reviewed`) records verdicts for **two**: `PreCompact`
and `SessionStart(startup|resume|clear)`. PLAYBOOK #9 requires that active
*and* rejected automations be recorded; against the current surface that
doctrine is not met. Several unrecorded events are genuine candidates —
`Setup`, `UserPromptSubmit`, and `SubagentStart` all accept `additionalContext`;
`ConfigChange` matches on `skills`; `FileChanged` would catch manifest edits the
`Edit|Write|Bash` matcher misses. → row 23.
**New: Corr −1** — `compact-reorient.mjs` guards only on
`hook_event_name === "SessionStart"`, but the documented SessionStart payload
carries a **`source`** field (`startup|resume|clear|compact|fork`). The handler
therefore cannot enforce its own "compact only, deliberately not
startup/resume/clear" contract if the matcher is ever wrong — which is the
exact risk its comment claims to defend against. The smoke fixture omits
`source`, so it doesn't model the real payload either, and `fork` is a new
matcher value with no recorded verdict. → row 27.
Re-verified **true** this pass: `PreCompact` still cannot inject
`additionalContext` (it is a top-level-`decision` event), and the new
`PostCompact` has *no* decision control at all — so `SessionStart(compact)`
remains the correct mechanism. The kit's 0.16.0 reasoning holds.

**6 · Testing & CI — 96**: Test −1 — README ⇄ `--help` prose has no sync
automation; the standing exclusion **bit this pass** (deduction 4). **New:
Test −1** — `smoke-hooks.mjs` reports "42 hook smoke cases passed" while
actually running **53** assertions; the tally
(`cases + handlers × garbage + bomEvents + 1`) omits the 10 exec-form wiring
checks and the parity assert. The figure is quoted downstream — the
2026-08-23 harness audit records "smoke-hooks 42" — so the harness
under-reports its own coverage. → row 26. **New: Test −1** — the eval
harness's model-graded tier (`skill-evals.mjs --report`) has never been run or
archived. CI proves anchors still literally appear in a body; the authoring
rubric is explicit that evaluations are the source of truth for *effectiveness*,
and nothing yet tests whether a skill body produces the intended behavior.
→ row 28. **New: Test −1** — `skill-lint` does not enforce the spec's
reserved-word rule (`name` may not contain "anthropic" or "claude"); a skill
named `claude-tools` passes lint and is rejected by the harness. → row 29.

**7 · Security & supply chain — 97**: Test −1 — no scorecard/pin-audit
automation; standing exclusion at personal scale (SHA-pinned actions +
weekly Dependabot observed alive + alert APIs zero cover the practical
surface). **New: Docs −1** — SECURITY.md, the document that defines the trust
contract for what runs in a consumer's session, says `--hooks` "wires **four**
hook entries" (it wires **five** — `compact-reorient` shipped in 0.16.0) and
that handlers are "auditable in under **70 lines** each"
(`context-guard.mjs` is **74**). Fixed in this pass.

**8 · Versioning & release — 98**: Compl −2 — tag + Release created by hand;
standing exclusion at current volume. The gate now covers **six** stamp sites
(plugin manifest added), and all five releases this cycle shipped with stamps
agreeing and titles conforming on arrival.

**9 · Docs & showcase — 95**: Test −2 — external links/badges verified
manually each audit, never by automation; standing exclusion. **New: Docs −3**
— three drift findings, all fixed in this pass:
(a) README's pipeline block and PLAYBOOK #1's identical block both end
`→ periodic: doc-audit · project-audit`, omitting `harness-audit` and the
`post-milestone: retro` stage — while README explicitly calls `manifest.json`
→ `pipeline` the machine-readable form of that diagram, and the manifest lists
both. (b) PLAYBOOK #9 says "The **four** shipped hooks passed this review" —
five have. (c) README describes `--hooks` as merging `hooks/hooks.json`
(deduction 4). The pitch deck, by contrast, is **clean**: stamped 0.19.0 /
2026-08-24, all ten skill cards present, all five hooks listed correctly.

**10 · Public surface & governance — 96**: Compl −2 — no npm/`npx`
distribution; B4-16's demand gate re-confirmed shut (0 issues, 0 PRs, live).
Weight reduced from −3: the 0.17.0 plugin marketplace now serves the
ecosystem-native channel, so npx is a convenience, not the only door.
Compl −1 — no CoC / issue templates / FUNDING; standing exclusion at personal
scale. **New: Compl −1** — plugin packaging hygiene: the marketplace entry uses
`"source": "./"`, so the plugin *is* the repo root, and installation copies the
**entire repository** into every consumer's plugin cache — the 52 KB CHANGELOG,
`docs/archive/` audit history, `.github/`, `adapters/`, `install.mjs`, and a
complete duplicate skill tree under `.claude/skills/`. The plugin spec
documents **no** exclusion mechanism (no ignore file, no `files` field), so the
only fix is a repo restructure. → row 31 (B4, advised-against at current scale).
Verified correct: only `skills/` at the plugin root is scanned, so the
duplicate `.claude/skills/` tree does **not** double-load; `hooks/hooks.json`
auto-discovery and `"source": "./"` are both confirmed valid against the
current docs.

## Drift findings

Five, all doc-side; four fixed in this pass, one deferred to a row because it
lives in code.

| # | Where | Claim | Reality | Disposition |
|---|-------|-------|---------|-------------|
| 1 | README (pipeline block) · PLAYBOOK #1 | pipeline ends `periodic: doc-audit · project-audit` | `manifest.json` also lists `harness-audit` and `post-milestone: retro` | fixed in pass |
| 2 | PLAYBOOK #9 | "The four shipped hooks" | five | fixed in pass |
| 3 | SECURITY.md | "wires four hook entries"; "under 70 lines each" | five; `context-guard.mjs` is 74 | fixed in pass |
| 4 | README (`--hooks` bullet) | merges `hooks/hooks.json` | merges `hooks/installer-hooks.json` | fixed in pass |
| 5 | `install.mjs` docblock + `--help` | `--hooks` merges `hooks/hooks.json` | same as above | **row 24** (code, not a doc) |

Also refreshed, not drift but stale evidence: the BACKLOG Watch row on
`${CLAUDE_PROJECT_DIR}` quoted the hooks doc as defining the placeholder "only
as *the project root*". The doc now reads "**the project root where the session
started**" and adds an explicit worktree carve-out. Subdirectory launches remain
unspecified, so the gate stays shut — but the recorded quote was out of date.

## Goals & gates re-check

- **Goals undrifted.** The stated goal — a portable, adapter-parameterized skill
  library with advise-only automation, installable into any project type — is
  what the repo now is, more so than at the last audit: `projectType` fixtures
  cover four domains and every domain-specific mechanic loads on demand.
- **B4-16 npm packaging**: demand gate shut (0 issues / 0 PRs, live). Stays B4,
  now partially superseded by the marketplace.
- **Watch — git-root resolution**: changelog swept 2.1.235 → **2.1.241**; no
  entry touches root resolution (2.1.239's `metadata.pluginRoot` and 2.1.229's
  marketplace `command` sources are packaging, not resolution). Hooks doc
  wording moved but still doesn't specify subdirectory launches. **Gate not
  lifted**; row stands with refreshed evidence.
- **Watch — hook-injection visibility**: no full-session all-silent run
  observed; this session's own probes extend the log at checkpoint time. Row
  stays as tripwire, backing no deduction.
- **Ecosystem currency**: exec form, `if` (tool events only — the kit's
  `if: "Bash(git *)"` on PreToolUse is valid), `timeout`, and `statusMessage`
  all re-verified present. Skill frontmatter rules re-verified: `name` ≤64
  lowercase-hyphen, `description` ≤1024, body <500 lines, references one level
  deep, ≥3 evaluations — the kit's lint matches all but the reserved-word rule
  (row 29).

## Backlog

Ordered by breadth of value to downstream projects, then depth, then effort.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 23 | hooks | Re-review the harness's ~31-event surface; record an accept/reject verdict per event in `manifest.json`, wire any that clear the automation-review bar | Hooks +3 | M |
| B1 | 24 | installer | Fix `install.mjs` docblock + `--help` to name `hooks/installer-hooks.json`; add a smoke assert that `--help` names the real merge source | Installer +1, Testing +1 | S |
| B1 | 25 | skills | `harness-audit`'s documented `node scripts/inventory.mjs` fails from a project root (skill-relative path) — fix the body and the script's usage line | Lifecycle +1 | S |
| B2 | 26 | testing | `smoke-hooks` tally counts every assertion (53), not just the case arrays (42) | Testing +1 | S |
| B2 | 27 | hooks | `compact-reorient` guards on the payload's `source === "compact"`; smoke fixtures carry `source`; record a verdict for the new `fork` matcher | Hooks +1 | S |
| B2 | 28 | testing | Run and archive a model-graded `skill-evals --report` pass, so eval presence is effectiveness-backed rather than anchor-backed | Testing +1 | M |
| B3 | 29 | testing | `skill-lint` enforces the spec's reserved-word rule (`name` may not contain "anthropic"/"claude") | Testing +1 | S |
| B3 | 30 | docs | Add a `plugins-reference` row to `harness-audit`'s `sources.md` — the auto-discovery + version-management authority the packaging route depends on | Docs +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — `source: "./"` ships the whole repo; needs a restructure (no exclusion mechanism exists). **Advised against** at current scale | Public +1 | L |

Plus the two Watch rows (externally gated; hook-visibility backs no deduction).

## Considered and excluded (visible decisions, no rows)

- **`inventory.mjs` prefers `.claude/skills` over `skills/`, and lists each
  wiring file separately** (15 hook rows for 5 hooks in a repo carrying both
  source and dogfood install) — cosmetic; the trees are byte-identical, so the
  measured numbers are correct either way.
- **settings.json backup before merge** — won't-fix stands; the merge is
  byte-stable and regression-tested, git is the backup.
- **Release automation (tag-push workflow)** — manual + six-site gate suffices
  at current volume.
- **Link checker in CI** — cost exceeds breadth; links re-verified live.
- **CoC / issue+PR templates / FUNDING · scorecard automation** — standing
  exclusions at personal scale, re-affirmed.
- **Uninstall flag** — minority need; deletion paths documented.
- **`.claude/settings.local.json` dead entries** — machine-local, untracked,
  out of repo scope (noted at the 2026-08-23 harness audit).
- **npm provenance/SLSA attestation** — premature without npm distribution.

## Verdict

The score went **down**, and it should have. Between 0.14.0 and 0.19.0 the kit
roughly doubled its machinery — two CI harnesses, two skills, a fifth hook, a
packaging channel, per-domain references across every skill — and shipped all
of it with green gates and conforming stamps. That work is genuinely good: the
adapter contract holds at 100, the installer's 56-assertion regression net
covers merge/stale/advisory/fixture paths on two OSes, and the deck came
through five releases without a single stale claim.

What slipped is the connective tissue. Four documents that describe the system
fell behind the system — a pipeline diagram missing two stages it points at
`manifest.json` to prove, a security policy under-counting the hooks it wires,
and an installer whose own `--help` names the one file that must never ship.
None of it breaks a consumer today; all of it erodes the thing this repo sells,
which is that the docs can be trusted without reading the code.

The one finding that isn't cosmetic is the hook surface: the harness now offers
~31 events and the kit has recorded a verdict on two. That's not a defect in
what's built — the five shipped hooks re-verified correct against the current
contract, including the `PreCompact` reasoning that a lesser pass would have
rubber-stamped — it's a currency gap, and it is exactly what a periodic audit
is for. Row 23 is the real next step; everything else is small.
