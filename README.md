# ai-dev-kit

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
| `checkpoint` | Commit + push, context-health verdict, continue or hand off with a resume prompt | every step boundary |
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

- Copies `skills/*` → `<project>/.claude/skills/` (byte-identical) and hook handlers
  (`hooks/*.mjs`) → `.claude/hooks/ai-dev-kit/`.
- `--global` also installs dual-home skills (`doc-audit`) → `~/.claude/skills/`.
- `--adapter <file>` validates the adapter JSON and writes it verbatim to
  `.claude/ai-dev-kit.config.json`.
- `--hooks` merges `hooks/hooks.json` into `.claude/settings.json` — only entries
  whose command carries the `.claude/hooks/ai-dev-kit/` marker are ever replaced;
  every other setting is preserved. Omit it to wire hooks manually.
- `--dest <path>` targets a different project root (default: cwd).
- Writes `.claude/ai-dev-kit.installed.json` (kit + skill versions, no timestamp).
  Idempotent — a second run writes nothing.
- Skills in `.claude/skills/` that the manifest doesn't list are left untouched.

Drift guard:

```bash
node ai-dev-kit/install.mjs --check --dest path/to/your-project   # exit 1 + file list on drift
```

## The adapter contract

Skills read `.claude/ai-dev-kit.config.json` at run time for project parameters —
package manager, gate commands, prod-verify port, cache commands, doc paths, commit
style, hygiene targets, dependency policy. Schema:
[adapters/project.schema.json](adapters/project.schema.json) · reference example:
[adapters/next-web-boilerplate.json](adapters/next-web-boilerplate.json).

Every field is optional — a skill missing a field derives it from the repo (and says
so) rather than failing. After install the config belongs to the project: edit it
freely (`--check` doesn't police it).

## Automation (hooks)

Three Claude Code hooks make the lifecycle self-reinforcing. **All of them advise,
never block** — they inject a reminder into the agent's context; the agent decides.

| Handler | Event · matcher | Fires on |
| --- | --- | --- |
| `dep-check-nudge.mjs` | PostToolUse · `Edit\|Write\|Bash` | package.json edits; pm `add`/`update`/install-with-args |
| `live-verify-reminder.mjs` | PreToolUse · `Bash` (`if: "Bash(git *)"`) | any command segment containing `git … commit` |
| `skill-drift-guard.mjs` | PostToolUse · `Edit\|Write` | direct file-tool edits under `.claude/skills\|hooks/` |
| `context-guard.mjs` | PostToolUse · `Edit\|Write` | edits to `AGENTS.md`/`CLAUDE.md` (any depth) or the adapter's `docs.contextDir` — injects the standing-instruction-economy reminder |

Handlers are pure-Node stdin→stdout scripts (no jq/bash dependency — Windows-safe),
installed to `.claude/hooks/ai-dev-kit/` and drift-guarded by `--check` like skills.
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
  and `CHANGELOG.md` together with any behavior change.

## Roadmap

- ~~Step 2 — automation~~ **shipped in 0.2.0** (see Automation above).
- ~~Step 3 — playbook + deck~~ **shipped in 0.3.0**
  ([PLAYBOOK.md](docs/PLAYBOOK.md) · [pitch-deck.html](docs/pitch-deck.html)).
- ~~Extract to a standalone repo~~ **shipped in 0.5.0** — this repository;
  consumers (next-web-boilerplate first) install from a clone.
- **Later:** npm packaging (`npx` install) if consumer demand shows up.
