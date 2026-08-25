# Fleet upgrade plan — all consumers to kit-current context engineering

_Date: 2026-08-25 · Kit: ai-dev-kit 0.22.0 (`dd3b002`) · Scope: next-web-boilerplate, civicmatch, smash-gods, danger-noodles, wyrd_

Produced from five parallel audits (one per project) against kit 0.22.0. Each audit ran
`install.mjs --check`, inventoried `.claude/`, context files, project-local tooling, and agent memory.

## State of the fleet (summary)

| Project | Kit state | `--check` | Critical finding |
| --- | --- | --- | --- |
| **wyrd** | 0.22.0, zero drift — best install | exit 0 | **Entire hook/skill layer inert**: sessions launch from `Games\` parent cwd, so `wyrd\.claude\settings.json` is never loaded. All 8 wired hooks (incl. stop-gate, rng-determinism-guard) have never fired. |
| **next-web-boilerplate** | 0.18.0 (4 behind) | exit 1, 9 files | `compact-reorient.mjs` installed but never wired (no SessionStart block); stale `live-verify-reminder` has the newline false-fire bug kit 0.21.0 fixed. |
| **civicmatch** | 0.13.0 (9 behind) | exit 1, 33 files | `harness-audit` + `retro` never installed; `compact-reorient` hook missing entirely (and compaction is frequent there — 2–3 MB session transcripts). |
| **danger-noodles** | Not installed — deliberate hand-fork (2026-08-12) | exit 1, 33 missing | **Live Windows BOM bug in all 7 hooks** (forked pre-fix): PowerShell 5.1 BOM-prefixed stdin silently no-ops them; `protect-golden` fails open. ~194 KB (~50k tokens) of mandated session-start backlog reading. |
| **smash-gods** | Not installed — deliberate hand-fork (danger-noodles lineage) | exit 1, 33 missing | Same BOM bug in all 5 hooks (incl. blocking determinism-guard + stop-gate — may never have fired). Forked dep-check contains dead "until ADR 0001 decides" text (decided 6 days ago). |

All five are TS/node stacks — the kit's `godot-game.json` fixture fits none of them; the games need
node-runtime `projectType: "game"` adapters (wyrd's hand-written one is the correct template).

## Things the projects do BETTER than the kit (upstream candidates → kit 0.23.0)

1. **Hook unit-test harness** (danger-noodles `tests/claude-hooks.test.ts`) — drives every hook exactly as the harness does (stdin JSON → exit code). The kit ships 5 hooks with zero tests. Strongest single idea in the fleet.
2. **Budget-as-test** (both games, `tests/claude-md-budget.test.ts`) — CLAUDE.md line budgets as red tests, not advisory reminders. Motivated by three consecutive milestone audits catching drift only by human review.
3. **Blocking Stop gate** (both games + wyrd, `stop-gate.mjs`) — typecheck + tests on Stop, `exit 2` feeds failures back; loop-guarded via `stop_hook_active`. Kit has no Stop hook at all. Upstream as an opt-in, `adapter.gate`-driven generalization (currently hardcoded to npm commands).
4. **Domain banned-API guard** (determinism-guard / rng-determinism-guard) — path-scoped blocking PostToolUse guard; generalize as adapter-configured "banned patterns under path X".
5. **Contrarian plan-gate subagent** (nwb + civicmatch: `agents/contrarian.md` + ExitPlanMode `contrarian-nudge.mjs`) — standing red-team dissent before plan sign-off. Kit has no subagent concept.
6. **`docs-sanity.mjs` CI gate** (nwb) — six deterministic doc-quality checks incl. bidirectional hook↔settings wiring agreement (would have caught nwb's own dead hook if it scanned `hooks/ai-dev-kit/`). CI-enforced version of doc-audit's hand hunts.
7. **checkpoint-autorun Stop hook** (nwb) + **segment-aware checkpoint-nudge** (civicmatch) — falsify the kit's recorded "checkpoint deliberately not hook-automated" decision; route via `retro`, offer as opt-in.
8. **Dated-suppression expiry guard** (civicmatch `check-audit-ignores.mjs`) — every audit-ignore needs an inline discharge date; fails closed. dep-check has no analogue.
9. **Dual-backlog schema slot** (both games + wyrd: agentic vs human-blocked backlogs, "never both blocked at once") — schema has a single `docs.backlog`; add `docs.backlogHuman`.
10. **Deferred-machinery ledger** (smash-gods) — machinery-not-yet-built table with arrival triggers; "a law without a hook/test/lint is a wish."
11. **Installer message fix** — `--check` reports a never-installed dest as "DRIFT in 33 file(s) … edit kit source" — misleading; add a distinct never-installed branch.
12. **Schema decision** — nwb's config carries `contextBudget.skillDescriptionMaxTokens: 909` (unknown key, advisory): either add to schema + adapter, or drop from the project config.

## Phased plan

### Phase 0 — critical fixes + trivial hygiene (do first, ~1 session)
- **BOM-patch all 12 game hooks** (dn ×7, sg ×5): add the kit's `charCodeAt(0) === 0xfeff` strip. This is a live silent-failure bug on this exact machine; independent of any adoption decision.
- **wyrd launch practice**: start sessions from `…\Games\wyrd` (not `Games\`) — un-inerts the whole harness and creates a proper per-project memory slug. Same rule for all Games projects.
- Delete: empty `Web\civicmatch;C` dir; stale `.claude/scheduled_tasks.lock` in nwb (2026-07-12, orphaned); `wyrd/tools/_live_verify_a15.mjs` scratch.
- Move `Games\ROGUELIKE-DECKBUILDER-PROGRAM-BRIEF.md` (48 KB, wyrd's) into the wyrd repo.

### Phase 1 — kit 0.23.0 upstream release (before reinstalling anyone)
Land the upstream candidates that change the install surface, so consumers install once:
- Hook self-tests in kit CI (idea 1); stop-gate generalization behind adapter opt-in (3); banned-API guard generalization (4); contrarian agent + nudge as installable optional assets (5); `docs.backlogHuman` + `skillDescriptionMaxTokens` schema keys (9, 12); installer never-installed message (11); dep-check discharge-date guard reference (8); retro entries for the checkpoint-automation falsification (7). docs-sanity (6) and budget-as-test (2) as templates/references.
Not all must ship in one release — minimum bar for Phase 2/3: schema keys, installer message, stop-gate + banned-API generalization (games need these), optional-assets mechanism for contrarian.

### Phase 2 — web consumers to current (each ~1 short session)
- **next-web-boilerplate**: reinstall (`install.mjs --adapter adapters/next-web-boilerplate.json --dest … --global`); wire `SessionStart`/`compact` block; resolve `skillDescriptionMaxTokens` per Phase 1 decision; update `memory/ai-dev-kit-program.md` version; extend `docs-sanity.mjs` check 4 to scan `hooks/ai-dev-kit/` against its `hooks.json`; move the `--hooks`-omission rationale + trim contrarian policy out of CLAUDE.md into CONVENTIONS/DECISIONS (~recover half the always-loaded file); refresh VERIFICATION.md/PROJECT_STATUS.md staleness; queue `docs/context` splits (DATABASE/DEPLOYMENT/TESTING/DECISIONS all >3× own budget).
- **civicmatch**: reinstall with `--global --hooks` (config preserved; gains harness-audit, retro, compact-reorient + hooks.json); fix `.gitignore` to cover `.claude/scratchpad/`; drop hardcoded "0.3.0" from CLAUDE.md; dedupe the hook-marker rationale (CLAUDE.md ×2 + both hook headers → one place); refresh BACKLOG.md header (rows 117 → 142); slim the 4 over-budget memory files + delete 120 KB preslim archive; prune the dead cross-project permission in settings.local.json; queue remaining context-doc splits (DECISIONS.md is 18× budget); revisit the silently load-bearing `tidy` skillOverride.

### Phase 3 — games adoption (decision point, then ~1 session each)
**Recommendation: hybrid adoption** for danger-noodles + smash-gods — install the kit with proper node game adapters (wyrd's as template), which brings the skills they lack (live-verify + `references/game.md`, retro, harness-audit, tidy, doc-audit, current dep-check) and drift-checking; **delete the forked duplicates** (dep-check skill fork, context-guard/dep-check-nudge hook forks) in favor of kit copies; **keep the bespoke enforcement layer** (stop-gate, determinism-guard, protect-golden, validate-data, format-hook, and the unique skills: add-weapon, tune-feel, desync-hunt, new-adr, playtest-checklist) wired alongside. Rationale: the 2026-08-12 "no kit" decision's premises have expired (no remote → remote exists; "premature before later milestones" → M2–M5 code-complete), and the fork is now 10 kit versions of fixes behind. Alternative (keep fully bespoke, hand-port kit fixes) preserves purity but re-creates the drift problem permanently. **Needs Jonathon's sign-off since the bespoke choice was deliberate.**
- Per-project follow-ons: dn — collapse 231-line handoff skill onto kit checkpoint, fix expired "no remote" deferrals, rotate 292 KB history.md, split the 194 KB session-start backlog mandate; sg — archive spent interview artifacts (1,227 lines), discharge the fully-✓ machinery ledger, dedupe the handoff instruction (stated in 4 places), fix "2 advise-only hooks" staleness, trim CLAUDE.md status provenance.
- **wyrd** (already current): fix adapter (`gate: ["npm run ci"]`, add cache/hygiene/exactPin, refresh verify.notes); create `docs/archive/` and split DECISIONS.md; fix CLAUDE.md broken `docs/history.md` pointer + collapse the duplicated status blocks (~40 lines); split shared `Games` memory into per-project slugs and slim `wyrd-project.md` (5,720 tok, 3.8× cap → durable facts only).

### Phase 4 — fleet convergence check
Re-run `install.mjs --check` on all five (expect exit 0 or advisory-only), run `harness-audit` on one web + one game consumer, and store the fleet state in kit memory. Success = every project on kit-current skills/hooks or a documented, current equivalent; no silent hook failures; always-loaded context within each project's own budgets.

## Decision points for Jonathon
1. **Games adoption path** (Phase 3): hybrid (recommended) vs stay-bespoke-and-port vs full conversion.
2. **`skillDescriptionMaxTokens`**: adopt into schema or drop from nwb config.
3. **Checkpoint automation**: promote nwb's Stop-hook autorun to an opt-in kit feature (reverses a recorded kit decision).
