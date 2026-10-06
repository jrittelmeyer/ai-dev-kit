#!/usr/bin/env node
/**
 * ai-dev-kit hook — skill-drift guard, Bash|PowerShell twin (PostToolUse:
 * Bash|PowerShell).
 *
 * Fires when a Bash or PowerShell command writes to a path under
 * `.claude/skills/` or `.claude/hooks/` (sed -i, cp, mv, tee, a `>`/`>>`
 * redirect, Set-Content, Copy-Item, Move-Item, etc.) — indirect edits an
 * Edit/Write-tool matcher can't see. Installed copies are
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

const GUARDED = /\.claude[\\/](skills|hooks)[\\/]/;
// Write intent is anchored to the guarded path, not merely co-present with
// it (0.24.7, B1-59): a read-only command that names a guarded path and also
// carries `2>&1`, a redirect elsewhere, a copy *out* of the tree, or a writer
// in another pipeline segment is a read, not drift — the pre-0.24.7 regex
// fired on exactly that (`node .claude/skills/x/scripts/y.mjs 2>&1 | head`).
// Each pipeline/chain segment is judged on its own: a segment writes to a
// guarded path when (1) a redirect's *target* is guarded, (2) an in-place
// writer names a guarded operand, or (3) a copy/move's *destination* is
// guarded. Plain `cat`/`Get-Content`/`grep`/`Select-String` never match.
const IN_PLACE =
  /\b(sed\s+-i|perl\s+-i|tee|dd|patch|git\s+apply|Set-Content|Add-Content|Out-File|New-Item|Rename-Item)\b/i;
const COPY = /\b(cp|mv|Copy-Item|Move-Item)\b/i;

function segmentWrites(seg) {
  if (!GUARDED.test(seg)) return false;
  // (1) `> path`, `>> path`, `1> path`, `&> path`. `2>&1` yields no target
  //     (`&` is excluded), `>/dev/null` and `> /tmp/out` target elsewhere.
  const redirect = />>?\s*["']?([^\s"'|;&<>()]+)/g;
  for (let m; (m = redirect.exec(seg)); ) if (GUARDED.test(m[1])) return true;
  // (2) the writer and the guarded operand share a segment.
  if (IN_PLACE.test(seg)) return true;
  // (3) destination = `-Destination <path>` if given, else the last operand.
  if (COPY.test(seg)) {
    const dest = /-Dest(?:ination)?\s+["']?([^\s"']+)/i.exec(seg);
    if (dest) return GUARDED.test(dest[1]);
    const operands = seg
      .replace(/^[\s(]*[\w.-]*(cp|mv|Copy-Item|Move-Item)\b/i, "")
      .split(/\s+/)
      .filter((t) => t && !t.startsWith("-"))
      .map((t) => t.replace(/^["']|["']$/g, ""));
    return operands.length > 0 && GUARDED.test(operands[operands.length - 1]);
  }
  return false;
}

const writesToIt = command.split(/\r?\n|\|\|?|&&|;/).some(segmentWrites);

if (!writesToIt) process.exit(0);

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
