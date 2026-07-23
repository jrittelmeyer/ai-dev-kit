# ai-dev-kit changelog

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
