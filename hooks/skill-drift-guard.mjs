#!/usr/bin/env node
/**
 * ai-dev-kit hook — skill-drift guard, Bash twin (PostToolUse: Bash).
 *
 * Fires when a Bash command writes to a path under `.claude/skills/` or
 * `.claude/hooks/` (sed -i, cp, mv, tee, a `>`/`>>` redirect, etc.) —
 * indirect edits an Edit/Write-tool matcher can't see. Installed copies are
 * installer output — direct edits get flagged by `install.mjs --check` and
 * overwritten on the next install. Injects a pointer to the kit source
 * instead. Never blocks; the installer itself writes via Node fs, so
 * legitimate installs never trigger this. Direct Edit/Write-tool edits to
 * the same paths are caught pre-emptively by the PreToolUse twin
 * (skill-drift-guard-preedit.mjs), which fires before the edit lands.
 */
import { readFileSync } from "node:fs";

let input = null;
try {
  let raw = readFileSync(0, "utf8");
  // PowerShell 5.1 pipes BOM-prefix stdin — strip it, or a live event dies
  // into the malformed-input exit below as a false "silent".
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  input = JSON.parse(raw);
} catch {
  process.exit(0); // malformed harness event — advise-only, exit silently
}
const command = String(input?.tool_input?.command ?? "");

const touchesGuardedPath = /\.claude\/(skills|hooks)\//.test(command);
// Write-intent allowlist, mirroring dep-check-nudge's style: a plain `cat` or
// `grep` naming the path is a read, not drift — only fire on commands that
// actually mutate the file.
const writesToIt =
  /(>>?(?!\()|\bsed\s+-i\b|\bcp\b|\bmv\b|\btee\b|\bperl\s+-i\b|\bdd\b|\bpatch\b|\bgit\s+apply\b)/.test(
    command,
  );

if (!touchesGuardedPath || !writesToIt) process.exit(0);

const additionalContext =
  "ai-dev-kit skill-drift guard: a Bash command just wrote to a path under .claude/skills/ or " +
  ".claude/hooks/. Installed copies are installer output — if this file is kit-managed, the " +
  "edit will be flagged by `install.mjs --check` and overwritten on the next install. Make " +
  "the change in a clone of the ai-dev-kit repo (skills/ or hooks/) and re-run the installer " +
  "instead. If the file is not in the kit manifest (a project-local skill), ignore this.";

console.log(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext },
  }),
);
