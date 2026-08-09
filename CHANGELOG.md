# ai-dev-kit changelog

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
