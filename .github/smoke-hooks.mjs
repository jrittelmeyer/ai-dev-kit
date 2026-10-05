#!/usr/bin/env node
/**
 * CI smoke: pipe sample tool events through each hook handler and assert the
 * fire/silent contract. Handlers must exit 0 either way — they advise, never
 * block — and "fires" means the stdout JSON carries additionalContext.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

const cases = [
  ["hooks/dep-check-nudge.mjs", { tool_name: "Bash", tool_input: { command: "pnpm add lodash" } }, true],
  ["hooks/dep-check-nudge.mjs", { tool_name: "Bash", tool_input: { command: "pnpm install" } }, false],
  ["hooks/dep-check-nudge.mjs", { tool_name: "Bash", tool_input: { command: "npm install left-pad" } }, true],
  ["hooks/dep-check-nudge.mjs", { tool_name: "Edit", tool_input: { file_path: "apps/web/package.json" } }, true],
  ["hooks/dep-check-nudge.mjs", { tool_name: "PowerShell", tool_input: { command: "pnpm add lodash" } }, true],
  ["hooks/dep-check-nudge.mjs", { tool_name: "PowerShell", tool_input: { command: "pnpm install" } }, false],
  ["hooks/live-verify-reminder.mjs", { tool_name: "Bash", tool_input: { command: "git add -A && git commit -m x" } }, true],
  ["hooks/live-verify-reminder.mjs", { tool_name: "Bash", tool_input: { command: "git -c core.autocrlf=false commit -m x" } }, true],
  ["hooks/live-verify-reminder.mjs", { tool_name: "Bash", tool_input: { command: "git log | grep commit" } }, false],
  ["hooks/live-verify-reminder.mjs", { tool_name: "Bash", tool_input: { command: "git log\ngh run list --commit abc123" } }, false],
  ["hooks/live-verify-reminder.mjs", { tool_name: "PowerShell", tool_input: { command: "git add -A; git commit -m x" } }, true],
  ["hooks/live-verify-reminder.mjs", { tool_name: "PowerShell", tool_input: { command: "git log | Select-String commit" } }, false],
  ["hooks/skill-drift-guard.mjs", { tool_name: "Bash", tool_input: { command: "sed -i 's/x/y/' .claude/skills/checkpoint/SKILL.md" } }, true],
  ["hooks/skill-drift-guard.mjs", { tool_name: "Bash", tool_input: { command: "echo hi > .claude/hooks/ai-dev-kit/dep-check-nudge.mjs" } }, true],
  ["hooks/skill-drift-guard.mjs", { tool_name: "Bash", tool_input: { command: "cat .claude/skills/checkpoint/SKILL.md" } }, false],
  ["hooks/skill-drift-guard.mjs", { tool_name: "Bash", tool_input: { command: "sed -i 's/x/y/' src/app.ts" } }, false],
  ["hooks/skill-drift-guard.mjs", { tool_name: "PowerShell", tool_input: { command: "Set-Content .claude\\skills\\checkpoint\\SKILL.md -Value x" } }, true],
  ["hooks/skill-drift-guard.mjs", { tool_name: "PowerShell", tool_input: { command: "Copy-Item x.mjs .claude/hooks/ai-dev-kit/dep-check-nudge.mjs" } }, true],
  ["hooks/skill-drift-guard.mjs", { tool_name: "PowerShell", tool_input: { command: "Get-Content .claude/skills/checkpoint/SKILL.md" } }, false],
  ["hooks/skill-drift-guard.mjs", { tool_name: "PowerShell", tool_input: { command: "Set-Content src/app.ts -Value x" } }, false],
  ["hooks/skill-drift-guard-preedit.mjs", { tool_name: "Edit", tool_input: { file_path: ".claude/skills/checkpoint/SKILL.md" } }, true],
  ["hooks/skill-drift-guard-preedit.mjs", { tool_name: "Edit", tool_input: { file_path: "src/app.ts" } }, false],
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
  // Optional asset (copied, never installed) — still smoke-held to the same contract.
  ["optional/contrarian/contrarian-nudge.mjs", { tool_name: "ExitPlanMode", tool_input: {} }, true],
  ["optional/contrarian/contrarian-nudge.mjs", { tool_name: "Bash", tool_input: { command: "ls" } }, false],
];

let failures = 0;
// Counts every assertion actually run (not the literal case arrays), so the
// closing tally can't drift from what the loops below actually check.
let asserts = 0;
for (const [handler, event, shouldFire] of cases) {
  asserts++;
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
  "hooks/skill-drift-guard-preedit.mjs",
  // Enforcement handlers: with no adapter config (this repo's cwd, no
  // CLAUDE_PROJECT_DIR), garbage stdin must still leave them silent exit 0.
  "hooks/stop-gate.mjs",
  "hooks/banned-api-guard.mjs",
  "hooks/checkpoint-autorun.mjs",
  "hooks/script-exec-guard.mjs",
  "optional/contrarian/contrarian-nudge.mjs",
];
const garbage = ["", "not json", "null"];
for (const handler of handlers) {
  for (const raw of garbage) {
    asserts++;
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
  ["hooks/skill-drift-guard.mjs", { tool_name: "Bash", tool_input: { command: "sed -i 's/x/y/' .claude/skills/tidy/SKILL.md" } }],
  ["hooks/skill-drift-guard-preedit.mjs", { tool_name: "Edit", tool_input: { file_path: ".claude/skills/tidy/SKILL.md" } }],
  ["hooks/context-guard.mjs", { tool_name: "Edit", tool_input: { file_path: "CLAUDE.md" } }],
  ["hooks/compact-reorient.mjs", { hook_event_name: "SessionStart", session_id: "s1", source: "compact" }],
  ["optional/contrarian/contrarian-nudge.mjs", { tool_name: "ExitPlanMode", tool_input: {} }],
];
for (const [handler, event] of bomEvents) {
  asserts++;
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
        asserts++;
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
asserts++;
if (shapes.get(WIRING[0][0]) === shapes.get(WIRING[1][0])) {
  console.log("ok   installer-hooks.json ≡ hooks.json (wiring parity, anchors aside)");
} else {
  failures++;
  console.error("FAIL wiring parity: installer-hooks.json and hooks.json describe different hooks");
}

// manifest.hooks.handlers ↔ wiring cross-check: the manifest's handler index
// is a separate source from the wiring files above — a hook added to
// hooks.json but never indexed in the manifest (or vice versa) should fail
// loudly here instead of drifting unnoticed (B3-40).
{
  const pluginWired = JSON.parse(readFileSync("hooks/hooks.json", "utf8")).hooks;
  const wiredPairs = new Set();
  for (const [event, entries] of Object.entries(pluginWired)) {
    for (const entry of entries) {
      for (const hook of entry.hooks ?? []) {
        const base = (Array.isArray(hook.args) ? hook.args[0] : "")?.match(/([\w-]+\.mjs)$/)?.[1];
        if (base) wiredPairs.add(`${event}:${base}`);
      }
    }
  }
  const manifestHandlers = JSON.parse(readFileSync("manifest.json", "utf8")).hooks?.handlers ?? [];
  const manifestPairs = new Set(manifestHandlers.map((h) => `${h.event}:${h.file.replace(/^hooks\//, "")}`));
  const missingFromManifest = [...wiredPairs].filter((p) => !manifestPairs.has(p));
  const missingFromWiring = [...manifestPairs].filter((p) => !wiredPairs.has(p));
  asserts++;
  if (missingFromManifest.length || missingFromWiring.length) {
    failures++;
    if (missingFromManifest.length)
      console.error(`FAIL manifest hooks.handlers is missing wired hook(s): ${missingFromManifest.join(", ")}`);
    if (missingFromWiring.length)
      console.error(`FAIL hooks.json is missing manifest-listed handler(s): ${missingFromWiring.join(", ")}`);
  } else {
    console.log(`ok   manifest hooks.handlers ≡ hooks.json wiring (${manifestPairs.size} handler/event pairs)`);
  }
}

// Config-override case: hooks are spawned with the *session* cwd — any subdirectory —
// while the harness exports CLAUDE_PROJECT_DIR = project root. context-guard must read
// the adapter config from the root, not the cwd: drive it from a fixture subdir and
// assert a custom contextDir still fires.
const fixture = mkdtempSync(join(tmpdir(), "adk-ctx-"));
asserts++;
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

// Enforcement handlers (opt-in blocking): each must be inert without adapter
// config, obey its loop guard, and fire only per its enforcement block. Driven
// against tmpdir fixtures via CLAUDE_PROJECT_DIR, like the config-override case.
function runEnforcement(handler, stdinValue, projectDir) {
  return spawnSync(process.execPath, [join(process.cwd(), handler)], {
    input: typeof stdinValue === "string" ? stdinValue : JSON.stringify(stdinValue),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });
}
function enforcementFixture(config) {
  const dir = mkdtempSync(join(tmpdir(), "adk-enf-"));
  mkdirSync(join(dir, ".claude"), { recursive: true });
  if (config) writeFileSync(join(dir, ".claude", "ai-dev-kit.config.json"), JSON.stringify(config));
  return dir;
}
function assertCase(label, res, wantStatus, wantOut = null) {
  asserts++;
  const outOk =
    wantOut === null || ((res.stdout ?? "") + (res.stderr ?? "")).includes(wantOut);
  if (res.status !== wantStatus || !outOk) {
    failures++;
    console.error(
      `FAIL ${label} → exit ${res.status} (want ${wantStatus})` +
        (wantOut === null ? "" : `, output ${outOk ? "matched" : `missing "${wantOut}"`}`),
    );
  } else {
    console.log(`ok   ${label}`);
  }
}

// stop-gate: inert without config; green gate exits 0; red gate exits 2 with
// the failing command named; stop_hook_active short-circuits even a red gate;
// a BOM'd stop_hook_active event must still short-circuit (loop-guard class).
{
  const bare = enforcementFixture(null);
  const green = enforcementFixture({
    enforcement: { stopGate: { commands: ['node -e "process.exit(0)"'] } },
  });
  const red = enforcementFixture({
    enforcement: {
      stopGate: { commands: ['node -e "console.error(41+1);process.exit(1)"'] },
    },
  });
  try {
    assertCase("hooks/stop-gate.mjs no config → silent", runEnforcement("hooks/stop-gate.mjs", {}, bare), 0);
    assertCase("hooks/stop-gate.mjs green gate → exit 0", runEnforcement("hooks/stop-gate.mjs", {}, green), 0);
    assertCase("hooks/stop-gate.mjs red gate → exit 2 + command named", runEnforcement("hooks/stop-gate.mjs", {}, red), 2, "stop-gate");
    assertCase("hooks/stop-gate.mjs red gate + stop_hook_active → exit 0", runEnforcement("hooks/stop-gate.mjs", { stop_hook_active: true }, red), 0);
    assertCase(
      "hooks/stop-gate.mjs red gate + BOM'd stop_hook_active → exit 0",
      runEnforcement("hooks/stop-gate.mjs", "\uFEFF" + JSON.stringify({ stop_hook_active: true }), red),
      0,
    );
  } finally {
    for (const d of [bare, green, red]) rmSync(d, { recursive: true, force: true });
  }
}

// stop-gate: a non-positive timeoutSeconds (B2-38) must clamp to the 150s
// default rather than handing execSync a zero/negative timeout — the raw
// value used to pass Number.isInteger, so 0/-5 slipped through uncaught.
{
  const zero = enforcementFixture({
    enforcement: {
      stopGate: { commands: ['node -e "process.exit(0)"'], timeoutSeconds: 0 },
    },
  });
  const negative = enforcementFixture({
    enforcement: {
      stopGate: { commands: ['node -e "process.exit(0)"'], timeoutSeconds: -5 },
    },
  });
  try {
    assertCase("hooks/stop-gate.mjs timeoutSeconds: 0 clamps to default → exit 0", runEnforcement("hooks/stop-gate.mjs", {}, zero), 0);
    assertCase("hooks/stop-gate.mjs timeoutSeconds: -5 clamps to default → exit 0", runEnforcement("hooks/stop-gate.mjs", {}, negative), 0);
  } finally {
    for (const d of [zero, negative]) rmSync(d, { recursive: true, force: true });
  }
}

// banned-api-guard: inert without config; blocks a banned pattern under a
// guarded path (BOM'd event included — fails open otherwise); clean file,
// excluded path, out-of-scope path, and commented occurrence all pass.
{
  const cfg = {
    enforcement: {
      bannedApis: [
        {
          name: "determinism",
          paths: ["src/sim"],
          excludePaths: ["src/sim/trig-lut.ts"],
          rules: [{ pattern: "\\bMath\\.random\\b", why: "use the seeded rng" }],
          docs: "docs/determinism.md",
        },
      ],
    },
  };
  const bare = enforcementFixture(null);
  const dir = enforcementFixture(cfg);
  try {
    mkdirSync(join(dir, "src", "sim"), { recursive: true });
    writeFileSync(join(dir, "src", "sim", "bad.ts"), "export const r = () => Math.random();\n");
    writeFileSync(join(dir, "src", "sim", "ok.ts"), "export const x = 1;\n");
    writeFileSync(join(dir, "src", "sim", "commented.ts"), "// Math.random is banned here\nexport const y = 2;\n");
    writeFileSync(join(dir, "src", "sim", "trig-lut.ts"), "export const t = Math.random();\n");
    mkdirSync(join(dir, "src", "ui"), { recursive: true });
    writeFileSync(join(dir, "src", "ui", "free.ts"), "export const u = Math.random();\n");
    const edit = (p) => ({ tool_name: "Edit", tool_input: { file_path: join(dir, p) } });
    assertCase("hooks/banned-api-guard.mjs no config → silent", runEnforcement("hooks/banned-api-guard.mjs", edit("src/sim/bad.ts"), bare), 0);
    assertCase("hooks/banned-api-guard.mjs banned under path → exit 2", runEnforcement("hooks/banned-api-guard.mjs", edit("src/sim/bad.ts"), dir), 2, "banned-api-guard");
    assertCase(
      "hooks/banned-api-guard.mjs BOM'd banned event → exit 2 (must not fail open)",
      runEnforcement("hooks/banned-api-guard.mjs", "\uFEFF" + JSON.stringify(edit("src/sim/bad.ts")), dir),
      2,
    );
    assertCase("hooks/banned-api-guard.mjs clean file → exit 0", runEnforcement("hooks/banned-api-guard.mjs", edit("src/sim/ok.ts"), dir), 0);
    assertCase("hooks/banned-api-guard.mjs commented occurrence → exit 0", runEnforcement("hooks/banned-api-guard.mjs", edit("src/sim/commented.ts"), dir), 0);
    assertCase("hooks/banned-api-guard.mjs excluded path → exit 0", runEnforcement("hooks/banned-api-guard.mjs", edit("src/sim/trig-lut.ts"), dir), 0);
    assertCase("hooks/banned-api-guard.mjs out-of-scope path → exit 0", runEnforcement("hooks/banned-api-guard.mjs", edit("src/ui/free.ts"), dir), 0);
  } finally {
    for (const d of [bare, dir]) rmSync(d, { recursive: true, force: true });
  }
}

// banned-api-guard: a non-compiling pattern (B2-38) must not disable the
// whole guard — the valid sibling rule still blocks, and the broken rule is
// named once on stderr instead of failing open silently.
{
  const cfg = {
    enforcement: {
      bannedApis: [
        {
          name: "determinism",
          paths: ["src/sim"],
          rules: [
            { pattern: "(unterminated", why: "broken on purpose" },
            { pattern: "\\bMath\\.random\\b", why: "use the seeded rng" },
          ],
        },
      ],
    },
  };
  const dir = enforcementFixture(cfg);
  try {
    mkdirSync(join(dir, "src", "sim"), { recursive: true });
    writeFileSync(join(dir, "src", "sim", "bad.ts"), "export const r = () => Math.random();\n");
    const edit = (p) => ({ tool_name: "Edit", tool_input: { file_path: join(dir, p) } });
    const res = runEnforcement("hooks/banned-api-guard.mjs", edit("src/sim/bad.ts"), dir);
    assertCase(
      "hooks/banned-api-guard.mjs broken sibling rule still blocks on the valid rule → exit 2",
      res,
      2,
      "banned-api-guard",
    );
    assertCase(
      "hooks/banned-api-guard.mjs non-compiling pattern named once on stderr",
      res,
      2,
      "non-compiling pattern",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// compact-reorient doc naming: the nudge names the adapter's status/backlog
// docs only when they exist at the adapter paths — a scaffold can delete the
// docs while shipping .claude/ verbatim, and pointing at nonexistent files on
// every compaction is the failure this guards (the consumer-recorded condition
// for adopting the --hooks wiring).
{
  const compactEvent = { hook_event_name: "SessionStart", session_id: "s1", source: "compact" };
  const dir = enforcementFixture({ docs: { status: "docs/STATUS.md", backlog: "docs/BACKLOG.md" } });
  try {
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "docs", "STATUS.md"), "# status\n");
    // backlog deliberately NOT created
    const res = runEnforcement("hooks/compact-reorient.mjs", compactEvent, dir);
    asserts++;
    const out = res.stdout ?? "";
    if (res.status !== 0 || !out.includes("docs/STATUS.md") || out.includes("docs/BACKLOG.md")) {
      failures++;
      console.error(
        `FAIL hooks/compact-reorient.mjs doc naming → exit ${res.status}; must name the existing ` +
          `status doc and omit the missing backlog. stdout: ${out.slice(0, 200)}`,
      );
    } else {
      console.log("ok   hooks/compact-reorient.mjs → names only docs that exist");
    }
    rmSync(join(dir, "docs", "STATUS.md"));
    const bare = runEnforcement("hooks/compact-reorient.mjs", compactEvent, dir);
    asserts++;
    if (bare.status !== 0 || !(bare.stdout ?? "").includes("additionalContext") || (bare.stdout ?? "").includes("docs/STATUS.md")) {
      failures++;
      console.error(
        `FAIL hooks/compact-reorient.mjs no-docs fallback → exit ${bare.status}, stdout ${JSON.stringify((bare.stdout ?? "").slice(0, 120))}`,
      );
    } else {
      console.log("ok   hooks/compact-reorient.mjs → generic fallback when adapter docs are absent");
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// checkpoint-autorun's block signal is JSON on stdout ({"decision":"block"}),
// not the exit code — it exits 0 whether silent or firing. A status-only
// assertCase can't tell the two apart, so every "stays silent" case here must
// check stdout too, or a regression that makes it fire anyway would still
// read as passing.
function assertAutorunSilent(label, res) {
  asserts++;
  const blocked = (res.stdout ?? "").includes('"decision":"block"');
  if (res.status !== 0 || blocked) {
    failures++;
    console.error(
      `FAIL ${label} → exit ${res.status}, stdout ${JSON.stringify((res.stdout ?? "").slice(0, 80))} ` +
        "— expected silent (no block decision)",
    );
  } else {
    console.log(`ok   ${label}`);
  }
}
function assertAutorunBlocks(label, res) {
  asserts++;
  if (res.status !== 0 || !(res.stdout ?? "").includes('"decision":"block"')) {
    failures++;
    console.error(
      `FAIL ${label} → exit ${res.status}, stdout ${JSON.stringify((res.stdout ?? "").slice(0, 80))} ` +
        "— expected a block decision",
    );
  } else {
    console.log(`ok   ${label}`);
  }
}

// checkpoint-autorun: inert without opt-in; a dirty opted-in git repo blocks
// once (decision on stdout) and the TTL lock makes the immediate rerun silent;
// stop_hook_active and pending-question stops stay silent even when dirty.
{
  const bare = enforcementFixture(null);
  const dir = enforcementFixture({ enforcement: { checkpointAutorun: true } });
  try {
    const git = (...args) =>
      spawnSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    git("init", "-q");
    writeFileSync(join(dir, "pending.txt"), "dirty\n");
    assertAutorunSilent("hooks/checkpoint-autorun.mjs no opt-in → silent", runEnforcement("hooks/checkpoint-autorun.mjs", {}, bare));
    assertAutorunSilent(
      "hooks/checkpoint-autorun.mjs stop_hook_active → silent",
      runEnforcement("hooks/checkpoint-autorun.mjs", { stop_hook_active: true }, dir),
    );
    assertAutorunSilent(
      "hooks/checkpoint-autorun.mjs pending question → silent",
      runEnforcement("hooks/checkpoint-autorun.mjs", { last_assistant_message: "Should I proceed?" }, dir),
    );
    // Trigger-scope guard (B3-40): a dirty tree mid-rebase/merge/cherry-pick
    // means something other than ordinary uncommitted work — must stay silent
    // even though the tree is dirty and the config is opted in. Must run
    // before any lock exists, or a fresh lock would silence it for the wrong
    // reason and mask a regression in this guard.
    mkdirSync(join(dir, ".git", "rebase-merge"), { recursive: true });
    assertAutorunSilent(
      "hooks/checkpoint-autorun.mjs mid-rebase → silent even though dirty",
      runEnforcement("hooks/checkpoint-autorun.mjs", {}, dir),
    );
    rmSync(join(dir, ".git", "rebase-merge"), { recursive: true, force: true });
    assertAutorunBlocks(
      "hooks/checkpoint-autorun.mjs dirty opted-in repo → blocks for checkpoint",
      runEnforcement("hooks/checkpoint-autorun.mjs", {}, dir),
    );
    assertAutorunSilent(
      "hooks/checkpoint-autorun.mjs immediate rerun → lock keeps it silent",
      runEnforcement("hooks/checkpoint-autorun.mjs", {}, dir),
    );
    // Loop guard (B3-40): a lock older than LOCK_TTL_MS is stale and must be
    // cleared so a genuinely-still-dirty repo can retrigger — not just stay
    // silent forever after the first block.
    const lockPath = join(dir, ".claude", ".checkpoint-hook-active");
    const staleMs = (Date.now() - 11 * 60 * 1000) / 1000;
    utimesSync(lockPath, staleMs, staleMs);
    assertAutorunBlocks(
      "hooks/checkpoint-autorun.mjs stale lock (backdated mtime) → retriggers block",
      runEnforcement("hooks/checkpoint-autorun.mjs", {}, dir),
    );
  } finally {
    for (const d of [bare, dir]) rmSync(d, { recursive: true, force: true });
  }
}

// checkpoint-autorun (B3-40): with no upstream configured, a clean tree after
// a real commit must stay silent — hasPendingWork()'s `!upstream` early
// return is only reachable once the dirty-tree short-circuit above it is
// false, which none of the always-dirty fixtures above ever exercise.
{
  const dir = enforcementFixture({ enforcement: { checkpointAutorun: true } });
  try {
    const git = (...args) =>
      spawnSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    git("init", "-q");
    git("config", "user.email", "smoke@example.com");
    git("config", "user.name", "Smoke Test");
    writeFileSync(join(dir, "committed.txt"), "clean\n");
    git("add", "-A");
    git("commit", "-q", "-m", "init");
    assertAutorunSilent(
      "hooks/checkpoint-autorun.mjs no upstream, clean tree → silent",
      runEnforcement("hooks/checkpoint-autorun.mjs", {}, dir),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
  "ElicitationResult", "PreModelSwitch", "PostModelSwitch",
];
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const reviewed = manifest.hooks?.reviewed ?? {};
const missing = EVENT_SURFACE.filter((e) => !(e in reviewed));
const extra = Object.keys(reviewed).filter((e) => !EVENT_SURFACE.includes(e));
asserts++;
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
  asserts++;
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
  asserts++;
  if (!(event in reviewed)) {
    failures++;
    console.error(`FAIL manifest hooks.handlers wires ${event} with no hooks.reviewed verdict`);
  }
}

// script-exec-guard (B1-56): an opted-in project gets a PreToolUse "ask" when a
// command executes a session-fresh script (untracked, outside any repo, or
// uncommitted lines) or inline code holding a recursive delete of a
// non-literal or critical target — the anthropics/claude-code#88462 shape,
// where the harness's own check saw only "bash /tmp/.../test-lib-demo.sh".
// The fixture dirs are direct mkdtempSync constants so the guard, dogfooded
// here, never asks about this block's own cleanup.
{
  const SEG = "hooks/script-exec-guard.mjs";
  const segOn = mkdtempSync(join(tmpdir(), "adk-seg-on-"));
  const segBare = mkdtempSync(join(tmpdir(), "adk-seg-bare-"));
  const segOut = mkdtempSync(join(tmpdir(), "adk-seg-out-"));
  const gitIn = (...args) => spawnSync("git", args, { cwd: segOn, encoding: "utf8" });
  const put = (dir, name, lines) => {
    writeFileSync(join(dir, name), lines.join("\n") + "\n");
    return join(dir, name).replace(/\\/g, "/");
  };
  const bash = (command, extra = {}) => ({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command }, ...extra });
  const pwsh = (command) => ({ hook_event_name: "PreToolUse", tool_name: "PowerShell", tool_input: { command } });
  const segRun = (event, projectDir = segOn) => runEnforcement(SEG, event, projectDir);
  const expectAsk = (label, res, want = null) => {
    asserts++;
    const out = res.stdout ?? "";
    const asked = out.includes('"permissionDecision":"ask"');
    if (res.status !== 0 || !asked || (want && !out.includes(want))) {
      failures++;
      console.error(
        `FAIL ${SEG} ${label} → exit ${res.status}, asked=${asked}` +
          (want ? `, want ${JSON.stringify(want)}` : "") +
          `, stdout ${JSON.stringify(out.slice(0, 200))}`,
      );
    } else {
      console.log(`ok   ${SEG} ${label} → asks`);
    }
  };
  const expectQuiet = (label, res) => {
    asserts++;
    const out = res.stdout ?? "";
    if (res.status !== 0 || out.includes("permissionDecision")) {
      failures++;
      console.error(`FAIL ${SEG} ${label} → exit ${res.status}, stdout ${JSON.stringify(out.slice(0, 200))}, expected silent`);
    } else {
      console.log(`ok   ${SEG} ${label} → silent`);
    }
  };
  try {
    mkdirSync(join(segOn, ".claude"), { recursive: true });
    writeFileSync(join(segOn, ".claude", "ai-dev-kit.config.json"), JSON.stringify({ enforcement: { scriptExecGuard: true } }));
    mkdirSync(join(segBare, ".claude"), { recursive: true });
    for (const args of [
      ["init", "-q"],
      ["config", "user.email", "smoke@example.invalid"],
      ["config", "user.name", "smoke"],
      ["config", "commit.gpgsign", "false"],
      ["config", "core.autocrlf", "false"],
    ]) gitIn(...args);

    // The #88462 shape: the EXIT trap is armed on a temp dir, then the
    // variable is reassigned to $HOME — the trap deletes the home directory.
    const demo = put(segOut, "test-lib-demo.sh", [
      "#!/usr/bin/env bash",
      "# shape of anthropics/claude-code#88462",
      '_HT_HOME="$(mktemp -d)"',
      "trap 'rm -rf \"$_HT_HOME\"' EXIT",
      '_HT_HOME="$HOME"',
      'echo "demo ran in $_HT_HOME"',
    ]);
    expectAsk("#88462 trap script via bash <abs>", segRun(bash(`bash "${demo}"`)), "test-lib-demo.sh:4");
    expectAsk("#88462 reason names the reassignment", segRun(bash(`bash "${demo}"`)), "_HT_HOME=\\\"$HOME\\\"");
    expectAsk("#88462 via cd + ./script", segRun(bash(`cd "${segOut}" && ./test-lib-demo.sh`)), "test-lib-demo.sh:4");
    expectAsk(
      "#88462 BOM-prefixed event",
      runEnforcement(SEG, "﻿" + JSON.stringify(bash(`bash "${demo}"`)), segOn),
      "test-lib-demo.sh:4",
    );
    if (process.platform === "win32" || tmpdir() === "/tmp") {
      const viaTmp = `bash /tmp/${segOut.split(/[\\/]/).pop()}/test-lib-demo.sh`;
      expectAsk("#88462 via a Git-Bash /tmp path", segRun(bash(viaTmp)), "test-lib-demo.sh:4");
    }
    const envDemo = put(segOut, "env-demo.sh", ['W="${W:-$(mktemp -d)}"', "trap 'rm -rf \"$W\"' EXIT"]);
    expectAsk("env-inherited temp var (not mktemp-only)", segRun(bash(`sh ${envDemo}`)), "env-demo.sh:2");
    const ps1 = put(segOut, "cleanup.ps1", ["param([string]$target = $env:BUILD_ROOT)", "Remove-Item -Recurse -Force $target"]);
    expectAsk("PowerShell tool & script.ps1", segRun(pwsh(`& "${ps1}"`)), "cleanup.ps1:2");
    expectAsk("pwsh -File script.ps1 from Bash", segRun(bash(`pwsh -NoProfile -File "${ps1}"`)), "cleanup.ps1:2");
    // $env:VAR in the invoked path itself (not just inside the script body):
    // the first alternative of expand()'s env-ref regex used to swallow "env"
    // as the variable name before "$env:VAR" could match, so the script's own
    // path never resolved and the guard fell through to scanning the command
    // line — which mentions no delete — instead of the script. The separator is
    // the platform's own: on Linux a backslash is part of a file name, not a
    // path separator, so a hardcoded one never resolves there.
    const envPath = put(segOut, "env-path.ps1", ["Remove-Item -Recurse -Force $env:LEFTOVER"]);
    process.env.ADK_SEG_OUT = segOut;
    expectAsk("PowerShell $env: var in the script's own path", segRun(pwsh(`& "$env:ADK_SEG_OUT${sep}env-path.ps1"`)), "env-path.ps1:1");
    delete process.env.ADK_SEG_OUT;
    const mjs = put(segOut, "clean.mjs", [
      'import { rmSync } from "node:fs";',
      "const dir = process.env.OUT_DIR;",
      "rmSync(dir, {",
      "  recursive: true,",
      "  force: true,",
      "});",
    ]);
    expectAsk("node clean.mjs, multi-line recursive rmSync", segRun(bash(`node "${mjs}"`)), "clean.mjs:3");
    expectAsk(
      "node -e inline recursive rmSync",
      segRun(bash(`node -e "require('fs').rmSync(process.env.TARGET, { recursive: true, force: true })"`)),
    );
    expectAsk("python3 -c inline rmtree", segRun(bash(`python3 -c "import shutil, os; shutil.rmtree(os.environ['T'])"`)));
    const bat = put(segOut, "wipe.bat", ["@echo off", "rd /s /q %TARGET%"]);
    expectAsk("cmd /c script.bat", segRun(bash(`cmd /c "${bat}"`)), "wipe.bat:2");
    const gen = join(segOut, "gen.sh").replace(/\\/g, "/");
    expectAsk("heredoc writes then runs a script", segRun(bash(`cat > "${gen}" <<'EOF'\nrm -rf "$X"\nEOF\nbash "${gen}"`)));

    // In-repo fixtures: tracked-clean scripts are reviewed code (skipped);
    // uncommitted lines are the session's own (scanned).
    put(segOn, "tracked-clean.sh", ['rm -rf "$DIR"']);
    put(segOn, "lib.sh", ['W="$(mktemp -d)"', "trap 'rm -rf \"$W\"' EXIT", "echo ok"]);
    put(segOn, "lib2.sh", ["trap 'rm -rf \"$DIR\"' EXIT"]);
    gitIn("add", "-A");
    gitIn("commit", "-q", "-m", "fixture");
    put(segOn, "lib.sh", ['W="$(mktemp -d)"', "trap 'rm -rf \"$W\"' EXIT", 'W="$HOME"', "echo ok"]);
    put(segOn, "lib2.sh", ["trap 'rm -rf \"$DIR\"' EXIT", "echo bye"]);
    put(segOn, "new.sh", ['rm -rf "$1"']);
    put(segOn, "build.sh", ["rm -rf dist"]);
    expectAsk("untracked script, positional target", segRun(bash("bash new.sh", { cwd: segOn })), "new.sh:1");
    expectAsk("tracked script, uncommitted reassignment of a trapped var", segRun(bash("bash lib.sh", { cwd: segOn })), "lib.sh:2");
    expectQuiet("tracked-clean script", segRun(bash("bash tracked-clean.sh", { cwd: segOn })));
    expectQuiet("tracked script, only an echo added", segRun(bash("bash lib2.sh", { cwd: segOn })));
    expectQuiet("untracked script, literal target", segRun(bash("bash build.sh", { cwd: segOn })));

    expectQuiet("no opt-in", segRun(bash(`bash "${demo}"`), segBare));
    expectQuiet("node -e literal rmSync target", segRun(bash(`node -e "require('fs').rmSync('dist', {recursive: true, force: true})"`)));
    expectQuiet("cat of the script (reading, not executing)", segRun(bash(`cat "${demo}"`)));
    expectQuiet("grep rm <script>", segRun(bash(`grep rm "${demo}"`)));
    expectQuiet("grep bash <script>", segRun(bash(`grep bash "${demo}"`)));
    const idiom = put(segOut, "tmp-idiom.sh", ['tmp="$(mktemp -d)"', "trap 'rm -rf \"$tmp\"' EXIT", "echo work"]);
    expectQuiet("mktemp + trap cleanup idiom", segRun(bash(`bash "${idiom}"`)));
    const mk = put(segOut, "mk.mjs", ['import { mkdirSync } from "node:fs";', "mkdirSync(process.env.X, { recursive: true });"]);
    expectQuiet("recursive mkdirSync is not a delete", segRun(bash(`node "${mk}"`)));
    const tmpJs = put(segOut, "tmp-clean.mjs", [
      'import { mkdtempSync, rmSync } from "node:fs";',
      'const d = mkdtempSync("x-");',
      "rmSync(d, { recursive: true, force: true });",
    ]);
    expectQuiet("mkdtempSync-assigned rmSync target", segRun(bash(`node "${tmpJs}"`)));
    const psSafe = put(segOut, "ps-safe.ps1", ["Remove-Item -Force $env:TEMP\\x.txt"]);
    expectQuiet("non-recursive Remove-Item -Force", segRun(pwsh(`& "${psSafe}"`)));

    // Fail-safe: with its helper modules missing, the handler must still ask
    // on a crude recursive-delete match in the script it runs, never fail open.
    const lone = mkdtempSync(join(tmpdir(), "adk-seg-lone-"));
    try {
      writeFileSync(join(lone, "script-exec-guard.mjs"), readFileSync(SEG));
      const res = spawnSync(process.execPath, [join(lone, "script-exec-guard.mjs")], {
        input: JSON.stringify(bash(`bash "${demo}"`)),
        encoding: "utf8",
        env: { ...process.env, CLAUDE_PROJECT_DIR: segOn },
      });
      expectAsk("helpers missing → crude fallback still asks", res, "crude match");
    } finally {
      rmSync(lone, { recursive: true, force: true });
    }
    for (const command of ["ls -la", "git status", "node --version"]) expectQuiet(command, segRun(bash(command)));
    expectQuiet("PowerShell Get-ChildItem", segRun(pwsh("Get-ChildItem")));
  } finally {
    rmSync(segOn, { recursive: true, force: true });
    rmSync(segBare, { recursive: true, force: true });
    rmSync(segOut, { recursive: true, force: true });
  }
}

// SECURITY.md claims every hook handler is "auditable in under 140 lines" —
// this tripwire caught that claim drifting twice across audits before it had
// a smoke assert of its own (B3-45).
const SECURITY_LINE_BOUND = 140;
const hookFiles = readdirSync("hooks").filter((f) => f.endsWith(".mjs"));
for (const file of hookFiles) {
  asserts++;
  const content = readFileSync(join("hooks", file), "utf8");
  const lineCount = content.replace(/\n$/, "").split("\n").length;
  if (lineCount >= SECURITY_LINE_BOUND) {
    failures++;
    console.error(
      `FAIL hooks/${file} → ${lineCount} lines, at/over SECURITY.md's documented ${SECURITY_LINE_BOUND}-line bound`,
    );
  }
}

if (failures > 0) process.exit(1);
console.log(
  `${asserts} hook smoke asserts passed ` +
    "(fire/silent cases + garbage stdin + BOM stdin + wiring/parity + config override + decision-log " +
    "completeness), all wired hooks exec-form anchored.",
);
