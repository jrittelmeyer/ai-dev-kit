#!/usr/bin/env node
/**
 * ai-dev-kit OPTIONAL hook — contrarian nudge (PreToolUse: ExitPlanMode).
 *
 * Not installed by install.mjs: copy it to `.claude/hooks/` (the repo-owned
 * dir, NOT `.claude/hooks/ai-dev-kit/` — the installer prunes that dir and
 * strips settings.json entries carrying its path marker). Wiring snippet in
 * this directory's README.md. Generalized from the next-web-boilerplate /
 * civicmatch consumer originals.
 *
 * Deliberately a POINTER, not a copy of the policy: the consumer's CLAUDE.md
 * owns when contrarian runs (always/skip triggers) — restating a trigger list
 * here would create a second source of truth that drifts.
 *
 * Timing, honestly: a PreToolUse hook's additionalContext lands next to the
 * tool result, so this fires after the plan is already on screen. It is a
 * next-turn safety net for the revision loop, not the mechanism that gets
 * contrarian run before sign-off. Never blocks: context only.
 */
import { readFileSync } from "node:fs";

// Guard on the payload rather than trusting the matcher: a broader matcher or
// malformed/empty stdin must make this inert, never noisy.
let input;
try {
  let raw = readFileSync(0, "utf8");
  // PowerShell 5.1 pipes BOM-prefix stdin — strip it, or a live event dies
  // into the malformed-input exit below as a false "silent".
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}
if (input?.tool_name !== "ExitPlanMode") process.exit(0);

const additionalContext =
  "contrarian nudge: a plan is going up for sign-off. If this project's CLAUDE.md carries a " +
  "`contrarian` policy, it is the authority — apply its always/skip triggers. Otherwise the " +
  "default: a non-trivial plan that came together with no friction is exactly the case to " +
  "stress-test — spawn the `contrarian` subagent, hand it the PLAN FILE (not your summary of " +
  "it, which anchors the reviewer), and require at least one finding it verified itself. If " +
  "contrarian already reviewed this plan, or the change is trivially reversible, proceed.";

console.log(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext },
  }),
);
