# ai-dev-kit

[![CI](https://github.com/jrittelmeyer/ai-dev-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jrittelmeyer/ai-dev-kit/actions/workflows/ci.yml)

A portable, versioned library of agentic-development skills — the working method
distilled from building
[next-web-boilerplate](https://github.com/jrittelmeyer/next-web-boilerplate),
packaged so any project can adopt it. Skill bodies are **generic**; everything
project-specific lives in one small adapter config. One command installs the kit
into a project; re-run it from a fresh clone to stay current.

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
| `live-verify` | Fresh prod build + drive the real flow — behavioral proof before commit | before committing product changes |
| `project-init` | Inception: plan docs / raw idea → discovery + competitive scan → product brief → status/backlog regenerated to a 100 bar | once, on a fresh scaffold |
| `project-adopt` | Brownfield inception: existing codebase → parity contract + theirs-vs-template disposition map → product brief + migration map → port backlog | once, on an existing app |

The intended lifecycle (machine-readable in `manifest.json` → `pipeline`):

```text
orient → plan-gate → [dep-check] → build → live-verify
      → code-review / simplify → checkpoint (→ tidy)
      → periodic: doc-audit · project-audit
```

`project-init` and `project-adopt` sit *before* the loop — the one-time inception
passes. `project-init` turns an idea (or a stack of plan documents) into the
signed-off product brief, mended context docs, and prioritized backlog the loop
then executes. `project-adopt` does the same for a product that **already exists
as code**: it surveys the app into a parity contract, maps every subsystem
theirs-vs-template, and regenerates the docs into a port program that lands the
app surface-identical on the template foundation — with the template's relevant
features lit up.

`code-review`, `simplify`, and `verify` are Claude Code built-ins the kit composes
with rather than reimplements.

## Install into a project

From a clone of this repo (anywhere on disk):

```bash
git clone https://github.com/jrittelmeyer/ai-dev-kit
node ai-dev-kit/install.mjs --adapter ai-dev-kit/adapters/<your-project>.json --dest path/to/your-project --global --hooks
```

- Requires Node ≥ 22 (pure Node, zero dependencies); CI runs the floor (22) and
  current (24) on ubuntu + windows.
- Copies `skills/*` → `<project>/.claude/skills/` (byte-identical) and hook handlers
  (`hooks/*.mjs`) → `.claude/hooks/ai-dev-kit/`.
- `--global` also installs dual-home skills (`doc-audit`) → `~/.claude/skills/`.
- `--adapter <file>` validates the adapter against
  [adapters/project.schema.json](adapters/project.schema.json) (types · enums ·
  unknown keys) and writes it verbatim to `.claude/ai-dev-kit.config.json`; a
  violation fails the install before anything is written.
- `--hooks` merges `hooks/hooks.json` into `.claude/settings.json` — only entries
  whose command or args carry the `.claude/hooks/ai-dev-kit/` marker are ever
  replaced; every other setting is preserved. Omit it to wire hooks manually.
  The trust contract for what those hooks may do in a session is pinned in
  [SECURITY.md](SECURITY.md).
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
package manager, gate commands, prod-verify port, cache commands, doc paths, commit
style, hygiene targets, dependency policy. Schema:
[adapters/project.schema.json](adapters/project.schema.json) · reference example:
[adapters/next-web-boilerplate.json](adapters/next-web-boilerplate.json).

Every field is optional — a skill missing a field derives it from the repo (and says
so) rather than failing. After install the config belongs to the project: edit it
freely — `--check` never fails on it (schema issues print an advisory only).

## Automation (hooks)

Four Claude Code hooks make the lifecycle self-reinforcing. **All of them advise,
never block** — they inject a reminder into the agent's context; the agent decides.

| Handler | Event · matcher | Fires on |
| --- | --- | --- |
| `dep-check-nudge.mjs` | PostToolUse · `Edit\|Write\|Bash` | package.json edits; pm `add`/`update`/install-with-args |
| `live-verify-reminder.mjs` | PreToolUse · `Bash` (`if: "Bash(git *)"`) | any command segment containing `git … commit` |
| `skill-drift-guard.mjs` | PostToolUse · `Edit\|Write` | direct file-tool edits under `.claude/skills\|hooks/` |
| `context-guard.mjs` | PostToolUse · `Edit\|Write` | edits to `AGENTS.md`/`CLAUDE.md` (any depth), the adapter’s `docs.contextDir`, or agent-memory files (`~/.claude/projects/<slug>/memory/*.md`) — injects the matching context-economy reminder |

Handlers are pure-Node stdin→stdout scripts (no jq/bash dependency — Windows-safe;
a malformed event exits 0 silently), installed to `.claude/hooks/ai-dev-kit/` and
drift-guarded by `--check` like skills. They are wired **exec-form** — `command:
"node"` plus the `${CLAUDE_PROJECT_DIR}`-anchored handler path as an `args` entry —
so no shell sits between the harness and the handler (the PowerShell/bash quoting
class is gone by construction). Verified-where: handler fire/silent contracts are
smoke-proven in CI on ubuntu + windows; whether a live session *surfaces* the
injected context is harness-side and currently inconsistent on Windows — tracked
as a Watch row in [docs/BACKLOG.md](docs/BACKLOG.md).
Reviewed and deliberately **not** automated: a Stop-hook checkpoint nag, a
tidy/cache hook, and any calendar/session-counter doc-audit nudge — existing
cadence (standing agreement, husky pre-push, audits on real need) covers them,
and a nag would be noise. Hooks changed in `settings.json` load at session start;
an already-running session may need `/hooks` opened once (or a restart) to pick
them up.

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
- **Versioning:** semver per skill plus a kit version; bump `manifest.json`, `VERSION`,
  `CHANGELOG.md`, and the deck stamps together with any behavior change (CI gates the
  five sites). Every release commit gets an annotated tag `v<version>` and a GitHub
  Release built from its CHANGELOG entry — pushed once CI is green.
- **Release titles:** Follow the pattern `v<version> — <subject>` where `<subject>`
  summarizes the shipped feature group or fix (see CHANGELOG entries for examples).

## Roadmap

- ~~Step 2 — automation~~ **shipped in 0.2.0** (see Automation above).
- ~~Step 3 — playbook + deck~~ **shipped in 0.3.0**
  ([PLAYBOOK.md](docs/PLAYBOOK.md) · [pitch-deck.html](docs/pitch-deck.html)).
- ~~Extract to a standalone repo~~ **shipped in 0.5.0** — this repository;
  consumers (next-web-boilerplate first) install from a clone.
- **Later:** npm packaging (`npx` install) if consumer demand shows up, and
  git-root resolution for `CLAUDE_PROJECT_DIR` when sessions launch in a
  subdirectory (deferred in [0.7.2](CHANGELOG.md)). Exec-form hook entries — the
  other 0.7.2 deferral — shipped in 0.11.0.
- **Quality bar:** audited 2026-08-09 at 90.4/100 (baseline) and **96.9/100**
  after B1–B3 shipped (0.9.0 → 0.11.0); the 2026-08-12 audit verifies
  0.12.0's S-tail by execution and scores **97.4/100** — remaining rows in
  [docs/BACKLOG.md](docs/BACKLOG.md), latest report
  [docs/archive/PROJECT_AUDIT_2026-08-12.md](docs/archive/PROJECT_AUDIT_2026-08-12.md).
