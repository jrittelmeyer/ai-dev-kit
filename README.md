# ai-dev-kit

[![CI](https://github.com/jrittelmeyer/ai-dev-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jrittelmeyer/ai-dev-kit/actions/workflows/ci.yml)

A portable, versioned library of agentic-development skills — the working method
distilled from building
[next-web-boilerplate](https://github.com/jrittelmeyer/next-web-boilerplate),
packaged so **any project of any type** — web app, game, CLI, library, data
pipeline — can adopt it. Skill bodies are **generic**: everything
project-specific lives in one small adapter config, and per-domain mechanics
(web · game · cli · library · data) load on demand from each skill's
`references/`. One command installs the kit into a project; re-run it from a
fresh clone to stay current.

**Version:** see [VERSION](VERSION) · **History:** [CHANGELOG.md](CHANGELOG.md) ·
**Machine-readable index:** [manifest.json](manifest.json) ·
**Why-layer:** [docs/PLAYBOOK.md](docs/PLAYBOOK.md) ·
**Catalog/pitch deck:** [docs/pitch-deck.html](docs/pitch-deck.html)

## What's inside

| Skill | Job | Typical trigger |
| --- | --- | --- |
| `checkpoint` | Commit + push, context-health verdict, continue or hand off with a resume prompt + relaunch model/effort recommendation | every step boundary |
| `doc-audit` | Keep docs / agent context / memory / showcase docs accurate + token-lean | periodic maintenance |
| `project-audit` | Score the repo /100 per feature group; emit a prioritized backlog | "how good is this really?" |
| `tidy` | Prune the unbounded build cache; surface judgment-required machine cleanups | checkpoint boundary / low disk |
| `dep-check` | Registry-verify version, release age, and pin policy before any dependency change | adding/upgrading a dependency |
| `live-verify` | Fresh production-shaped run (served build / game export / CLI binary / packed library) + drive the real flow — behavioral proof before commit | before committing product changes |
| `project-init` | Inception: plan docs / raw idea → discovery + competitive scan → product brief → status/backlog regenerated to a 100 bar | once, on a fresh scaffold |
| `project-adopt` | Brownfield inception: existing codebase → parity contract + theirs-vs-foundation disposition map → product brief + migration map → port backlog | once, on an existing app |
| `harness-audit` | Audit the agent harness itself (skills, hooks, context files, tool servers, permissions, packaging) against re-fetched current ecosystem standards; dated scored report + proposed rows | quarterly / after major harness releases |
| `retro` | Harvest a milestone or painful session into durable improvements — lessons routed to memory, instruction lines, adapter fields, skills, hooks, or tests | post-milestone / "make sure this doesn't happen again" |

The intended lifecycle (machine-readable in `manifest.json` → `pipeline`):

```text
orient → plan-gate → [dep-check] → build → live-verify
      → code-review / simplify → checkpoint (→ tidy)
      → periodic: doc-audit · project-audit · harness-audit
      → post-milestone: retro
```

`project-init` and `project-adopt` sit *before* the loop — the one-time inception
passes. `project-init` turns an idea (or a stack of plan documents) into the
signed-off product brief, mended context docs, and prioritized backlog the loop
then executes. `project-adopt` does the same for a product that **already exists
as code**: it surveys the app into a parity contract, maps every subsystem
theirs-vs-template, and regenerates the docs into a port program that lands the
app surface-identical on the template foundation — with the template's relevant
features lit up.

`code-review`, `simplify`, and `run` are Claude Code built-ins the kit composes
with rather than reimplements.

## Install into a project

Two routes — **choose one per project**: running both duplicates every skill
(plugin-namespaced + project copies) and double-fires every hook.

**A · Plugin marketplace** (Claude Code):

```text
/plugin marketplace add jrittelmeyer/ai-dev-kit
/plugin install ai-dev-kit@ai-dev-kit
```

Skills and hooks load from the plugin (hooks auto-wire from the plugin-form
`hooks/hooks.json`, `${CLAUDE_PLUGIN_ROOT}`-anchored); updates arrive when the
plugin version bumps. The adapter stays yours either way — drop
`.claude/ai-dev-kit.config.json` into the project (contract below).

**B · The installer** (any harness that reads `.claude/skills/` — the Agent
Skills open format). From a clone of this repo (anywhere on disk):

```bash
git clone https://github.com/jrittelmeyer/ai-dev-kit
node ai-dev-kit/install.mjs --adapter ai-dev-kit/adapters/<your-project>.json --dest path/to/your-project --global --hooks
```

- Requires Node ≥ 22 (pure Node, zero dependencies); CI runs the floor (22) and
  current (24) on ubuntu + windows.
- Copies `skills/*` → `<project>/.claude/skills/` (byte-identical) and the hook
  handlers plus their canonical wiring (`hooks/*.mjs`, and
  `hooks/installer-hooks.json` — which ships *as* `hooks.json`) →
  `.claude/hooks/ai-dev-kit/`. The plugin-form `hooks/hooks.json` never ships
  to an installer consumer.
- `--global` also installs dual-home skills (`doc-audit`) → `~/.claude/skills/`.
- `--adapter <file>` validates the adapter against
  [adapters/project.schema.json](adapters/project.schema.json) (types · enums ·
  unknown keys) and writes it verbatim to `.claude/ai-dev-kit.config.json`; a
  violation fails the install before anything is written.
- `--hooks` merges `hooks/installer-hooks.json` into `.claude/settings.json` — only entries
  whose command or args carry the `.claude/hooks/ai-dev-kit/` marker are ever
  replaced; every other setting is preserved. Omit it to wire hooks manually.
  The trust contract for what those hooks may do in a session is pinned in
  [SECURITY.md](SECURITY.md). The kit never writes `permissions` — a
  least-privilege starter allowlist lives in
  [docs/PERMISSIONS.md](docs/PERMISSIONS.md).
- `--dest <path>` targets a different project root (default: cwd).
- `--help` prints usage. Unknown or misspelled flags fail loudly before anything
  is read or written (a typo'd `--dest` can no longer install into cwd silently).
- Writes `.claude/ai-dev-kit.installed.json` (kit + skill versions, no timestamp).
  Idempotent — a second run writes nothing.
- Prunes stale leftovers — files in kit-owned dirs (`.claude/skills/<kit skill>/`,
  `.claude/hooks/ai-dev-kit/`) that no longer exist in kit source (reported).
- Skills in `.claude/skills/` that the manifest doesn't list are left untouched.

Drift guard:

```bash
node ai-dev-kit/install.mjs --check --dest path/to/your-project   # exit 1 + file list on drift or stale leftovers
```

`--check` also re-validates the user-owned `.claude/ai-dev-kit.config.json`
against the adapter schema — ADVISORY on stderr only; the exit code stays
drift/stale-only.

## The adapter contract

Skills read `.claude/ai-dev-kit.config.json` at run time for project parameters —
project type, ecosystem/toolchain, gate commands, the verify recipe (build · run ·
readiness · observations), cache commands, doc paths, commit style, hygiene
targets, dependency policy. Schema:
[adapters/project.schema.json](adapters/project.schema.json) · fixture examples:
web [adapters/next-web-boilerplate.json](adapters/next-web-boilerplate.json) ·
game [adapters/godot-game.json](adapters/godot-game.json) ·
CLI [adapters/rust-cli.json](adapters/rust-cli.json).

Every field is optional — a skill missing a field derives it from the repo (and says
so) rather than failing. After install the config belongs to the project: edit it
freely — `--check` never fails on it (schema issues print an advisory only).

## Automation (hooks)

Eight Claude Code hooks make the lifecycle self-reinforcing. The five advisory
handlers **advise, never block** — they inject a reminder into the agent's
context; the agent decides. The three enforcement handlers (0.23.0) ship wired
but **inert**: each blocks only where the project's user-owned adapter config
carries its `enforcement` key — absent config, the advise-only default is
unchanged.

| Handler | Event · matcher | Fires on |
| --- | --- | --- |
| `dep-check-nudge.mjs` | PostToolUse · `Edit\|Write\|Bash` | package.json edits; pm `add`/`update`/install-with-args |
| `live-verify-reminder.mjs` | PreToolUse · `Bash` (`if: "Bash(git *)"`) | any command segment containing `git … commit` |
| `skill-drift-guard.mjs` | PostToolUse · `Edit\|Write` | direct file-tool edits under `.claude/skills\|hooks/` |
| `context-guard.mjs` | PostToolUse · `Edit\|Write` | edits to `AGENTS.md`/`CLAUDE.md` (any depth), the adapter’s `docs.contextDir`, or agent-memory files (`~/.claude/projects/<slug>/memory/*.md`) — injects the matching context-economy reminder |
| `compact-reorient.mjs` | SessionStart · `compact` | a session resuming from context compaction — injects a one-shot "re-open the status doc + current backlog row; re-verify assumed findings" reorientation (deliberately not wired on startup/resume/clear/fork; the handler also guards on the payload's `source`, so a mis-wired matcher can't widen it) |
| `stop-gate.mjs` · opt-in | Stop | `enforcement.stopGate.commands` at session end — runs in the background via `asyncRewake` (turn ends immediately); a failing command exits 2, waking the agent one turn later with the failure so it isn't missed (generalized from the danger-noodles/smash-gods/wyrd consumer originals) |
| `checkpoint-autorun.mjs` · opt-in | Stop | idle with a dirty tree or unpushed commits (`enforcement.checkpointAutorun`) — blocks once for an autonomous checkpoint turn; loop-guarded (`stop_hook_active` + TTL lock), skips pending-question and mid-rebase stops (ported from next-web-boilerplate) |
| `banned-api-guard.mjs` · opt-in | PostToolUse · `Edit\|Write` | a banned pattern landing under a guarded path (`enforcement.bannedApis` — path-scoped, comment-stripped; the determinism-guard pattern generalized) |

Handlers are pure-Node stdin→stdout scripts (no jq/bash dependency — Windows-safe;
a malformed event exits 0 silently), installed to `.claude/hooks/ai-dev-kit/` and
drift-guarded by `--check` like skills. They are wired **exec-form** — `command:
"node"` plus the `${CLAUDE_PROJECT_DIR}`-anchored handler path as an `args` entry —
so no shell sits between the harness and the handler (the PowerShell/bash quoting
class is gone by construction). Verified-where: handler fire/silent contracts are
smoke-proven in CI on ubuntu + windows; live sessions on recent harness versions
surface the injections consistently (both hook classes, first probe) — the
Windows hook-visibility question is closed (history in
[docs/archive/BACKLOG_WATCH_HISTORY.md](docs/archive/BACKLOG_WATCH_HISTORY.md)).
Reviewed and deliberately **not** automated: a tidy/cache hook and any
calendar/session-counter doc-audit nudge — existing cadence (standing
agreement, husky pre-push, audits on real need) covers them, and a nag would
be noise. The Stop-hook checkpoint rejection was **reversed in 0.23.0** on
consumer evidence (next-web-boilerplate ran it in production sessions) — as
the opt-in `checkpoint-autorun` above, never by default. The full decision log lives in `manifest.json` →
`hooks.reviewed`, which carries an accept/reject verdict for **every one of the
33 hook events the harness documented at the 2026-08-31 review** — the
organizing fact being that only 11 of them can return `additionalContext` at
all, and the other 22 can only block, act, or notify the human. `smoke-hooks`
asserts the log covers the kit-pinned event list, so the pin and the log can't
drift apart; a harness-side addition is caught by `harness-audit`'s changelog
re-fetch, which then moves the pin (harness 2.1.251 added
`PreModelSwitch`/`PostModelSwitch`, both rejected — no `additionalContext`
channel). Hooks changed in `settings.json` load at
session start; an already-running session may need `/hooks` opened once (or a
restart) to pick them up.

## Keep the consumer thin

The harness already always-loads every installed skill's description — a consumer's
`CLAUDE.md` re-cataloging the skills pays for that content twice, every session.
The canonical consumer block is four lines:

```markdown
- Skill library: installed from [ai-dev-kit](https://github.com/jrittelmeyer/ai-dev-kit)
  (versions: `.claude/ai-dev-kit.installed.json` · params: `.claude/ai-dev-kit.config.json`).
  Never edit `.claude/skills/` or `.claude/hooks/ai-dev-kit/` — edit a kit clone, then
  `node <clone>/install.mjs --adapter <clone>/adapters/<project>.json --dest <project>
  --global --hooks`; `install.mjs --check` guards drift.
- Run `/checkpoint` at each step boundary.
```

## Rules

- **Edit skills in the kit, then reinstall.** Never edit `.claude/skills/` directly —
  `--check` exists to catch exactly that.
- **Keep skill bodies generic.** Project facts go in the adapter (mechanical params)
  or the project's agent memory (recipes/gotchas) — never hardcoded in a skill.
- **Skill bodies are eval-gated.** Each skill carries three scenarios in
  `.github/skill-evals/<skill>.json`; every expected behavior anchors to a literal
  the body must still contain, so editing a rule away fails CI instead of passing
  the shape-and-size gates. `node .github/skill-evals.mjs --report` prints the same
  fixtures as a model-graded run sheet for a `harness-audit` pass; add `--delta`
  for a with/without-skill baseline block per scenario, so the grade shows what
  the skill actually earns.
- **Versioning:** semver per skill plus a kit version; bump `manifest.json`, `VERSION`,
  `CHANGELOG.md`, the deck stamps, and `.claude-plugin/plugin.json` together with any
  behavior change (CI gates the six sites). Every release commit gets an annotated tag
  `v<version>` and a GitHub Release built from its CHANGELOG entry. **This is now
  automatic:** `.github/workflows/release.yml` fires on a green CI run against `main`,
  runs `check-release-ready.mjs` against that run's sha, and — on pass — cuts the tag
  and Release via `.github/cut-release.mjs` (no-op if `v<version>` already exists). A
  red or still-running CI can't get tagged (v0.23.0 shipped on a red sha this gate
  exists to catch). `.github/check-release-ready.mjs <sha>` can still be run by hand
  against any sha, and `ci.yml`'s `workflow_dispatch:` lets CI be re-run manually
  against `main` or a tag (GitHub's dispatch API takes a branch/tag ref, not an
  arbitrary sha — for one that never got its own CI run, push a throwaway branch at
  it and dispatch against that).
- **Release titles:** Follow the pattern `v<version> — <subject>` where `<subject>`
  summarizes the shipped feature group or fix (see CHANGELOG entries for examples).

## Roadmap

- **Later:** npm packaging (`npx` install) if consumer demand shows up
  (B4-16), and git-root resolution for `CLAUDE_PROJECT_DIR` when sessions
  launch in a subdirectory — harness-side, watched in
  [docs/BACKLOG.md](docs/BACKLOG.md).
- **Quality bar:** project audit **97.1/100** (ninth pass, 2026-08-31 —
  [report](docs/archive/PROJECT_AUDIT_2026-08-31.md); the full scored chain
  is indexed in [docs/BACKLOG.md](docs/BACKLOG.md)) · harness-currency
  **96.1/100**
  ([HARNESS_AUDIT_2026-08-31](docs/archive/HARNESS_AUDIT_2026-08-31.md)) ·
  model-graded eval evidence **162/162 PASS**
  ([SKILL_EVALS_2026-08-26](docs/archive/SKILL_EVALS_2026-08-26.md)).
  **Next:** B3-50 (mechanize the CHANGELOG Verification-paragraph rule);
  B2-49 shipped 2026-09-02 (release automation — `workflow_dispatch` +
  `release.yml` auto-tag/Release on green CI); B1-47/48 shipped 2026-09-01
  (v0.23.11–v0.23.16 tagged + released, hook-surface verdicts for
  PreModelSwitch/PostModelSwitch recorded).
