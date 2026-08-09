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
// Every wired command must anchor its handler path on ${CLAUDE_PROJECT_DIR}. Hooks are
// spawned with the *session* cwd, not the project root, so a repo-relative path resolves
// against whatever subdirectory the session last cd'd into and dies with MODULE_NOT_FOUND —
// silently, since only exit 2 blocks and these advise. Braced and double-quoted are both
// load-bearing: bare $CLAUDE_PROJECT_DIR reads as $null under the PowerShell hook shell, and
// an unquoted path word-splits under bash when the project path contains a space.
const wired = JSON.parse(readFileSync("hooks/hooks.json", "utf8")).hooks;
for (const [event, entries] of Object.entries(wired)) {
  for (const entry of entries) {
    for (const hook of entry.hooks ?? []) {
      const command = String(hook.command ?? "");
      const handler = command.match(/\.claude\/hooks\/[\w./-]+\.mjs/)?.[0];
      if (!handler) continue;
      if (!command.includes(`"\${CLAUDE_PROJECT_DIR}/${handler}"`)) {
        failures++;
        console.error(
          `FAIL ${event} → ${command}\n` +
            `     handler path must be written as "\${CLAUDE_PROJECT_DIR}/${handler}" ` +
            "(braced and double-quoted)",
        );
      } else {
        console.log(`ok   ${event} → ${handler} anchored`);
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
  `${cases.length + 1} hook smoke cases passed (config override included), all wired commands anchored.`,
);
