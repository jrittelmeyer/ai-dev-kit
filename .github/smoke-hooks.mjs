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
  ["hooks/dep-check-nudge.mjs", { tool_name: "Edit", tool_input: { file_path: "apps/web/package.json" } }, true],
  ["hooks/live-verify-reminder.mjs", { tool_name: "Bash", tool_input: { command: "git add -A && git commit -m x" } }, true],
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
      `FAIL ${handler} ${JSON.stringify(event.tool_input)} → exit ${res.status}, ` +
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

// Every wired hook must be exec form — command "node", the handler path as the
// sole ${CLAUDE_PROJECT_DIR}-anchored args entry. Exec form bypasses the shell,
// so the 0.7.2 quoting class (bare $VAR reading as $null under PowerShell, an
// unquoted path word-splitting under bash) cannot recur — and the path must be
// UNQUOTED: with no shell to strip them, quotes would be literal argv bytes.
// Hooks still spawn with the *session* cwd, not the project root, hence the
// anchor; the harness substitutes ${CLAUDE_PROJECT_DIR} into each args element
// as a plain string.
const wired = JSON.parse(readFileSync("hooks/hooks.json", "utf8")).hooks;
for (const [event, entries] of Object.entries(wired)) {
  for (const entry of entries) {
    for (const hook of entry.hooks ?? []) {
      const fields = [hook.command ?? "", ...(Array.isArray(hook.args) ? hook.args : [])];
      const handler = fields.join(" ").match(/\.claude\/hooks\/[\w./-]+\.mjs/)?.[0];
      if (!handler) continue;
      const ok =
        hook.command === "node" &&
        Array.isArray(hook.args) &&
        hook.args.length === 1 &&
        hook.args[0] === `\${CLAUDE_PROJECT_DIR}/${handler}`;
      if (!ok) {
        failures++;
        console.error(
          `FAIL ${event} → ${JSON.stringify({ command: hook.command, args: hook.args })}\n` +
            '     must be exec form: command "node", args exactly ' +
            `["\${CLAUDE_PROJECT_DIR}/${handler}"] (braced, unquoted)`,
        );
      } else {
        console.log(`ok   ${event} → ${handler} exec-form anchored`);
      }
    }
  }
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

if (failures > 0) process.exit(1);
console.log(
  `${cases.length + handlers.length * garbage.length + 1} hook smoke cases passed ` +
    "(garbage stdin + config override included), all wired hooks exec-form anchored.",
);
