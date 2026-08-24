# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Every row enters plan → sign-off → build.

Source: [PROJECT_AUDIT_2026-08-24](archive/PROJECT_AUDIT_2026-08-24.md)
(aggregate 96.8/100, fifth audit — a deliberate decrease: the 0.14.0–0.19.0
surface is strong, but the pass found doc drift plus a hook-surface currency
gap). Chain: [90.4](archive/PROJECT_AUDIT_2026-08-09.md) →
[96.9](archive/PROJECT_AUDIT_2026-08-09-post-B3.md) →
[97.4](archive/PROJECT_AUDIT_2026-08-12.md) →
[97.9](archive/PROJECT_AUDIT_2026-08-19.md) → 96.8. Harness-currency baseline
[92.4](archive/HARNESS_AUDIT_2026-08-23.md); its rows 20–22 closed in
0.17.0–0.19.0.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 23 | hooks | Re-review the harness's ~31-event surface; record an accept/reject verdict per event in `manifest.json`, wire any that clear the automation-review bar | Hooks +3 | M |
| B1 | 24 | installer | Fix `install.mjs` docblock + `--help` to name `hooks/installer-hooks.json` as the `--hooks` merge source; add a smoke assert so it can't drift again | Installer +1, Testing +1 | S |
| B1 | 25 | skills | `harness-audit`'s documented `node scripts/inventory.mjs` fails from a project root (the path is skill-relative) — fix the body and the script's usage line | Lifecycle +1 | S |
| B2 | 26 | testing | `smoke-hooks` tally counts every assertion (53), not just the case arrays (42) | Testing +1 | S |
| B2 | 27 | hooks | `compact-reorient` guards on the payload's `source === "compact"`; smoke fixtures carry `source`; record a verdict for the new `fork` matcher | Hooks +1 | S |
| B2 | 28 | testing | Run and archive a model-graded `skill-evals --report` pass, so eval presence is effectiveness-backed rather than anchor-backed | Testing +1 | M |
| B2 | 32 | hooks | `live-verify-reminder` false-fires on multi-line commands — its segment-boundary class `[^\|&;]` omits newlines, so `git` on one line + the word `commit` on another (e.g. `gh run list --commit`) matches. Add `\n`/`\r` to the class; smoke the multi-line case | Hooks +1 | S |
| B3 | 29 | testing | `skill-lint` enforces the spec's reserved-word rule (`name` may not contain "anthropic"/"claude") | Testing +1 | S |
| B3 | 30 | docs | Add a `plugins-reference` row to `harness-audit`'s `sources.md` — the auto-discovery + version-management authority the packaging route depends on | Docs +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (partially superseded by the plugin marketplace) | Public +1 | M |
| B4 | 31 | packaging | Plugin payload hygiene — `source: "./"` ships the whole repo to every consumer's cache; no exclusion mechanism exists, so this needs a restructure. **Advised against** at current scale | Public +1 | L |

Watch (externally gated, re-check each audit):

- Harness-side git-root resolution for `CLAUDE_PROJECT_DIR` when sessions
  launch in a subdirectory (kit-side share closed by B1-1). Re-checked
  2026-08-09, 2026-08-12, 2026-08-19, and **2026-08-24**: changelog swept
  through head 2.1.241 with no entry on root resolution (2.1.239's
  `metadata.pluginRoot` and 2.1.229's marketplace `command` sources are
  packaging, not resolution). The hooks doc now defines the placeholder as
  "the project root **where the session started**" — moved from the previously
  recorded "the project root" — and adds an explicit worktree carve-out
  (`${CLAUDE_PROJECT_DIR}` stays at the original root when Claude enters a
  worktree). Subdirectory launches remain unspecified — gate not lifted.
- Harness-side hook-injection visibility on Windows (B1-17 outcome, closed
  2026-08-09): a fresh exec-form session's deterministic instruments —
  context-guard probe (memory-file Write) and live-verify `git commit` (run
  via the Bash tool) — both drew no injection across both hook classes,
  matching the 0.11.0-build session (×3 events); the 0.10.1-build session
  had recorded fires. Kit exonerated in-situ — installed handlers
  hash-identical to source, local smoke green on the same Windows machine, CI
  green on windows-latest — so the open layer is harness spawn/display. Both
  classes proven visible on Windows 2026-08-12; every session on harness
  ≥ 2.1.228 has fired both classes on their **first** probe with zero misses;
  the one late-onset session (2.1.226, PostToolUse 2/8) predates that version.
  Full per-session observation log in kit memory. A silent probe = an
  intermittency datapoint; only a full-session all-silent run matching
  2026-08-09 reopens visibility. The known same-class mechanism (BOM-prefixed
  stdin parse-failing into a silent exit) is closed at the handler as of
  0.14.0. Re-confirmed 2026-08-24: the hooks contract still grants
  `additionalContext` to `PreToolUse`, `PostToolUse`, and `SessionStart`, so
  all five handlers target supported events.
