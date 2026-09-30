# rootstock-os review — 2026-09-30

Source mined: [Mazhron/rootstock-os](https://github.com/Mazhron/rootstock-os)
v1.41 (2026-09-30) — a Python operating discipline for one game project
(15 hooks, 9 ritual skills, a section-read wiki, append-only ledgers, a
subagent "delegation company"). Bar: adopt only what demonstrably helps the
kit; where the harness or the community now ships a more modern, consensus fix
for the same problem, prefer that.

**Finding:** most of rootstock's hook layer is now superseded by Claude Code
itself — the auto-mode classifier (default starting mode since v2.1.283), the
critical-path `rm` circuit breaker, `.git`/`.claude` protected paths, the
subagent concurrency/depth caps (July 2026), the Read tool's PARTIAL view,
CLAUDE.md startup size warnings, and auto memory. One gap stays open and is
documented: destructive code inside a **script file** the agent wrote, then
ran. The harness, [dcg](https://github.com/Dicklesworthstone/destructive_command_guard)
and [cc-safety-net](https://github.com/kenryu42/claude-code-safety-net) all
inspect command text and inline `-c` scripts only;
[anthropics/claude-code#88462](https://github.com/anthropics/claude-code/issues/88462)
(Aug 2026, auto mode) is the fifth home-directory loss of that class (#29082,
#32938, #49129, #70687 closed `not_planned`). Rootstock's `preserve_guard`
RUN rule is the only one of these that scans executed scripts.

## Verdicts

| Rootstock feature | Verdict | Reason / modern replacement |
|---|---|---|
| `preserve_guard` RUN rule — scan scripts a command executes | **Adopt, narrowed** → B1-56 | The one gap the harness, dcg and cc-safety-net all leave open |
| `bash_guard` / `preserve_guard` on command text | No | Harness-native: the classifier blocks force-push, `reset --hard`, `clean -fd`, stash drop by default; the critical-path breaker refuses `rm` of `/`, `~`, cwd, `"$VAR"/*`, `$(pwd)` in every mode, including inside `bash -c`; ask rules parse compound commands |
| Delete grant (owner says yes twice) | No | The harness `ask` prompt is the consent channel |
| `fanout_guard` (burst/flood/velocity) | No | Harness: 20 concurrent subagents, spawn depth 3 (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`) |
| `diet_guard` (refuse first whole read over 10k tokens) | No | Read returns a PARTIAL view with offset/limit guidance; Bash output spills to a file past ~30k chars; PLAYBOOK #5 covers the habit |
| `format_guard` (refuse settings edits that unwire hooks) | No | `.claude/` is a harness protected path — writes are never auto-approved outside bypassPermissions |
| `check_claude_md.py` (200 lines / 2k tokens) | No | The harness warns at startup per file and on combined size (CLAUDE.md, rules, `@imports` each count); `/doctor` trims; `/doctor prompt-audit` finds conflicts. Next harness-audit: re-score doc-audit hunt 7 and `inventory.mjs` against these |
| SessionStart standup digest · `stop_tick` context gauge · PreCompact ledger | No | Already rejected in `manifest.json` `hooks.reviewed`; auto memory loads MEMORY.md every session; compact-reorient + checkpoint cover re-orientation |
| `session_end` auto-checkpoint (commit + push at exit) | No | An unattended push that skips the gate; opt-in `checkpoint-autorun` covers a dirty tree |
| `lesson_advisor` (Stop refusal on trial-and-error) | No | retro skill + checkpoint's three strikes + harness auto memory; a per-turn Stop block breaks advise-by-default |
| `brief_guard` · `delegation_auditor` · `verify_advisor` | No (as hooks) | Heavy ritual, and the parent doesn't reliably receive a subagent's tool-use counts. The transferable core — cite and spot-check — is B1-57 |
| Route line (UserPromptSubmit) | No | The harness routes on skill descriptions; UserPromptSubmit is already rejected as noise |
| Intent log · correction ledger · agreement rate | No | plan → sign-off → build + auto memory `feedback` notes with their Why |
| Format law · purpose audit · FLAGS | No | manifest + skill-lint + evals already index purpose |
| Graft log / update policies | No | Byte-drift `--check` + plugin marketplace + stale-prune |
| Wiki Tags index · heat map · core diet | No | Archive pattern + context tiers + harness path-scoped `.claude/rules/` |
| `usage_report` weighted bill | No | `/usage` / `/cost`, OpenTelemetry export, or ccusage |
| Security method: client-bundle secret sweep + rotate-first | **Adopt** → B1-57 | A fresh prod build is the cheapest moment to catch a server secret inlined into client JS |
| Security method: headers, CORS, exposed files, manual classes | No | project-audit's Security axis + the built-in `/security-review` |

Rootstock lessons folded into B1-56's build: harden against an incident by
writing it as pipe-test cases *before* the guard code; a guard must never fail
open on its own exception (crude-substring fallback); judge tracked scripts on
uncommitted added lines, untracked scripts on the whole body.

## Sources (fetched 2026-09-30)

- rootstock-os: README, HOOKS_METHOD, SUBAGENT_METHOD, WIKI_METHOD,
  REPORTING_METHOD, LESSONS, SKILLS, INTENT_METHOD, SECURITY_METHOD.
- Claude Code docs: [hooks](https://code.claude.com/docs/en/hooks) (`ask`
  escalates to the user even in auto mode) ·
  [permission modes](https://code.claude.com/docs/en/permission-modes)
  (classifier defaults, critical paths, protected paths) ·
  [permissions](https://code.claude.com/docs/en/permissions) (compound-command
  parsing) · [sandboxing](https://code.claude.com/docs/en/sandboxing) (no
  native Windows) · [memory](https://code.claude.com/docs/en/memory) (size
  warnings, rules, AGENTS.md) ·
  [sub-agents](https://code.claude.com/docs/en/sub-agents) (20 concurrent,
  depth 3) · [tools](https://code.claude.com/docs/en/tools-reference) (Read
  PARTIAL view).
- Incidents: [#88462](https://github.com/anthropics/claude-code/issues/88462)
  (script file, auto mode) ·
  [#93099](https://github.com/anthropics/claude-code/issues/93099) (direct
  command, acceptEdits) ·
  [#82471](https://github.com/anthropics/claude-code/issues/82471) ·
  [#68110](https://github.com/anthropics/claude-code/issues/68110) (subagent
  fan-out).
- Client-bundle leaks: [vibe-eval 2026 report](https://vibe-eval.com/data-studies/frontend-secrets-leak-report-2026/) ·
  [Supabase service_role exposure](https://vibeappscanner.com/security-issue/supabase-exposed-api-keys).
