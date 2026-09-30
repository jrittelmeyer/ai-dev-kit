# Security policy

## Supported versions

The latest release (highest `v*` tag) is supported. The kit is static skill
files plus a zero-dependency Node installer — no server, no network code, no
package dependency surface; hook handlers are stdin→stdout scripts that
advise by default and block (or, for script-exec-guard, ask the human) only
where the project's own adapter config explicitly opts in.

## What `--hooks` executes in your sessions

`install.mjs --hooks` wires ten hook entries into `.claude/settings.json`;
matching events then run the kit's handlers out of
`.claude/hooks/ai-dev-kit/`. Two contract classes, each handler (and
script-exec-guard's two helper modules) auditable in under 140 lines (kit
source `hooks/`):

- **Six advisory handlers** (dep-check-nudge, live-verify-reminder,
  skill-drift-guard-preedit, skill-drift-guard, context-guard,
  compact-reorient): emit an
  `additionalContext` reminder or exit 0 silently, never block (exit 2 is
  never used), spawn no processes, make no network calls, and read nothing
  beyond the event on stdin plus `.claude/ai-dev-kit.config.json`.
- **Four enforcement handlers** (stop-gate, checkpoint-autorun,
  banned-api-guard, script-exec-guard): **inert — silent exit 0 — unless the
  user-owned adapter config carries a matching `enforcement` key.** Opted in: `stop-gate` is
  wired `asyncRewake: true`, so it runs the commands *you* listed in
  `enforcement.stopGate.commands` (the kit never supplies commands) in the
  background — the turn ends immediately, and a failing command's exit 2
  wakes the agent one turn later with the failure instead of holding the
  turn open; `banned-api-guard` reads the
  just-edited file and exits 2 on a configured banned pattern;
  `checkpoint-autorun` runs read-only `git status`/`git log` queries, writes
  a 10-minute lock file under `.claude/`, and emits a Stop-block asking the
  agent to run the checkpoint skill — setting that flag is the standing
  authorization for checkpoint's own commit+push, so never ship it pre-set in
  a template; `script-exec-guard` reads the script a Bash/PowerShell command
  is about to execute (plus inline `-e`/`-c` code), runs read-only `git
  ls-files`/`git diff` to skip tracked-clean scripts, and answers
  `permissionDecision: "ask"` on a recursive delete of a non-literal or
  critical target — it adds a prompt for the human, never a deny, so it is
  safe to pre-set in a template. No network calls in any handler.

Pure Node stdlib, zero dependencies, per-entry timeouts in the wiring
(10 s per tool-event handler · 300/30 s for the Stop pair), malformed events
exit 0 (BOM'd stdin included). `install.mjs --check` drift-guards the installed copies
byte-for-byte against kit source, so a tampered or stale handler surfaces as
DRIFT — the adapter config itself is user-owned and schema-checked advisory
only.

## Reporting a vulnerability

Use GitHub private vulnerability reporting:
<https://github.com/jrittelmeyer/ai-dev-kit/security/advisories/new> — include
repro steps. Expect an acknowledgment within a week; fixes ship as a normal
versioned release with a CHANGELOG entry.
