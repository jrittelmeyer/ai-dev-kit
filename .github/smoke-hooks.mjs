#!/usr/bin/env node
/**
 * CI smoke: pipe sample tool events through each hook handler and assert the
 * fire/silent contract. Handlers must exit 0 either way — they advise, never
 * block — and "fires" means the stdout JSON carries additionalContext.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cases = [
  ["hooks/dep-check-nudge.mjs", { tool_name: "Bash", tool_input: { command: "pnpm add lodash" } }, true],
  ["hooks/dep-check-nudge.mjs", { tool_name: "Bash", tool_input: { command: "pnpm install" } }, false],
  ["hooks/dep-check-nudge.mjs", { tool_name: "Bash", tool_input: { command: "npm install left-pad" } }, true],
  ["hooks/dep-check-nudge.mjs", { tool_name: "Edit", tool_input: { file_path: "apps/web/package.json" } }, true],
  ["hooks/live-verify-reminder.mjs", { tool_name: "Bash", tool_input: { command: "git add -A && git commit -m x" } }, true],
  ["hooks/live-verify-reminder.mjs", { tool_name: "Bash", tool_input: { command: "git -c core.autocrlf=false commit -m x" } }, true],
  ["hooks/live-verify-reminder.mjs", { tool_name: "Bash", tool_input: { command: "git log | grep commit" } }, false],
  ["hooks/skill-drift-guard.mjs", { tool_name: "Edit", tool_input: { file_path: ".claude/skills/checkpoint/SKILL.md" } }, true],
  ["hooks/skill-drift-guard.mjs", { tool_name: "Edit", tool_input: { file_path: "src/app.ts" } }, false],
  ["hooks/context-guard.mjs", { tool_name: "Edit", tool_input: { file_path: "AGENTS.md" } }, true],
  ["hooks/context-guard.mjs", { tool_name: "Edit", tool_input: { file_path: "packages/db/AGENTS.md" } }, true],
  ["hooks/context-guard.mjs", { tool_name: "Write", tool_input: { file_path: "docs/context/DATABASE.md" } }, true],
  ["hooks/context-guard.mjs", { tool_name: "Edit", tool_input: { file_path: "src/app.ts" } }, false],
  ["hooks/context-guard.mjs", { tool_name: "Edit", tool_input: { file_path: "mydocs/context/DB.md" } }, false],
  ["hooks/context-guard.mjs", { tool_name: "Edit", tool_input: { file_path: "packages/api/Claude.md" } }, true],
  ["hooks/context-guard.mjs", { tool_name: "Write", tool_input: { file_path: "Docs/Context/DB.md" } }, true],
  ["hooks/context-guard.mjs", { tool_name: "Edit", tool_input: { file_path: "C:\\Users\\x\\.claude\\projects\\P--slug\\memory\\MEMORY.md" } }, true],
  ["hooks/context-guard.mjs", { tool_name: "Write", tool_input: { file_path: "/home/u/.claude/projects/p-slug/memory/project-state.md" } }, true],
  ["hooks/context-guard.mjs", { tool_name: "Edit", tool_input: { file_path: "/home/u/.claude/projects/p-slug/notes.md" } }, false],
  ["hooks/compact-reorient.mjs", { hook_event_name: "SessionStart", session_id: "s1" }, true],
  ["hooks/compact-reorient.mjs", { hook_event_name: "PostToolUse", tool_name: "Edit" }, false],
  // SessionStart carries `source` (startup|resume|clear|compact|fork). The
  // matcher scopes the hook to compaction, but a mis-wired matcher must not
  // turn it into an every-session nudge — the payload is the backstop. A
  // payload with no `source` keeps firing: the matcher is still the primary
  // scope, and an older harness that omits the field must not silently kill
  // the hook (the false-silent class the BOM sweep below also guards).
  ["hooks/compact-reorient.mjs", { hook_event_name: "SessionStart", session_id: "s1", source: "compact" }, true],
  ["hooks/compact-reorient.mjs", { hook_event_name: "SessionStart", session_id: "s1", source: "startup" }, false],
  ["hooks/compact-reorient.mjs", { hook_event_name: "SessionStart", session_id: "s1", source: "resume" }, false],
  ["hooks/compact-reorient.mjs", { hook_event_name: "SessionStart", session_id: "s1", source: "clear" }, false],
  ["hooks/compact-reorient.mjs", { hook_event_name: "SessionStart", session_id: "s1", source: "fork" }, false],
];

let failures = 0;
for (const [handler, event, shouldFire] of cases) {
  const res = spawnSync(process.execPath, [handler], {
    input: JSON.stringify(event),
    encoding: "utf8",
  });
  const fired = (res.stdout ?? "").includes("additionalContext");
  if (res.status !== 0 || fired !== shouldFire) {
    failures++;
    console.error(
      `FAIL ${handler} ${JSON.stringify(event.tool_input ?? event.source ?? event.hook_event_name)} → exit ${res.status}, ` +
        `fired=${fired}, expected fired=${shouldFire}`,
    );
  } else {
    console.log(`ok   ${handler} → ${fired ? "fires" : "silent"}`);
  }
}
// Garbage-stdin sweep: harness events are untrusted input — malformed JSON, an
// empty pipe, or a JSON scalar must leave an advise-only handler silent with
// exit 0, never a SyntaxError/TypeError death (only stderr noise, but a broken
// contract: handlers advise, they never fail).
const handlers = [
  "hooks/compact-reorient.mjs",
  "hooks/context-guard.mjs",
  "hooks/dep-check-nudge.mjs",
  "hooks/live-verify-reminder.mjs",
  "hooks/skill-drift-guard.mjs",
];
const garbage = ["", "not json", "null"];
for (const handler of handlers) {
  for (const raw of garbage) {
    const res = spawnSync(process.execPath, [handler], { input: raw, encoding: "utf8" });
    const fired = (res.stdout ?? "").includes("additionalContext");
    if (res.status !== 0 || fired) {
      failures++;
      console.error(
        `FAIL ${handler} stdin=${JSON.stringify(raw)} → exit ${res.status}, fired=${fired}, ` +
          "expected silent exit 0",
      );
    } else {
      console.log(`ok   ${handler} stdin=${JSON.stringify(raw)} → silent`);
    }
  }
}

// BOM sweep: PowerShell 5.1 pipes prefix stdin with a UTF-8 BOM. A BOM'd valid
// event must still fire — without the strip, JSON.parse throws and stdin
// tolerance turns a live event into a false silent exit 0 (the CONTRIBUTING
// hand-test trap, now closed at the handler).
const bomEvents = [
  ["hooks/dep-check-nudge.mjs", { tool_name: "Bash", tool_input: { command: "pnpm add lodash" } }],
  ["hooks/live-verify-reminder.mjs", { tool_name: "Bash", tool_input: { command: "git commit -m x" } }],
  ["hooks/skill-drift-guard.mjs", { tool_name: "Edit", tool_input: { file_path: ".claude/skills/tidy/SKILL.md" } }],
  ["hooks/context-guard.mjs", { tool_name: "Edit", tool_input: { file_path: "CLAUDE.md" } }],
  ["hooks/compact-reorient.mjs", { hook_event_name: "SessionStart", session_id: "s1", source: "compact" }],
];
for (const [handler, event] of bomEvents) {
  const res = spawnSync(process.execPath, [handler], {
    input: "\uFEFF" + JSON.stringify(event),
    encoding: "utf8",
  });
  const fired = (res.stdout ?? "").includes("additionalContext");
  if (res.status !== 0 || !fired) {
    failures++;
    console.error(
      `FAIL ${handler} BOM-prefixed stdin → exit ${res.status}, fired=${fired}, ` +
        "expected fired=true",
    );
  } else {
    console.log(`ok   ${handler} BOM-prefixed stdin → fires`);
  }
}

// Every wired hook must be exec form — command "node", the handler path as the
// sole anchored args entry. Exec form bypasses the shell, so the 0.7.2 quoting
// class (bare $VAR reading as $null under PowerShell, an unquoted path
// word-splitting under bash) cannot recur — and the path must be UNQUOTED:
// with no shell to strip them, quotes would be literal argv bytes.
// Two wiring files, two anchors: installer-hooks.json anchors
// ${CLAUDE_PROJECT_DIR}/.claude/hooks/ai-dev-kit/ (hooks spawn with the
// *session* cwd, not the project root); hooks.json is the plugin-form twin
// the plugin loader auto-discovers, anchoring ${CLAUDE_PLUGIN_ROOT}/hooks/.
const WIRING = [
  ["hooks/installer-hooks.json", "${CLAUDE_PROJECT_DIR}/.claude/hooks/ai-dev-kit/"],
  ["hooks/hooks.json", "${CLAUDE_PLUGIN_ROOT}/hooks/"],
];
const shapes = new Map();
for (const [file, anchor] of WIRING) {
  const wired = JSON.parse(readFileSync(file, "utf8")).hooks;
  const shape = [];
  for (const [event, entries] of Object.entries(wired)) {
    for (const entry of entries) {
      for (const hook of entry.hooks ?? []) {
        const arg = Array.isArray(hook.args) ? (hook.args[0] ?? "") : "";
        const base = arg.match(/([\w-]+\.mjs)$/)?.[1];
        const ok =
          hook.command === "node" &&
          Array.isArray(hook.args) &&
          hook.args.length === 1 &&
          base &&
          arg === `${anchor}${base}`;
        if (!ok) {
          failures++;
          console.error(
            `FAIL ${file} ${event} → ${JSON.stringify({ command: hook.command, args: hook.args })}\n` +
              `     must be exec form: command "node", args exactly ["${anchor}<handler>.mjs"]`,
          );
        } else {
          console.log(`ok   ${file} ${event} → ${base} exec-form anchored`);
        }
        shape.push(
          JSON.stringify([event, entry.matcher ?? "", base, hook.if ?? "", hook.timeout ?? null]),
        );
      }
    }
  }
  shapes.set(file, shape.sort().join("\n"));
}
// Parity: the two wiring files must describe the same hooks — same events,
// matchers, handlers, if-clauses, timeouts — differing only in the anchor.
if (shapes.get(WIRING[0][0]) === shapes.get(WIRING[1][0])) {
  console.log("ok   installer-hooks.json ≡ hooks.json (wiring parity, anchors aside)");
} else {
  failures++;
  console.error("FAIL wiring parity: installer-hooks.json and hooks.json describe different hooks");
}

// Config-override case: hooks are spawned with the *session* cwd — any subdirectory —
// while the harness exports CLAUDE_PROJECT_DIR = project root. context-guard must read
// the adapter config from the root, not the cwd: drive it from a fixture subdir and
// assert a custom contextDir still fires.
const fixture = mkdtempSync(join(tmpdir(), "adk-ctx-"));
try {
  mkdirSync(join(fixture, ".claude"), { recursive: true });
  mkdirSync(join(fixture, "sub"), { recursive: true });
  writeFileSync(
    join(fixture, ".claude", "ai-dev-kit.config.json"),
    JSON.stringify({ docs: { contextDir: "notes/ctx" } }),
  );
  const res = spawnSync(process.execPath, [join(process.cwd(), "hooks", "context-guard.mjs")], {
    input: JSON.stringify({ tool_name: "Edit", tool_input: { file_path: "notes/ctx/DB.md" } }),
    encoding: "utf8",
    cwd: join(fixture, "sub"),
    env: { ...process.env, CLAUDE_PROJECT_DIR: fixture },
  });
  const fired = (res.stdout ?? "").includes("additionalContext");
  if (res.status !== 0 || !fired) {
    failures++;
    console.error(
      `FAIL hooks/context-guard.mjs config override from subdir → exit ${res.status}, ` +
        `fired=${fired}, expected fired=true`,
    );
  } else {
    console.log("ok   hooks/context-guard.mjs → custom contextDir fires from a subdir");
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

// Decision-log completeness (PLAYBOOK #9: record active *and* rejected
// automations). EVENT_SURFACE pins the harness's documented hook events as
// verified against https://code.claude.com/docs/en/hooks; manifest.json's
// hooks.reviewed must carry a verdict for every one of them. The two lists are
// deliberately separate sources: when the harness adds an event, this assert is
// the tripwire that says the kit owes it a verdict, instead of the gap sitting
// unnoticed until the next audit.
const EVENT_SURFACE = [
  "SessionStart", "Setup", "InstructionsLoaded", "UserPromptSubmit", "UserPromptExpansion",
  "MessageDisplay", "PreToolUse", "PermissionRequest", "PostToolUse", "PostToolUseFailure",
  "PostToolBatch", "PermissionDenied", "Notification", "SubagentStart", "SubagentStop",
  "TaskCreated", "TaskCompleted", "Stop", "StopFailure", "TeammateIdle",
  "ConfigChange", "CwdChanged", "DirectoryAdded", "FileChanged", "WorktreeCreate",
  "WorktreeRemove", "PreCompact", "PostCompact", "SessionEnd", "Elicitation",
  "ElicitationResult",
];
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const reviewed = manifest.hooks?.reviewed ?? {};
const missing = EVENT_SURFACE.filter((e) => !(e in reviewed));
const extra = Object.keys(reviewed).filter((e) => !EVENT_SURFACE.includes(e));
if (missing.length || extra.length) {
  failures++;
  if (missing.length)
    console.error(`FAIL manifest hooks.reviewed → no verdict recorded for: ${missing.join(", ")}`);
  if (extra.length)
    console.error(`FAIL manifest hooks.reviewed → verdict for unknown event(s): ${extra.join(", ")}`);
} else {
  console.log(`ok   manifest hooks.reviewed → verdict recorded for all ${EVENT_SURFACE.length} hook events`);
}
// Every verdict states a disposition, and every event the kit actually wires
// must be recorded as accepted — a wired hook with a "rejected" verdict means
// the log and the wiring disagree.
const wiredEvents = new Set((manifest.hooks?.handlers ?? []).map((h) => h.event));
for (const [event, verdict] of Object.entries(reviewed)) {
  const disposition = String(verdict).split(" ")[0];
  if (!["accepted", "rejected", "partial"].includes(disposition)) {
    failures++;
    console.error(
      `FAIL manifest hooks.reviewed.${event} → verdict must start with accepted/rejected/partial, got "${disposition}"`,
    );
  } else if (wiredEvents.has(event) && disposition === "rejected") {
    failures++;
    console.error(
      `FAIL manifest hooks.reviewed.${event} → recorded "rejected" but hooks.handlers wires this event`,
    );
  }
}
for (const event of wiredEvents) {
  if (!(event in reviewed)) {
    failures++;
    console.error(`FAIL manifest hooks.handlers wires ${event} with no hooks.reviewed verdict`);
  }
}

if (failures > 0) process.exit(1);
console.log(
  `${cases.length + handlers.length * garbage.length + bomEvents.length + 1} hook smoke cases passed ` +
    "(garbage stdin + BOM stdin + config override included), all wired hooks exec-form anchored.",
);
