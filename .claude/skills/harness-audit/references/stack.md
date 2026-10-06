# Recommended stack — verified per harness-audit run

<!-- lint-ok: dated-file — every recommendation below is stamped with its verification date; harness-audit step 3 re-verifies and updates this file each run. -->

## Contents

- Baseline tool servers (dev projects)
- Per-domain servers
- Harness-native tooling (skill-doctor · prompt-audit · plugin eval · plugin validate · Mods)
- Distribution channels (own marketplace · Anthropic's directory · payload hygiene)
- Adjacent tooling (task stores · spec kits · harness evolution · state-of-2026 study · permissions)

The doctrine is **lean**: every always-connected tool server pays a
per-session context cost, so the default set stays small and everything else
is documented, not wired. Entries carry the date they were last verified
against the live ecosystem.

Landscape source: **registry.modelcontextprotocol.io** (the servers repo's
third-party list was retired 2026-04-14; verified 2026-08-25, re-confirmed
2026-08-31 and 2026-10-05 — resolves as the official registry, no successor
notice).

## Baseline tool servers (dev projects) — verified 2026-08-23, re-confirmed 2026-10-05

- **Forge server** (GitHub MCP or the forge's equivalent) — PRs, issues, CI
  from the conversation. Skip when the `gh`/`glab` CLI already covers the
  workflows (CLI calls cost no standing context).
- **Context7** — version-correct library docs on demand; highest value when
  building against fast-moving frameworks. The 2026-10-05 sweep's consensus
  "starter set" is Context7 + a filesystem server + a git server, at roughly
  2–5k tokens of schema per connected server and a 3–6 server ceiling —
  the same lean rule as here; a Claude Code session already has files and
  git through its own tools, so the kit's dev-project default stays **zero**.
- **Playwright MCP** — real-browser driving for web verification
  (accessibility-tree based, no vision model needed); pairs with
  live-verify's web reference. **Prefer the Playwright CLI when the agent
  has filesystem access** (Claude Code does): the 2026-08-31 sweep found
  the CLI route roughly 4× more token-efficient than the MCP server, which
  is the same conclusion as the lean doctrine — connect the server only
  when the agent cannot run the CLI itself.

## Per-domain servers — verified 2026-08-23, re-confirmed 2026-10-05

- **Unity**: the official Unity CLI ships a first-party MCP server (editor/
  scene control).
- **Unreal**: first-party experimental MCP plugin since UE 5.8.
- **Godot**: community servers (gdai-mcp and peers) — pin by repo/commit.
- **Vite-hosted web/game clients** (added 2026-08-31): a class of community
  "Vite MCP" servers drives Chrome via Playwright against the dev server and
  streams HMR events and console output back — a verification surface for a
  browser-rendered game, same standing as the engine servers below.
  Documented, not wired: the Playwright CLI plus a normal `vite` dev server
  covers the same loop at zero standing cost.
- Games note: engine servers are verification surfaces for live-verify's
  game reference, not always-on defaults — connect for the session that
  needs editor control.

## Harness-native tooling — evaluated 2026-10-05

The harness itself now ships instruments that overlap this kit's audit and
eval layer. Each is recorded with its standing so the next run doesn't
re-propose it.

- **`/skill-doctor`** (v2.1.252+): per-skill context cost and invocation
  count for the current user; flags never-invoked skills. It is the
  *observed-use* half that `inventory.mjs` (static cost) lacks — **adopt as a
  §1 input** when the audit runs inside Claude Code; the inventory script
  stays the portable, headless path. Not available in sessions that skip
  feature-flag fetching.
- **`/doctor prompt-audit [path]`** (v2.1.283): audits CLAUDE.md/AGENTS.md,
  rules, skills, agents and commands for older-model prompt patterns, stale
  paths and contradicting files. Overlaps §4's description/body rubric from
  the harness's own side — **adopt as a §4 mechanical input** where the
  binary exists; it does not replace the judgment diff (no ecosystem
  knowledge, no hook or packaging coverage).
- **`claude plugin eval`** (v2.1.269+): native with-arm/without-arm evals
  over `evals/<case>/{prompt.md, graders/}` in a plugin, six grader types,
  `--threshold` for CI. Real model calls per run (3 runs × 2 arms per case
  by default). **Documented, not adopted** for the kit's own fixtures: the
  kit's `.github/skill-evals/<skill>.json` anchors double as zero-cost CI
  checks and `--report --delta` already produces the with/without grading
  at the session's tier; a native suite would ship to every consumer via
  the plugin cache (the B4-31 payload) and bill every CI run. Re-evaluate
  if a consumer wants a CI-gated behavioral score rather than anchor
  resolution.
- **`claude plugin validate --strict`** (v2.1.233+): frontmatter + manifest
  linter, warnings fatal. Still **not a gate step** — requires the binary in
  CI; `skill-lint` covers the same failure class with zero dependencies.
  Worth one manual run before a release that touches `plugin.json`.
- **Claude Mods** (v2.1.287, 2026-10-01): plugins may ship a JS/TS
  `register(on, options)` module that runs *inside* the harness — deny or
  answer a `tool.call`, override a `tool.check` decision, rewrite prompts and
  skill text, draw panes. Settings hooks surface to mods as `classic.<Event>`.
  **Documented, not adopted:** the kit's contract is zero-dependency,
  portable, advise-by-default handlers a consumer can read in one screen
  (SECURITY.md's 140-line bound); a mod is in-process code with filesystem,
  network and model access, governed by managed-settings guards
  (`allowManagedModsOnly`, `allowModsToOverrideDenyRules`) the kit cannot
  assume. Re-evaluate only if a kit invariant needs a *decision* (not a
  nudge) that a PreToolUse `permissionDecision` cannot express.

## Distribution channels — verified 2026-10-05

- **Own marketplace** (`.claude-plugin/marketplace.json`, `source: "./"`):
  the kit's current route; unchanged.
- **Anthropic's directory** (claude.ai/directory, developer portal): a third
  channel since 2026-Q3 — paid plan + GitHub repo + portal review; a listing
  reaches claude.ai, Cowork and Claude Code (as `<name>@synced`). **Not
  pursued:** the kit's hooks and adapter contract are Claude-Code-only
  components (per the platform-support table), and the install-time adapter
  step has no equivalent in a synced install.
- **Payload hygiene** (re-verified 2026-10-05): still no exclusion
  mechanism — no `files` field, no `.pluginignore`, no `.claudeignore` (the
  open feature request under that name is about *context* exclusion, not
  the cache copy). The only filter is positional: files outside the plugin
  directory aren't copied. The community workaround is exactly B4-31's
  restructure — move the runtime tree into a dedicated subdirectory and
  point `source` at it (a 291 MB install reduced ~60% in one published
  case). Verdict unchanged: advised against at current scale.

## Adjacent tooling — evaluated 2026-08-23, re-confirmed 2026-10-05

- **Agent task/memory stores** (e.g. Beads — git-backed graph issue tracker):
  strong for long-horizon multi-agent programs; overlaps this kit's
  checkpoint/resume-prompt + backlog discipline, so it's documented, not a
  kit dependency. Re-evaluate if a program outgrows single-session handoffs.
- **Spec-driven kits** (GitHub Spec Kit, OpenSpec): the plan → sign-off →
  build discipline plus the inception skills already cover the pattern here;
  adopt one only if a team standardizes on its artifact format.
- **Harness-evolution tooling** (evaluated 2026-08-31): the "harness
  engineering" pattern — observability-driven, automatic evolution of an
  agent harness with multi-agent proposers and worktree isolation — now has
  named plugins and an academic literature. It is the automated form of
  what `harness-audit` + `retro` do by hand; not adopted while the audit
  cadence is quarterly and the surface is one repo. Re-evaluate at
  portfolio scale.
- **State of harness engineering, 2026** (sweep 2026-10-05; a 246-repo /
  57-paper study published 2026-09-24): 63% of large OSS projects ship an
  instruction file (median root file 123 lines — AGENTS.md's ~100-line
  target holds), only 22 declare a PreToolUse hook, 60% have neither tests
  nor evals for their harness, and only 12 commit deny rules. Its five
  practices — test and evaluate the harness · minimize scope (build from
  failures, not speculation) · enforce via code, not prose · let agents run
  the app · monitor production use — map onto this kit's eval fixtures,
  advise-by-default hooks, script-backed guards and live-verify; the fifth
  (observed use) is `/skill-doctor`'s territory above. No new row.
- **Permissions**: least-privilege starter and doctrine live in the kit's
  `docs/PERMISSIONS.md`.
