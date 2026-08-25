# ai-dev-kit changelog

## 0.23.0 — 2026-08-25

Fleet-audit upstream release: the 2026-08-25 five-consumer audit
(next-web-boilerplate · civicmatch · smash-gods · danger-noodles · wyrd,
report `docs/archive/FLEET_UPGRADE_PLAN_2026-08-25.md`) found four
consumer-built patterns that outperformed the kit — this release absorbs
them. First release with a blocking hook class: **opt-in only**, every
enforcement handler inert without the project's adapter `enforcement` key.

- **Three enforcement handlers** (wired by `--hooks`, inert without adapter
  opt-in): `stop-gate.mjs` (Stop — the session may not end with
  `enforcement.stopGate.commands` failing; generalized from the
  danger-noodles/smash-gods/wyrd originals), `banned-api-guard.mjs`
  (PostToolUse Edit|Write — path-scoped banned-pattern tripwire per
  `enforcement.bannedApis`; generalized from determinism-guard), and
  `checkpoint-autorun.mjs` (Stop — one autonomous checkpoint turn when idle
  with pending work, per `enforcement.checkpointAutorun`; ported from
  next-web-boilerplate). The manifest's Stop-event rejection is reversed to
  `partial` on consumer evidence via retro; hooks policy is now "advise by
  default — blocking only behind adapter opt-in" (SECURITY.md trust contract
  updated to match).
- **Adapter schema grows** `enforcement` (above), `docs.backlogHuman` (the
  dual-backlog split the game consumers run), and
  `contextBudget.skillDescriptionMaxTokens` (already live in
  next-web-boilerplate's config as an unknown key — now contractual; the nwb
  adapter fixture carries 909).
- **`install.mjs --check` distinguishes a never-installed dest** (no
  `ai-dev-kit.installed.json`) from real drift — it now says NOT INSTALLED
  with the install command instead of "DRIFT in 33 file(s): edit kit source",
  which was actively misleading advice for a fresh dest.
- **`optional/contrarian/`** — first optional asset: the plan-gate dissent
  subagent + `ExitPlanMode` nudge (consumer-proven in next-web-boilerplate
  and civicmatch), copy-once templates the project then owns; README with
  wiring snippet included. Smoke-held to the same fire/silent/garbage/BOM
  contract as installed handlers.
- **`dep-check` 0.2.2** — `references/registries.md` gains
  advisory-suppression hygiene: every audit-ignore carries an inline
  `# discharge YYYY-MM-DD -- <action>` comment, past-due discharges are
  findings, fail-closed CI checkers preferred (civicmatch's
  `check-audit-ignores` pattern).
- **`smoke-hooks` grows enforcement coverage** — fixture-driven cases for all
  three handlers (inert-without-config, loop guards incl. BOM'd
  `stop_hook_active`, block paths, TTL-lock rerun silence) plus the optional
  nudge; 133 asserts.

Verification: all five CI gates green locally on Windows (check-version — 6
stamps agree at 0.23.0; skill-lint — 10 skills clean; skill-evals — 30
scenarios, 94 anchors resolved; smoke-installer; smoke-hooks — 133 asserts,
every enforcement case fixture-driven with real spawned processes and a real
`git init` repo for checkpoint-autorun). `install.mjs --check` re-run against a
never-installed dest (smash-gods — the new NOT INSTALLED branch, exit 1) and
an installed consumer (wyrd — honest behind-kit DRIFT listing the 0.23.0
files, exit 1).

## 0.22.0 — 2026-08-24

Six S-effort rows from the 2026-08-24 project-audit + skill-evals passes
(B3-29, 30, 33, 34, 35, 36) — one enforcement rule, one new source row, and
three skill-procedure fixes.

- **`skill-lint` now enforces the reserved-word rule** — a skill dir name
  containing "anthropic" or "claude" (case-insensitive) fails CI. No existing
  skill violates it (row B3-29).
- **`harness-audit`'s `sources.md` gains a `plugins-reference` row** — the
  auto-discovery + version-management authority the packaging route (B4-16/31)
  depends on, fetch-verified against `code.claude.com/docs/en/plugins-reference`
  (row B3-30).
- **`harness-audit` step 4's Packaging-currency axis is now gated behind
  step 2's PARTIAL/no-network branch** — an offline run skips scoring it
  instead of scoring from stale local knowledge, matching how the other
  ecosystem-dependent axes already behave (row B3-33).
- **`project-adopt`'s sign-off gate (§8) gains an explicit pre-sign-off
  check** — every disposition-map row's evidence label must match the
  reference grade recorded at intake (§1) before it's presented; the prior
  "marked as such" wording was a labeling instruction, not a guard
  (row B3-34).
- **`project-init`'s intake (§1) now checks for an existing product brief
  before the "neither provided" stop** — a bare re-run with an existing brief
  and no new input resumes from it instead of halting to demand fresh input
  (row B3-35).
- **`retro`'s instruction-file bullet now cross-references the Drop
  bullet** — a single memorable incident is Drop territory unless it recurs
  or generalizes into a statable rule, closing the ambiguity between the two
  routing options (row B3-36).

## 0.21.0 — 2026-08-24

Four S-effort cleanups from the 2026-08-24 project audit (rows B1-24, B1-25,
B2-32, B2-26) — a doc-drift sweep plus one behavior fix, no new surface.

- **`install.mjs` docblock + `--help` now name the real `--hooks` merge
  source**, `hooks/installer-hooks.json` — both previously said
  `hooks/hooks.json`, the plugin-form twin that never ships to an installer
  consumer. A consumer following `--help` to hand-wire hooks would have copied
  unresolvable `${CLAUDE_PLUGIN_ROOT}`-anchored entries. `smoke-installer` now
  asserts `--help` names the correct file and rejects the wrong one, so the
  prose can't drift again (row B1-24).
- **`harness-audit`'s inventory script usage fixed** — the skill body and the
  script's own usage comment documented `node scripts/inventory.mjs
  [projectRoot]`, which fails ("Cannot find module") when run from a
  consumer's project root because the path is skill-relative. Both now
  document the installed path,
  `.claude/skills/harness-audit/scripts/inventory.mjs` (row B1-25).
- **`live-verify-reminder.mjs` no longer false-fires across a newline** — its
  segment-boundary class `[^|&;]` excluded pipe/and/semicolon but not `\n`/`\r`,
  so a multi-line command with `git` on one line and an unrelated `commit`
  substring on another (e.g. `gh run list --commit`) matched as if it were a
  real `git … commit` invocation. `\n`/`\r` are now excluded too; a
  `smoke-hooks` case reproduces the false-fire against the old regex before
  asserting the fix (row B2-32).
- **`smoke-hooks`'s closing tally now counts every assertion actually run**,
  not the case-array literal it previously summed — it reported 47 while 59
  asserts (wiring, parity, config-override, decision-log checks) ran
  uncounted. A running `asserts` counter replaces the hardcoded formula, so
  the number in the CI log can no longer drift from what the script does
  (row B2-26).

## 0.20.0 — 2026-08-24

Hook event-surface re-review (row B1-23, the one substantive row from the
2026-08-24 project audit) plus the `SessionStart` payload guard (row B2-27).
PLAYBOOK #9 requires that active *and* rejected automations be recorded; the
harness had grown to 31 documented hook events while the kit's decision log
carried a verdict on two. That is a currency gap, not a defect in what was
built — and it is exactly what the periodic audit exists to catch.

- **`manifest.json` → `hooks.reviewed` now records an accept/reject verdict for
  all 31 events**, keyed by bare event name with matcher-level nuance in the
  verdict text. A new `reviewedAgainst` field names the source, the date, and
  the finding that organizes the whole pass: only **11** of the 31 events can
  return `hookSpecificOutput.additionalContext`. The other 20 can block, act on
  files, or notify the human — none of which is "advise the agent" — so the
  kit's advise-never-block policy rules them out by construction rather than by
  taste.
- **No new hooks.** Every candidate the audit named was weighed and rejected on
  the evidence: `ConfigChange(skills)` looked like the gap-closer for skills
  mutated outside the file tools, but it has no context channel and a blocked
  change surfaces no message to the user *or* to Claude; `FileChanged` catches
  changes no tool matcher sees, but its `systemMessage` never reaches the model;
  `Setup` fires only under `--init-only`/`-p --init`, never on a normal start;
  `SubagentStart` can inject context, but the one subagent risk is already
  caught post-hoc by `skill-drift-guard`. `Stop` — the checkpoint-nag question
  that has been answered informally since 0.2.0 — is now written down.
- **`hooks/compact-reorient.mjs`** — guards on the payload's `source` as well as
  `hook_event_name`, so a mis-wired matcher can no longer turn the hook into a
  per-session nudge (the exact risk its own comment claimed to defend against).
  The guard is deliberately negative: a payload with no `source` still fires, so
  a harness that omits the field cannot silently kill the hook. `fork` is
  excluded on purpose — a forked session inherits its parent's context, so its
  orientation is intact.
- **`.github/smoke-hooks.mjs`** — pins the 31-event surface and asserts the
  decision log covers it, that every verdict states a disposition, and that no
  event is wired in `hooks.handlers` while recorded as rejected. When the
  harness adds event 32, this is the tripwire that says the kit owes it a
  verdict, instead of the gap waiting for the next audit. Five new
  `compact-reorient` cases cover each `source` value; the BOM fixture now
  carries `source: "compact"` so it models the real payload.

Verification: the four `source`-guard cases and the decision-log assert were
each shown failing against the pre-fix tree first — `startup`, `resume`,
`clear`, and `fork` all fired the reorientation nudge, and the log reported 30
of 31 events unrecorded. Full gate green after: scratch install (35 files) →
idempotent re-run (0 written, 35 unchanged) → scratch `--check` (33 files) →
`skill-lint` (10 skills clean, 897 description tokens) → `skill-evals`
(10 skills · 30 scenarios · 94 anchors) → `smoke-hooks` (47) →
`smoke-installer` (56) → `check-version` (6 sites) → root `--check`.

## 0.19.0 — 2026-08-24

harness-audit inventory script (row B3-22, the second and last row from the
0.16.0 harness-audit baseline) — §1 of the skill asked for a cost split of
per-skill description/body sizes and wired hook events; before this, every
run hand-counted those from the working tree.

- **`skills/harness-audit/scripts/inventory.mjs`** — zero-dep, no network,
  report-only. Emits two markdown tables: per-skill description chars/≈tokens,
  body ≈tokens, and references/scripts files; and every wired hook
  event/matcher/handler across `hooks/hooks.json`, `hooks/installer-hooks.json`,
  and any installed `.claude/hooks/*/hooks.json`. Lives inside the skill
  (not `.github/`) because it travels with the skill into every project that
  installs `harness-audit` — a `.github/`-only script would only ever measure
  this repo.
- `harness-audit` 0.1.2 — step 1 now runs the script first and layers
  judgment (version, always-loaded/on-demand split, handler runtimes) on top
  instead of hand-counting from scratch.
- Not added to the CI `gate` array: it's a reporting aid the skill invokes on
  demand, not a pass/fail check.

Verification: `node skills/harness-audit/scripts/inventory.mjs .` against
this repo's own working tree — the description-token total it reports
(≈897) matches the harness-audit 0.18.0 baseline exactly, and the hooks table
lists all 5 handlers across all 3 wiring files (source ×2, installed ×1).
Full gate green: scratch install → idempotent re-run → scratch `--check` →
`skill-lint` → `skill-evals` (10 skills · 30 scenarios · 94 anchors) →
`smoke-hooks` (42) → `smoke-installer` (56) → `check-version` → root
`--check`.

## 0.18.0 — 2026-08-23

Per-skill eval scenarios (row B2-21) — the largest deduction on the
harness-currency baseline (Eval presence 78/100, −22) and the one genuinely
missing practice the first `harness-audit` found. Every other gate checked the
skill *surface*: `skill-lint` covers frontmatter shape, budgets, and reference
resolution; the smoke suites cover handler contracts and install behavior.
Nothing checked whether a skill *body* still says what it is supposed to say,
so a refactor could delete checkpoint's three-strikes rule or dep-check's
release-age window and leave CI green.

- **`.github/skill-evals/<skill>.json`** — 3 scenarios per skill, 30 total, 94
  anchored behaviors. Each scenario is one fixture serving two tiers: a
  `prompt`, the `expect[]` behaviors (each carrying a literal `anchor` into the
  skill body, or into a bundled file via `in`), `reject[]` rubric lines, and
  `decoys[]` — sibling skills the prompt must not route to.
- **`.github/skill-evals.mjs`** — zero-dep runner, `skill-lint`'s ERR/warn
  split. **ERR ⇒ exit 1:** unresolved anchors (the regression guard), coverage
  (every skill, ≥3 scenarios), fixture schema, anchors under 8 chars, decoys
  that aren't skills. **warn only:** the routing check — prompt-vs-description
  term overlap against each declared decoy, warning when a decoy *strictly*
  outranks the intended skill. A crude proxy by construction, so it never
  knife-edges the build; its value is collision detection across ten
  descriptions sharing one always-loaded budget.
- **`--report`** emits the model-graded tier as a run sheet (prompt + expected
  behaviors + rejects, grouped by skill) for a manual or agent-driven pass.
  Deliberately not in CI: model grading there would mean an API key secret,
  per-run cost across four matrix legs, and nondeterministic reds.
- **`harness-audit` 0.1.1** — step 4 runs the eval runner alongside the linter,
  and scores Eval presence from the graded pass rather than from whether
  fixtures exist.
Verification: skill-evals **10 skills · 30 scenarios · 94 anchors**, 0/0 —
shown failing first, renaming checkpoint's `**Three strikes:**` heading reds
the run and names the behavior the anchor stood for; restored green. The gate
caught two of its own authoring defects: line-wrapped anchors in
`project-adopt` and `project-init` that matched no contiguous body text,
rewritten to single-line phrases. `--report` renders 436 lines over all 30
scenarios. Sampled graded pass across checkpoint · dep-check · project-adopt
(9 scenarios): every `expect` traces to a distinct body rule and every
`reject` is one the body actively forbids — though several expects restate
their rule closely enough that the model tier confirms the skill loaded more
than it probes judgment; sharpening that is fixture wording, not a gate
change. Full suite: skill-lint 10 skills 0/0 (descriptions unmoved at 897
tokens), smoke-hooks 42, smoke-installer 56, check-version **0.18.0 × 6
sites**, scratch install 34 files + idempotent re-run 0 written + `--check`;
self-install re-run wrote 3 (harness-audit body, adapter gate array, config
copy) and root `--check` green.

## 0.17.0 — 2026-08-23

Plugin-marketplace packaging — phase 4 closes the modernization program
(row B3-20). The kit is now installable two ways: the marketplace for Claude
Code consumers, the installer for any harness reading the Agent Skills
format. One route per project — README carries the choose-one warning.

- **`.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json`** —
  `/plugin marketplace add jrittelmeyer/ai-dev-kit` then
  `/plugin install ai-dev-kit@ai-dev-kit`. One plugin, `source: "./"` —
  the marketplace catalogs the same `skills/` + `hooks/` the installer
  ships. `plugin.json`'s `version` is the marketplace update signal and
  becomes the **6th version-stamp site** (`check-version.mjs` extended in
  the same commit; README/CONTRIBUTING/AGENTS.md now say six sites).
- **Hook wiring split by route** — the build-time check found the plugin
  loader auto-discovers `hooks/hooks.json` at the plugin root, so the
  installer-form file there would have loaded with dead
  `${CLAUDE_PROJECT_DIR}/.claude/…` paths for marketplace users. The plan's
  fallback shipped: `hooks/hooks.json` is now the **plugin form**
  (`${CLAUDE_PLUGIN_ROOT}/hooks/<handler>.mjs`, auto-discovered) and the
  renamed `hooks/installer-hooks.json` is the **installer form** — read by
  `--hooks` for the settings merge and shipped to consumers under the
  stable name `.claude/hooks/ai-dev-kit/hooks.json`. Handlers themselves
  are shared unmodified. smoke-hooks' exec-form net now asserts both files
  against their respective anchors **plus structural parity** (same events
  · matchers · handlers · if-clauses · timeouts, anchors aside);
  smoke-installer asserts the plugin-form file never ships and the shipped
  wiring carries no `${CLAUDE_PLUGIN_ROOT}`; skill-lint checks handler
  existence in both files.
- **B4-16 closed — superseded.** Marketplace plugins install from
  git/GitHub/npm sources without a registry account or publish pipeline,
  which serves the demand npm packaging was gated on; reopen only on
  explicit `npx`-install demand. Rows 18–20 have all shipped; the backlog
  holds the two harness-audit rows (21–22).
- README: dual-route install section; deck: marketplace step on the
  portability slide.

Verification: smoke-hooks 42 with the two-file exec-form net (10 anchored
entries) + the parity assert green; smoke-installer 56 (installer wiring
ships as hooks.json byte-identical to installer-hooks.json; plugin-form
never ships; 4 adapter fixtures × 3; enum-violation triple); skill-lint 10
skills 0/0; check-version **0.17.0 × 6 sites** (shown failing at 5/6 before
plugin.json was stamped); scratch install + idempotent re-run + `--check`;
self-install re-run refreshed the tracked dogfood copies; root `--check`
green. Marketplace-route live check: `claude plugin validate` where the CLI
offers it, plus the marketplace/plugin manifests parsing and pathing
verified against the current plugin docs fetched this session.

## 0.16.0 — 2026-08-23

harness-audit + the compounding loop — phase 3 of the modernization program
(row B2-19). The kit gains the periodic skill that keeps it (and any
consumer's agent setup) current with the ecosystem, and the retro loop that
turns session lessons into codified surfaces.

- **New skill `harness-audit`** (0.1.0) — the audit-family sibling for the
  agentic layer: inventory the local surface with an always-loaded vs
  on-demand cost split → re-fetch every row of the pinned authority list
  (`references/sources.md` — each row: governs · URL · verified-how · date;
  dead sources repaired during the run; no network ⇒ PARTIAL report, never
  fabricated findings) → current-dated category sweeps (never remembered
  product names) maintaining `references/stack.md` (dated recommended stack:
  baseline + per-domain tool servers incl. game engines, adjacent tooling
  verdicts, lean doctrine) → judgment rubric over descriptions, disclosure,
  evals, hook-event coverage, tool-server leanness, permissions, packaging →
  dated scored report in `docs.archiveDir` with explicit no-change-needed
  verdicts → proposed forward-only rows, then the sign-off gate.
  Anti-rot: no tool names in the body; a self-staleness check makes an aging
  source list the run's first finding. Ships project-scoped (not dual-home).
- **New skill `retro`** (0.1.0) — the compounding harvest: corrections /
  surprises / re-derivations / repetitions routed to the cheapest durable
  home (memory · instruction line · adapter field · skill edit · hook
  candidate · test · explicit drop), propose-don't-apply, rejections
  recorded. PLAYBOOK gains **technique 13 — compounding retros**; checkpoint
  suggests a retro on a three-strikes handoff (patch).
- **New hook `compact-reorient.mjs`** — SessionStart, matcher `compact`:
  a session resuming from context compaction gets a one-shot "re-open the
  status doc + current backlog row; re-verify assumed findings" nudge.
  Build-time contract check changed the design: **PreCompact rejected** (the
  event cannot inject additionalContext per the current hooks reference) and
  **SessionStart(startup|resume|clear) rejected** (per-session latency/noise)
  — both recorded in manifest.json's new hook-decision log; only the
  compaction re-entry is wired. Smoke-hooks 36 → 42 (fire, wrong-event
  silent, garbage sweep, BOM case, exec-form net picks up the new event).
- **`docs/PERMISSIONS.md`** — least-privilege doctrine + copy-paste starter
  allowlist + what-not-to-allowlist; README links it; the installer
  deliberately never writes permissions (recorded).
- **skill-lint**: `lint-ok: dated-file` whole-file suppression for
  maintained-metadata files (sources/stack rows are dates by design); the
  always-loaded budget check fired at 953 tokens during this build and
  forced description trims to **897** (10 skills — two more skills than the
  program started with, net −45 tokens vs the 0.13.0 baseline).
- Backlog: rows 18–19 leave the table (shipped as 0.15.0/0.16.0); rows
  21–22 enter from the harness-audit report (per-skill evals · inventory
  script).

Skills: harness-audit 0.1.0 (new) · retro 0.1.0 (new) · checkpoint 0.4.1 ·
dep-check 0.2.1 (description trims). Deck: ten skills / five hooks /
thirteen techniques.

Verification: **first live harness-audit run** —
`docs/archive/HARNESS_AUDIT_2026-08-23.md`, baseline **92.4/100** across 8
areas, sources all re-verified same-day, deductions mapped to rows 20–22 —
is this release's live loop. smoke-hooks 42 green (new handler: fire /
wrong-event-silent / garbage / BOM cases); smoke-installer 53; skill-lint 10
skills, 0 errors / 0 warnings after the budget check forced trims;
check-version 0.16.0 × 5; self-install re-run refreshed the tracked dogfood
copies (new skills + handler install and drift-check); root `--check` green.

## 0.15.0 — 2026-08-23

Any-project portability — phase 2 of the modernization program (row B1-18).
Formally overturns the "web-shape = accepted scope" classification from the
2026-08-19 audit: skill bodies are now domain-neutral skeletons, per-domain
mechanics load on demand from each skill's `references/`, and the adapter
schema carries the mechanical facts for any project type.

- **Adapter schema v2** (`adapters/project.schema.json`) — purely additive:
  `projectType` (web-app · api-service · cli · library · game · data · mobile
  · desktop · other) dispatches per-domain references; `ecosystem` (runtime,
  manifestFiles, registryQuery/addCommand templates) generalizes dependency
  facts beyond JS; `verify` (build · run · ready{kind: http/tcp-port/
  exit-code/log-line/file-exists/manual} · observe · notes) generalizes
  live-verify beyond a served port; `ci.provider` enum gains azure-devops ·
  jenkins · circleci. `packageManager` and `prodVerify` stay valid as
  documented v1 fallbacks — every existing adapter validates unchanged
  (proven in smoke).
- **Fixture adapters**: `adapters/godot-game.json` (game: headless engine
  runs, log-line readiness, golden-image note) and `adapters/rust-cli.json`
  (cli: exit-code readiness, golden outputs); `adapters/ai-dev-kit.json`
  migrates to v2 (`projectType: library`, verify = self-install + smokes) —
  the dogfood proof a non-web adapter drives the skills;
  `adapters/next-web-boilerplate.json` frozen as the v1 regression fixture.
- **Progressive disclosure across the kit** (installer needed zero changes —
  `syncSkill` already walks recursively): live-verify →
  `references/{web,game,cli,library,data}.md` with a ~60-line dispatch body;
  dep-check → `references/registries.md` (npm · PyPI · crates.io · Go ·
  NuGet · Maven · RubyGems · Composer · engine asset stores); project-audit →
  `references/taxonomies.md` (feature-group starters per project type; brief
  overrides); checkpoint → `references/ci-watch.md` (per-provider CI-watch
  recipes — the GitHub hardcode leaves the body); tidy →
  `references/hygiene-recipes.md` (Turborepo/engine caches, platform
  commands, container prunes); doc-audit → `references/hunts.md` (the seven
  hunts' mechanics; body back under its own 3k split heuristic; token math
  unified on chars/4); project-adopt → `references/disposition-map.md` +
  the inception pair now shares a byte-identical
  `references/inception-shared.md` (scaffold guard · question round · brief
  shape · doc registration · doc regeneration · sign-off gate), enforced by
  the linter's shared-by-copy check.
- **Generalization**: "the template" → "the target foundation" across both
  inception skills, PLAYBOOK technique 10, README, and the deck;
  project-adopt gains the no-foundation escape hatch project-init already
  had; project-audit's bar/calibration/inclusion language covers products,
  not just starters, with GitHub named as one forge among equals.
- **skill-lint armed**: size-grandfather list emptied (every body now under
  the 3k warn band); shared-by-copy byte-equality active on the inception
  pair.
- README, PLAYBOOK, and deck rewritten to the any-project scope (fixture
  trio linked; portability slide names the per-domain references).

Skills (all minor — bodies restructured): checkpoint 0.4.0 · doc-audit 0.3.0
· project-audit 0.2.0 · tidy 0.2.0 · dep-check 0.2.0 · live-verify 0.2.0 ·
project-init 0.3.0 · project-adopt 0.5.0.

Verification: smoke-installer grows a fixtures loop — every shipped adapter
installs clean, re-installs to "0 file(s) written", and `--check`s green
(4 fixtures × 3 checks), plus a projectType enum-violation triple (exits 1
pre-write, names the field, writes nothing) — 53 checks total; smoke-hooks
36 unchanged; skill-lint 8 skills clean, 0 errors / 0 warnings, description
total ≈719 tokens; check-version 0.15.0 × 5; scratch install + idempotent
re-run + `--check`; self-install re-run (incl. `--global` for doc-audit)
refreshed the tracked dogfood copies; root `--check` green.

## 0.14.0 — 2026-08-23

Skill-lint CI gate + rot burn-down — phase 1 of the four-phase modernization
program (any-project portability → harness-audit + retro → plugin-marketplace
packaging; backlog rows 18–20, plan user-approved 2026-08-23 after an
ecosystem research pass against the Agent Skills authoring standard).

- **New `.github/skill-lint.mjs`** — zero-dep lint of the skill surface, wired
  as a CI step ("Skill surface lints clean") and into the self-adapter's gate
  array. Errors gate; heuristics warn. Checks: dir/SKILL.md structure ·
  frontmatter shape (incl. `>-` folded descriptions, allowed keys, name = dir)
  · description ≤1024 chars, third-person, "Use when…" clause · body ≤500
  lines with token warn/error bands (doc-audit + project-adopt grandfathered
  until the phase-2 splits) · path hygiene (backslashes, absolute drives,
  hook-wiring variables in prose) · reference resolution, one-level nesting,
  TOC-for-long-refs · BOM/CRLF · bare-date freshness with `lint-ok: dated`
  suppression (±3 lines) · manifest ⇄ skills bijection + semver · shared-by-
  copy byte-equality (armed in phase 2) · wired-handler existence. Prints the
  always-loaded description-token table (warn >900).
- **Hook handlers strip a leading UTF-8 BOM** before parsing (all four):
  PowerShell 5.1 pipes BOM-prefix stdin, which parse-failed into a false
  silent exit 0 — the known same-class mechanism in the hook-visibility Watch
  row, now closed at the handler. CONTRIBUTING's hand-test trap note updated;
  Watch row annotated.
- **install.mjs ships `hooks/hooks.json`** next to the handlers
  (`.claude/hooks/ai-dev-kit/hooks.json`, exact-name match — other `*.json`
  variants never ship), so consumers hold the canonical wiring locally,
  drift-guarded like everything else.
- **Rot fixes:** doc-audit no longer hardcodes its repo URL or an outdated
  install command (it is the global dual-home skill — stale copies on other
  machines were naming a distribution channel); project-audit's dated
  war-story generalized into the timeless rule; live-verify and the README
  stop naming the retired `verify` built-in (now `run`); checkpoint's example
  model ladder gains a "verify against the session's lineup" hedge plus a
  lint suppression.
- **Token trims:** project-adopt description 516 → 384 chars (every manifest
  trigger phrase preserved); the adapter-config preamble collapsed to one
  canonical `Adapter: …; missing field → derive and say so` line across all
  8 skills. Always-loaded description total ≈782 → ≈723 tokens.
- **New root `AGENTS.md`** (33 lines) — the kit now practices the
  standing-instruction discipline it teaches: non-inferable rules only
  (source-vs-install, five-stamp bump, program discipline, advise-never-block,
  zero-dep, no-silent-renames), pointers for everything else.
- **Backlog:** rows 18–20 opened (program phases 2–4); B4-16 annotated as
  superseded-on-ship by row 20.

Skills: project-adopt 0.4.0 (description/trigger surface); checkpoint 0.3.1 ·
doc-audit 0.2.1 · project-init 0.2.1 · project-audit 0.1.1 · live-verify 0.1.2
· dep-check 0.1.1 · tidy 0.1.1 (wording/preamble only).

Verification: smoke-hooks 36 — the 4 new BOM-prefixed cases shown failing
against pre-strip handlers (exit 0, fired=false) then green; smoke-installer
38 — the hooks.json shipping case shown failing pre-fix; skill-lint green on
the 8 skills (0 errors / 0 warnings) and its error paths proven on a
deliberately broken fixture tree (13 distinct errors, exit 1); five stamps
bumped together; self-install re-run (incl. `--global` for doc-audit)
refreshed the tracked dogfood copies; full local suite green (scratch install
→ idempotent re-run → scratch `--check` → skill-lint → smoke-hooks 36 →
smoke-installer 38 → check-version 0.14.0 × 5 → root `--check`).

## 0.13.0 — 2026-08-12

checkpoint 0.3.0 — a handoff now ends with a launch recommendation.

- **checkpoint: relaunch model × effort recommendation**
  (`skills/checkpoint/SKILL.md`): a handoff no longer stops at the resume
  prompt — the response's literal last line is now
  `Launch: <model> @ <effort> — <why>`, mirrored at the top of the handoff
  file, so the user picks the relaunch configuration with the step's cost
  already weighed. A new rubric maps the §2 step-shape estimate onto the
  harness's tier ladder: **Mechanical** (approved plan, docs/config-only,
  release chores, gate re-runs) → smallest tier at low effort; **Standard
  build** (signed-off S/M around a known design) → mid tier at medium, high
  when the diff touches concurrency/authz/money; **Judgment** (planning,
  audits and scoring, unknown-debugging, adversarial verification) → top
  tier at high+. Mixed steps split by session (a plan-only session is
  Judgment; its approved execution relaunches as Mechanical); ties on work
  that ships product code or scores quality resolve upward. Manifest
  summary, README skill row, and deck card refreshed to match.

Verification: skill-body + docs change — no smoke surface, nothing to show
failing-first. Five stamps bumped together; self-install re-run refreshed
the tracked dogfood copies; full local suite green (scratch install →
idempotent re-run → scratch `--check` → smoke-hooks 32 → smoke-installer 37
→ check-version 0.13.0 × 5 → root `--check`).

## 0.12.0 — 2026-08-09

The S-tail closes — backlog rows B3-18/19/20 (B1-17 closed docs-only in
`5cf5b22`: both live-fire instruments silent under exec-form; harness layer
Watch-rowed, kit code exonerated in-situ).

- **Baseline-named smoke gaps closed** (`.github/smoke-hooks.mjs`):
  dep-check's install-with-args variant (`npm install left-pad`) and
  live-verify's flagged commit (`git -c core.autocrlf=false commit -m x`).
  Both shipped regexes already handled them — the cases passed on arrival,
  so this is coverage closure, not a fix (noted per the failing-first rule).
  Hook cases 30 → 32.
- **Advisory adapter re-validation on `--check`** (`install.mjs`): when the
  dest's `.claude/ai-dev-kit.config.json` exists, `--check` re-validates it
  against `adapters/project.schema.json` and prints an ADVISORY on stderr
  for schema issues or unparseable JSON — exit code unchanged (drift/stale
  only): the config is user-owned and stays unpoliced, but a broken one is
  now visible instead of silently degrading the skills that read it.
  Failing-first: of the five new installer cases, the three ADVISORY asserts
  failed against the pre-fix installer; the exit-0 and valid-config-quiet
  cases pin the contract's unchanged half and pass either way. Installer
  cases 32 → 37.
- **`--hooks` consumer trust note** (SECURITY.md, README): what installing
  the kit's hooks lets run in your sessions — advise-only
  `additionalContext`, pure Node stdlib, no network, no child processes,
  10s timeout, byte-for-byte drift-guarded by `--check`, malformed events
  exit 0 silently.

## 0.11.0 — 2026-08-09

The B3 precision band shipped whole — backlog rows B3-12…15. Hooks and the
installer lose their last scored rough edges: garbage-tolerant handlers,
strict flags, exec-form wiring, boundary-anchored matching. Per program rule,
every new smoke case below was shown failing against the pre-fix code first.

- **Handlers tolerate malformed stdin** (all four `hooks/*.mjs`): the stdin
  read+parse is wrapped so a malformed, empty, or JSON-scalar event exits 0
  silently — previously a SyntaxError death with exit 1. Harmless to the
  session (only exit 2 blocks) but a broken contract: these handlers advise,
  they never fail. The 12 new smoke cases (`""`, `"not json"`, `"null"` × 4
  handlers) all exited 1 on the pre-fix handlers.
- **Installer rejects unknown flags; `--help`** (`install.mjs`): strict parse
  over the known flag set — an unknown or misspelled flag, a stray positional,
  or a value flag missing its value fails loudly (exit 1, offending token
  named, `--help` hinted) before anything is read or written. Previously
  `--frobnicate` exited 0 and installed, and a typo'd `--dest` installed into
  cwd. `--help`/`-h` prints real usage (flags, defaults, the self-install
  line). Six of the seven new smoke cases failed pre-fix — `--help` "exited 0"
  only because it was silently ignored while a full install ran.
- **Exec-form hook entries** (`install.mjs` §6, then `hooks/hooks.json`): the
  merge's ownership check now keys on `args` entries as well as the `command`
  string, and hooks.json flips all four entries to exec form —
  `command: "node"`, `args: ["${CLAUDE_PROJECT_DIR}/.claude/hooks/ai-dev-kit/…"]`.
  With no shell between harness and handler, the 0.7.2 PowerShell/bash quoting
  class is gone by construction; the smoke anchor net now enforces the braced,
  *unquoted* exec form (quotes would be literal argv bytes). Re-verified
  against the current hooks docs before the flip: `args` selects exec form and
  `${CLAUDE_PROJECT_DIR}` is substituted into each element as a plain string.
  Failing-first: an exec-form stale kit entry seeded into settings survived
  the pre-fix merge (marker invisible to the command-string-only matcher,
  marker-hook count 2 vs 1); string-form stale entries — the 0.10.x upgrade
  path — are still replaced, and a markerless user exec-form hook survives.
- **context-guard match precision** (`hooks/context-guard.mjs`): the
  contextDir test is segment-boundary-anchored, regex-escaped, and
  case-insensitive — `mydocs/context/` no longer false-fires a `docs/context`
  config — and the instruction-file + memory matches gain case-insensitivity
  (`Claude.md` *is* `CLAUDE.md` on Windows/macOS filesystems; advise-only, so
  the rare case-sensitive-Linux false positive costs one harmless reminder).
  All three new cases failed pre-fix: a false fire on `mydocs/context/DB.md`,
  misses on `packages/api/Claude.md` and `Docs/Context/DB.md`.

## 0.10.1 — 2026-08-09

The governance band — backlog rows B2-8…B2-11 close out B2. No installer,
hook, or skill behavior changed (hence patch); the repo around the kit
hardened.

- **Actions current + Dependabot** (`ci.yml`, `.github/dependabot.yml`):
  actions/checkout → v7.0.1 and actions/setup-node → v7.0.0, both still
  pinned to full commit SHAs; a weekly `github-actions` Dependabot config
  keeps the pins moving. Clears the Node-20 deprecation annotations observed
  on the 0.9.0 and 0.10.0 CI runs.
- **Node floor declared and CI-proven** (README, `ci.yml`): requires Node
  ≥ 22 (oldest active LTS); the CI matrix now runs 22 + 24 on ubuntu +
  windows — four jobs, so the floor is tested, not aspirational.
- **The kit is its own consumer** (`adapters/ai-dev-kit.json`, `.claude/`):
  a minimal schema-valid dogfood adapter (gate, doc paths, commit style, CI
  facts); the self-install is tracked in-repo with hooks merged into
  `.claude/settings.json`, and a new CI step (`node install.mjs --check` at
  the repo root) fails the build if the dogfood copy ever drifts from kit
  source.
- **Governance surface** (`CONTRIBUTING.md`, `SECURITY.md`, README, repo):
  contributor ground rules (edit source not installed copies, generic skill
  bodies, the five-site version bump, show a claiming test failing pre-fix)
  plus the full local suite; security policy with GitHub private
  vulnerability reporting enabled; CI badge on the README; five repo topics.

## 0.10.0 — 2026-08-09

The installer-trust release — backlog rows B2-6 + B2-7. The settings merge the
audit proved correct is now a CI regression net, and the one direction the
installer couldn't see — files *it* left behind — is closed.

- **Stale leftovers are detected and pruned** (`install.mjs`). The installer
  records every path it owns and walks the kit-owned dirs
  (`.claude/skills/<kit skill>/`, `.claude/hooks/ai-dev-kit/`, dual-home skill
  dirs with `--global`) for files kit source no longer contains — previously
  both install and `--check` walked kit source only, so a renamed/removed kit
  file left an orphan forever while drift read green. `--check` now lists such
  files as STALE and exits 1; a plain install prunes them (reported, emptied
  subdirs cleaned up). Skills the manifest doesn't list stay untouched, and the
  user-owned adapter config + settings.json are outside the kit-owned dirs, so
  they are never candidates. The smoke proved the blindness first: planted
  orphans passed `--check` green on the 0.9.0 installer.
- **Settings-merge regression net** (`.github/smoke-installer.mjs`, run by CI
  on both OSes): installs `--hooks` into a dest whose `.claude/settings.json`
  is pre-populated — user hooks on kit events, a user hook sharing an entry
  with a kit hook, a foreign event, a stale kit-marker entry, non-hook keys —
  and asserts preserve / replace / no-dup / byte-stable-on-rerun. The merge
  behavior was proven in-session during the audit; these 12 cases keep it from
  regressing silently (disabling the marker filter fails 9 of them).

## 0.9.0 — 2026-08-09

The B1 hardening release — the 2026-08-09 audit's do-next band shipped whole:
the one proven hook bug fixed, and the kit's honest-but-ungated claims (version
stamps, adapter shape, idempotency) now enforced by CI. Closes backlog rows
B1-1 … B1-5 (audit report in `docs/archive/`).

- **context-guard reads the adapter config from the project root**
  (`hooks/context-guard.mjs`). The read anchors on `CLAUDE_PROJECT_DIR` — the
  root the harness exports to hooks — falling back to cwd when unset, so a
  session running in a subdirectory no longer silently loses a custom
  `docs.contextDir`. This is the same cwd class 0.7.2 fixed for handler
  *paths*, now closed for the config read. New smoke case drives the handler
  from a fixture subdirectory and asserts the override fires.
- **Adapters are schema-validated at install** (`install.mjs`). A zero-dep
  validator checks the adapter against `adapters/project.schema.json` — types,
  enums, unknown keys (`additionalProperties: false`), array items — and a
  violation fails the install listing each path + reason. The adapter is read
  and validated up front, so a bad adapter no longer dies mid-install with
  skills already copied; nothing is written on failure. CI's reference-adapter
  install now exercises the validator on every push, and the deck's
  Portability claim returns to "schema-validated" (the audit had downgraded it
  to "schema-documented" to match reality).
- **Version-consistency gate in CI** (`.github/check-version.mjs`): `VERSION`,
  `manifest.json`, the CHANGELOG's top entry, and both deck stamps must agree
  — the drift class the audit caught twice (a 0.8.0 kit under a 0.7.1-stamped
  deck) now fails the build instead of waiting for the next audit.
- **Idempotency is asserted for real** (`ci.yml`): the second install run must
  print "0 file(s) written"; previously the step passed on exit 0 alone, which
  never tested the claim it named.
- **Releases are tagged**: annotated `v0.8.0` backfilled on the 0.8.0 release
  commit, `v0.9.0` on this one, each with a GitHub Release carrying its
  changelog entry — a consumer can finally pin or roll back instead of always
  installing HEAD. Go-forward rule added to README · Rules.

## 0.8.0 — 2026-08-08

`skills/project-adopt` **0.3.0** — the selective-merge release: adoption now
answers "merge this template's improvements into my existing app" as first-class
intent, with the burden of proof made explicit per tier.

- **Two-tiered meaningful-improvement bar (§3).** The product surface (UI,
  flows, styles, copy, business logic) defaults to **keep-theirs** —
  transplanted intact; a wash keeps theirs, churn is a cost. The foundation
  (auth, DB layer, tooling, CI, security, observability) keeps the template
  presumption — the scaffold already wires it, so keeping theirs is the churn
  and takes the same named why. "The template has one" is never a why on either
  tier. A first draft flipped the default uniformly; adversarial review broke
  it (a static-only reference makes "working" unverifiable — wash-by-ignorance
  at exactly the highest-stakes subsystems), hence the tiers plus a
  **no-wash-by-ignorance** rule: wash verdicts exist only on top of a recorded
  comparison.
- **Contested subsystems get a recorded comparison** — tech choices and
  implementation details on named axes, verdict plus what was actually
  inspected, written into the migration map (§3/§6).
- **"Transplanted intact" is now decidable (§3):** bounded by the adopting
  repo's CI gate *plus* its stated non-CI-enforced hard rules; a hard rule
  forcing structural change relocates the row to port-onto-template with that
  rule as its why. Framework-agnostic material (business logic, schemas,
  algorithms, styles/tokens, copy) named as the honest transplant class. The
  upstream-lesson clause is scoped to keep-theirs rows that *beat* a template
  equivalent — washes are not lessons.
- **The incoming agentic layer is surveyed and dispositioned (§2/§3)** — the
  codebase's own `.claude/` (skills, hooks, agents, settings), instruction
  files, agent memory, custom dev scripts. The merged project ships the union
  of the template's agentic layer and the survivors; a dropped agentic asset
  needs the same evidence as dropped code. (Closes the adopt-wrapper gap
  analysis's deliverable E, kit-side.)
- **Parity-as-tests (§7).** Right behind the walking skeleton, the parity
  contract is enumerated into a one-to-one **pending-spec map** — a
  skipped/`fixme` e2e spec per contract row, behavior named, selectors left to
  the row that builds the surface. Each port row flips its specs live and
  ports its carried green suites alongside its code; completion = zero pending
  parity specs plus the full gate and suites green at the adopting repo's
  enforced thresholds. Sequenced this way deliberately: specs authored before
  their surfaces exist are selector guesses — the map fixes behavior, the
  building row fixes selectors.
- **Model/effort routing (§0):** the judgment steps (disposition map, contested
  comparisons) run with extended thinking on the most capable model available
  to the session — flag a lighter-tier session before surveying; `--deep`
  enumeration fan-out may run on cheaper tiers per PLAYBOOK §12's routing
  doctrine.
- **Green tests are carried assets and the dependency manifest is snapshotted
  (§2)** — every carried dependency faces the adopting repo's dependency policy
  at port time.
- Intake reconciles "merge" at minute one (§1): scaffold-plus-port, the
  original a read-only reference, the parity contract as the written no-loss
  promise. The §8 gate now opens in plain language (what stays yours, what each
  replacement buys, what lights up, what's dropped and why). Frontmatter
  reworked roughly net-neutral — 0.7.0's description trim stands.
- PLAYBOOK §10 carries the doctrine; manifest summary/triggers updated.

## 0.7.2 — 2026-07-29

- `hooks/hooks.json`: every wired command now anchors its handler path on
  `"${CLAUDE_PROJECT_DIR}/…"` instead of a repo-relative `.claude/hooks/…`.
  **Hooks are spawned with the session cwd, not the project root**, so a
  relative path resolved against whatever subdirectory the session last `cd`'d
  into and died with `MODULE_NOT_FOUND` — silently, since only exit 2 blocks and
  these handlers advise. Measured across two consumers in a 50-session window:
  14 lost runs in one, 274 in a monorepo where sessions live inside
  `packages/*`. Every gate stayed green throughout; nothing detected it.
- Braced **and** double-quoted are both load-bearing, for different reasons: a
  bare `$CLAUDE_PROJECT_DIR` reads as `$null` under the PowerShell hook shell
  (Windows without Git Bash), and an unquoted path word-splits under bash when
  the project path contains a space. The official hooks-guide examples use the
  bare form; they are POSIX-only and must not be copied into a template.
- Exec form (`args`) was evaluated and rejected: it moves the handler path out
  of `command`, where `install.mjs`'s ownership marker looks, so the installer
  would stop recognising kit entries and append duplicates alongside them. It
  also degrades worse on adopter builds predating the `args` key, whereas the
  shell form degrades to exactly the prior behaviour. Revisit once the marker
  keys on `args` too.
- `.github/smoke-hooks.mjs`: new assertion that every command in `hooks.json`
  carries the anchored form. The wiring itself was ungated — the previous suite
  proved handlers *behave*, never that they can be *found*.
- Known limit, unchanged by this release: `CLAUDE_PROJECT_DIR` is the launch
  cwd, not the git root, so launching from inside a subdirectory still misses.
  Strictly better than before, which broke on any `cd`.

## 0.7.1 — 2026-07-23

- `hooks/context-guard.mjs`: now also fires on **agent-memory files**
  (`~/.claude/projects/<slug>/memory/*.md`, the `MEMORY.md` index included)
  with a memory-economy reminder — the index stays a one-line-per-memory
  pointer list within budget (adapter `contextBudget`; defaults ~700 tokens,
  ~120-char hooks), memory files stay within ~1.5k tokens, shipped work lands
  as one clause on an existing line, and the repo owns history. Motivated by
  a real consumer failure: a memory-index entry regrew into a
  multi-thousand-token always-loaded blob — the guard covered every
  standing-instruction surface except the one that failed. Smoke cases added
  (fire: Windows-path index + POSIX memory file; silent: non-memory `.md`
  under the project dir).

## 0.7.0 — 2026-07-23

Context-engineering release — the kit absorbs the standing-instruction-economy
and session-economics curriculum (prime directive, budgets, cache-stable
prefixes, leaf AGENTS.md, three-strikes, disk-seeded handoffs) as enforceable
practice, not just prose.

- `skills/doc-audit` (**0.2.0**, dual-home): new **hunt 7 — standing-instruction
  budget & placement**: measures the always-loaded set against budgets (adapter
  `contextBudget`, defaults ~150-line onboarding file / ~700-token memory index
  with ~120-char hooks / ~3k-token context-doc split threshold / ~1.5k-token
  memory files, flag-and-recommend, never hard-fail) and checks *placement* —
  prime-directive (repo-inferable lines), thin-pointer tool files, cache
  stability (volatile dates/scores/deadlines out of always-loaded files), leaf
  `AGENTS.md` drift + candidates, load-when-table precision. Discover step now
  globs leaf instruction files; execute step gains the matching fixes (relocate
  volatile facts, split-with-redirect-stub, restate write-time memory rules).
  Frontmatter description trimmed ~800→~350 chars (triggers preserved) — the
  description is always-loaded in every consumer session, and globally via
  dual-home.
- `skills/checkpoint` (**0.2.0**): the context-health check gains the
  **three-strikes rule** (a session that failed the same obstacle 3× is
  unhealthy regardless of remaining window — hand off with a diagnosis, never
  coach in-window), and the handoff now **writes the resume prompt to disk**
  (adapter `docs.handoff`, else the agent memory directory as
  `resume-prompt.md`) with a one-line seed pointer; the paste-ready block
  remains as convenience. Disk survives scrollback; the fresh session reads the
  file in targeted chunks instead of ingesting a paste.
- `skills/project-init` (**0.2.0**) / `skills/project-adopt` (**0.2.0**):
  registering the brief/map in the context-doc index now *appends* a
  shape-matched row (uncommenting a pre-seeded placeholder stays the
  older-template fallback) — templates no longer need to carry commented
  scaffolding in their always-loaded onboarding file. Frontmatter descriptions
  trimmed to trigger-essentials (~640/~600 → ~350 chars each).
- `skills/live-verify` (**0.1.1**): frontmatter description trimmed
  (procedure detail moved out; triggers preserved).
- `hooks/context-guard.mjs` — **fourth hook** (PostToolUse: Edit|Write):
  fires on edits to `AGENTS.md`/`CLAUDE.md` at any depth (leaf files included)
  or files under the adapter's `docs.contextDir`; injects the
  standing-instruction-economy reminder (non-inferable only, within budget,
  stable top, doc + code in the same commit). Advise-never-block; smoke cases
  added. Reviewed-and-rejected alongside it: calendar/session-counter doc-audit
  nudges (contradict audits-on-real-need; noise) — recorded here per the
  automation-review discipline.
- Adapter contract: `contextBudget` block (agentsMdMaxLines ·
  contextDocSplitTokens · memoryIndexMaxTokens · memoryFileMaxTokens) read by
  doc-audit hunt 7; `docs.handoff` for the checkpoint handoff file. Reference
  adapter gains the budget block and widens `depPolicy.exactPin` to the full
  frequent-publisher list (stripe, @sentry/*, posthog-*, react-email,
  @axe-core/playwright) that previously lived only in project memory.
- `docs/PLAYBOOK.md` techniques **11 — standing-instruction economy** (prime
  directive, ceilings, thin pointers, leaf files, cache-stable prefix) and
  **12 — session economics** (three-strikes, point-don't-paste, model routing,
  bounded output). README gains the **"Keep the consumer thin"** section with
  the canonical 4-line consumer CLAUDE.md block (a consumer re-cataloging
  skills double-pays for descriptions the harness already always-loads). Deck
  re-stamped at 0.7.0 (four hooks, twelve techniques).

## 0.6.1 — 2026-07-19

project-adopt **0.1.1** — mends from the live trial (program step 3: the full
flow driven on a fresh consumer copy adopting **linkding 1.45.0**, green
through the sign-off gate; both intake forms + the re-run/resume branch
exercised; reference grade live-local via the original's own docker-compose).

- **§2 Copy & locales:** bind copy **verbatim by reference** to the named
  source files (the retained source is the contract's copy appendix) instead
  of transcribing template trees into the migration map — a real app's 47
  templates made wholesale transcription duplicative and unmaintainable.
- **§5 question round:** one round = one *presentation moment* — where the
  asking UI caps questions per prompt, consecutive sets within it still count
  as the one round; and smaller calls resolved by recommendation *without
  being asked* are marked as assumptions in the brief's decision log alongside
  skipped answers (the trial's round came back fully answered, so the
  skip-path relies on this convention for coverage).

Trial-surfaced template (not kit) findings were filed in the template's
backlog: a token-sheet-adoption recipe for UI.md, two post-slim leftover
pointers in MAINTENANCE.md, and the AGENTS.md placeholder wrapper naming only
project-init.

## 0.6.0 — 2026-07-19

The brownfield inception skill — the pipeline gains its second entry door
(project-adopt program, step 1 of 3).

- `skills/project-adopt/` — adopts an existing codebase onto the template: intake
  (arg path/git URL or the gitignored `init.sourceDir` drop dir; the source stays a
  **read-only, never-committed reference**) → best-effort boot establishing the
  **reference grade** (live-local / live-remote / static-only — the grade sets each
  port row's parity evidence: side-by-side drives / deployed-URL comparison /
  checklist + verified-by-inspection) → extended-thinking survey producing the
  **product inventory = parity contract** (routes, flows, data model, auth shape,
  integrations, extracted design tokens, copy, assets, SEO; `--deep` fans out
  subagents) → honest five-bucket **disposition map** (port-onto-template ·
  replace-with-template · keep-theirs · light-up · drop; every row carries a why —
  "the template wins" is a prior, not a rule; keep-theirs rows double as
  upstream-lesson candidates) → data & users reality check (auth-hash import vs
  forced reset, schema path, stored files, cutover) → one batched question round →
  product brief + **migration map** (adapter `init.migrationMap`) → regenerated
  status doc + banded backlog whose completion is a surface-identical app on the
  template foundation with the relevant template features lit up; B1 opens with
  the port walking skeleton (scaffold + extracted tokens + one core page,
  parity-verified). Writes no product code; sign-off commits the inception output.
- Adapter contract: `init` gains `migrationMap` (default `docs/MIGRATION.md`) and
  `sourceDir` (default `intake/source/`, kept gitignored); the `init` block is now
  shared by both inception skills; reference adapter updated.
- `docs/PLAYBOOK.md` technique 10 (inception discipline) now covers both entry
  doors — greenfield (project-init) and brownfield (project-adopt: parity
  contract, disposition honesty, reference-graded evidence). The deck gains the
  eighth skill card and re-stamps at 0.6.0.
- Reviewed and deliberately NOT hook-automated — same rationale as project-init:
  the entry point is the template's getting-started text plus the skill triggers.

## 0.5.0 — 2026-07-18

Extraction — the kit now lives in its own repository:
[jrittelmeyer/ai-dev-kit](https://github.com/jrittelmeyer/ai-dev-kit) (the
roadmap's standalone-repo row). Consumers — next-web-boilerplate first — install
from a clone of this repo with `--dest <project-root>`; skills and hooks are
otherwise unchanged.

- Standalone install story: README + deck commands drop the in-repo
  `ai-dev-kit/` path prefix and document `--dest <project-root>` as the normal
  case; `install.mjs`'s usage comment and drift-fix hint no longer name a
  host-repo path.
- `skills/doc-audit` (0.1.1): the dual-home rule names this repo — not a host
  repo's bundled `ai-dev-kit/` dir — as the canonical source (the source-of-truth
  handoff extraction required).
- `hooks/skill-drift-guard.mjs`: the injected pointer directs edits at a clone
  of the ai-dev-kit repo instead of a bundled `ai-dev-kit/` dir.
- Repo scaffolding (not kit behavior): LICENSE (MIT), `.gitattributes`, and a
  two-OS smoke CI (ubuntu + windows) — installer round-trip into a scratch
  project, idempotent re-run, `--check`, and piped-event fire/silent tests for
  all three hook handlers.

## 0.4.2 — 2026-07-18

Trial follow-up: the template side of finding U2 shipped (a commented `PRODUCT.md`
placeholder row under the agent-onboarding context-doc table), and the skill now
uses it.

- `skills/project-init` (0.1.2): the register-the-brief step prefers the
  pre-seeded commented placeholder row — uncomment it (delete the wrapper lines)
  instead of authoring a row; appending a shape-matched row stays the fallback
  for repos without one.

## 0.4.1 — 2026-07-18

Live-trial mends (project-init program, step 3 — the full flow driven on a fresh
degit consumer copy; sample product "Potluck", a recipe-sharing SaaS).

- `skills/project-init` (0.1.1): the scaffold guard now requires `{name}` to be
  substituted as a **lowercase npm-safe slug** — the reference scaffold
  (`init-app`) silently skips its rename step on an invalid npm name, so an
  unslugged "Potluck" would have shipped un-renamed (trial finding).
- `skills/project-init` (0.1.1): sign-off now includes **committing the inception
  output** (adapter `commit` style) before the pipeline enters row 1 — the skill
  never said so, and a fresh adopter agent would have left the scaffold + docs
  uncommitted (trial finding).
- Adapter schema: `init.scaffold` description documents the slug requirement.
- Trial verdict, everything else green on the consumer copy: installer `--check`,
  intake re-run safety, fresh-scaffold guard, slim's removal contract, discovery →
  one batched round (a skipped answer correctly became a marked assumption) →
  brief → context-doc mends → regenerated status/backlog with walking-skeleton
  row 1 + Upstream candidates. Template-level findings (leftover-mention tidy,
  PRODUCT.md index placeholder) went to the template backlog, not the kit.

## 0.4.0 — 2026-07-18

The inception skill — the pipeline gains its one-time entry point (project-init
program, step 1 of 3).

- `skills/project-init/` — turns an idea into a signed-off build program: intake
  (plan docs and/or a raw idea) → mechanical scaffold (adapter `init.scaffold`,
  confirm-gated because doc-slim removes files) → extended-thinking discovery (gap
  analysis; value-add candidates split *free-in-template* vs *new build*;
  competitive landscape scan, `--deep` fans out subagents; template fit-map) → one
  batched clarifying-question round (skipped answers become marked assumptions) →
  product brief at adapter `init.productBrief` carrying the product-specific
  feature groups + bar that future `project-audit` passes score against →
  context-doc mends with template-level gaps logged as backlog "Upstream
  candidates" → regenerated status doc + banded backlog whose completion is the
  100 score → plan sign-off → the lifecycle pipeline starts at row 1. Writes no
  product code.
- Adapter contract gains an optional `init` block (`scaffold` with `{name}`
  substitution, `productBrief`).
- Reviewed and deliberately NOT hook-automated: a post-scaffold nudge belongs in
  the template's getting-started text, not machinery.
- `docs/PLAYBOOK.md` gains technique 10 — **inception discipline** (restate first,
  honest value-add split, date-stamped competitive claims, marked assumptions,
  walking-skeleton row 1); the deck adds the seventh skill card + the inception
  pipeline stage and re-stamps at 0.4.0.

## 0.3.0 — 2026-07-17

Step 3: playbook + catalog deck. The program's three steps are complete.

- `docs/PLAYBOOK.md` — the why-layer: nine non-skill techniques (pipeline,
  plan-gate, context tiers, memory discipline, cheapest-sufficient-probe, fan-out
  research, archive pattern, resume prompts, automation review), each with
  what/why/practice/automation/composes-with, pointing into skills rather than
  duplicating them.
- `docs/pitch-deck.html` — self-contained catalog/pitch deck (no external assets,
  light/dark token theming): the pipeline, six skill cards with auto-trigger chips,
  the hooks + advise-never-block policy, playbook at a glance, the adapter/install
  story, and the roadmap.
- manifest gains a `docs` section.

## 0.2.0 — 2026-07-17

Step 2: automation hooks. All hooks **advise, never block** — they inject context;
the agent decides.

- `hooks/` — three cross-platform Node handlers, installed to
  `.claude/hooks/ai-dev-kit/` (drift-guarded like skills):
  - `dep-check-nudge.mjs` (PostToolUse: Edit|Write|Bash) — fires on package.json
    edits and package-manager add/update/install-with-args commands.
  - `live-verify-reminder.mjs` (PreToolUse: Bash, `if: "Bash(git *)"`) — fires
    before any `git commit` (compound commands included).
  - `skill-drift-guard.mjs` (PostToolUse: Edit|Write) — fires on direct edits to
    `.claude/skills/` or `.claude/hooks/` (installer output; edit the kit instead).
- `hooks/hooks.json` — the settings snippet; `install.mjs --hooks` merges it
  idempotently into `.claude/settings.json`, replacing only kit-owned entries
  (identified by the handler-path marker).
- Reviewed and deliberately NOT hook-automated: a Stop-hook checkpoint nag and a
  tidy/cache hook (standing cadence + husky pre-push already cover them; a nag
  would be noise).

## 0.1.0 — 2026-07-17

Initial extraction from next-web-boilerplate.

- Skills: `checkpoint`, `doc-audit` (dual-home), `project-audit`, `tidy` — generalized
  from the repo-specific originals (behavior preserved; mechanical params moved to the
  adapter config). New: `dep-check`, `live-verify`.
- Cross-platform installer (`install.mjs`): copy, `--check` drift guard, `--global`
  dual-home sync, `--adapter` config install. Pure Node fs, no symlinks, idempotent.
- Adapter contract: `adapters/project.schema.json`; reference adapter for
  next-web-boilerplate.
- Not yet: automation hooks (Step 2), playbook + pitch deck (Step 3).
