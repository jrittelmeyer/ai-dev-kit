#!/usr/bin/env node
/**
 * CI smoke: installer scenarios that need a real dest fixture. Two nets:
 *  - settings merge from a PRE-POPULATED .claude/settings.json — user hooks on
 *    kit events (shell and exec form), a user hook sharing an entry with a kit
 *    hook, a foreign event, stale kit-marker entries in BOTH forms (marker in
 *    the command string, marker only in args), a non-hook key. Assert preserve
 *    / replace / no-dup / byte-stable-on-rerun.
 *  - stale leftovers in kit-owned dirs — files gone from kit source must fail
 *    --check (STALE) and be pruned by install; skills the manifest doesn't
 *    list stay untouched.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const installer = join(process.cwd(), "install.mjs");
// The installer form is the merge source; plugin-form hooks/hooks.json is the
// marketplace loader's file and never reaches an installer consumer.
const kitHooks = JSON.parse(readFileSync("hooks/installer-hooks.json", "utf8")).hooks;
const marker = ".claude/hooks/ai-dev-kit/";

let failures = 0;
const check = (name, ok, detail = "") => {
  if (ok) {
    console.log(`ok   ${name}`);
  } else {
    failures++;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Kit ownership rides the handler path: shell form carries it in the command
// string, exec form as an args entry — the merge must see both.
const carriesMarker = (h) =>
  [h.command ?? "", ...(Array.isArray(h.args) ? h.args : [])].some((v) =>
    String(v).includes(marker),
  );

const scratch = mkdtempSync(join(tmpdir(), "adk-install-"));
const run = (...extra) =>
  spawnSync(process.execPath, [installer, "--dest", scratch, ...extra], { encoding: "utf8" });

try {
  // ---- strict flag parsing: unknown/misspelled flags die before any write ----
  const badFlag = run("--hooks", "--frobnicate");
  check("flags: unknown flag exits 1", badFlag.status === 1, `exit ${badFlag.status}`);
  check(
    "flags: unknown flag named on stderr",
    (badFlag.stderr ?? "").includes("--frobnicate"),
    (badFlag.stderr ?? "").trim(),
  );
  check("flags: unknown flag writes nothing", !existsSync(join(scratch, ".claude")));
  const noValue = run("--adapter");
  check(
    "flags: value flag without a value exits 1",
    noValue.status === 1,
    `exit ${noValue.status}`,
  );
  const help = run("--help");
  check("flags: --help exits 0", help.status === 0, `exit ${help.status}`);
  check("flags: --help prints usage", (help.stdout ?? "").includes("Usage"));
  check("flags: --help writes nothing", !existsSync(join(scratch, ".claude")));
  // The --hooks merge source is hooks/installer-hooks.json (hooks/hooks.json is
  // the plugin-form twin) — --help must name the real file, or a consumer
  // hand-wiring hooks from the doc copies unresolvable ${CLAUDE_PLUGIN_ROOT} paths.
  check(
    "flags: --help names installer-hooks.json as the --hooks merge source",
    (help.stdout ?? "").includes("hooks/installer-hooks.json"),
    (help.stdout ?? "").trim(),
  );
  check(
    "flags: --help does not name hooks/hooks.json as the --hooks merge source",
    !(help.stdout ?? "").includes("hooks/hooks.json"),
    (help.stdout ?? "").trim(),
  );

  // ---- settings merge from a pre-populated settings.json ----
  const settingsPath = join(scratch, ".claude", "settings.json");
  const userPre = { matcher: "Bash", hooks: [{ type: "command", command: "echo user-pre" }] };
  const userExec = {
    matcher: "Bash",
    hooks: [{ type: "command", command: "node", args: ["scripts/my-own-hook.mjs"] }],
  };
  // Stop became a kit event in 0.23.0 (stop-gate + checkpoint-autorun), so the
  // user's Stop entry now exercises "user entry on a kit event survives";
  // Notification stays foreign (rejected in the manifest decision log).
  const userStop = { matcher: "", hooks: [{ type: "command", command: "echo user-stop" }] };
  const userNotify = { matcher: "", hooks: [{ type: "command", command: "echo user-notify" }] };
  const seeded = {
    permissions: { allow: ["Bash(pnpm test:*)"] },
    hooks: {
      PreToolUse: [
        userPre,
        // User exec-form hook without the marker: never the kit's to replace.
        userExec,
        // Stale kit-marker entries in both forms: handlers the kit no longer
        // ships. The merge must replace them (drop, then append current kit
        // entries), never keep them — the exec-form one carries the marker
        // only in args, invisible to a command-string-only matcher.
        {
          matcher: "WebFetch",
          hooks: [
            {
              type: "command",
              command: `node "\${CLAUDE_PROJECT_DIR}/${marker}removed-handler.mjs"`,
            },
          ],
        },
        {
          matcher: "WebFetch",
          hooks: [
            {
              type: "command",
              command: "node",
              args: [`\${CLAUDE_PROJECT_DIR}/${marker}removed-exec-handler.mjs`],
            },
          ],
        },
      ],
      PostToolUse: [
        // User hook and kit hook sharing one entry: only the kit hook may be
        // replaced; the user hook stays where it is.
        {
          matcher: "Edit|Write",
          hooks: [
            { type: "command", command: "echo user-post" },
            {
              type: "command",
              command: `node "\${CLAUDE_PROJECT_DIR}/${marker}context-guard.mjs"`,
              timeout: 10,
            },
          ],
        },
      ],
      Stop: [userStop],
      Notification: [userNotify],
    },
  };
  mkdirSync(join(scratch, ".claude"), { recursive: true });
  writeFileSync(settingsPath, `${JSON.stringify(seeded, null, 2)}\n`);

  const first = run("--hooks");
  check(
    "merge: install --hooks into pre-populated dest exits 0",
    first.status === 0,
    `exit ${first.status}: ${first.stderr}`,
  );

  // The canonical INSTALLER wiring ships next to the handlers (as hooks.json),
  // so a consumer wiring hooks by hand has the local source of truth — and the
  // plugin-form file must never ship (its ${CLAUDE_PLUGIN_ROOT} paths resolve
  // nowhere in an installer consumer).
  const shippedWiring = join(scratch, ".claude", "hooks", "ai-dev-kit", "hooks.json");
  check(
    "handlers: installer wiring ships next to the handlers as hooks.json",
    existsSync(shippedWiring) &&
      readFileSync(shippedWiring, "utf8") === readFileSync("hooks/installer-hooks.json", "utf8"),
  );
  check(
    "handlers: plugin-form wiring never ships",
    !readFileSync(shippedWiring, "utf8").includes("CLAUDE_PLUGIN_ROOT") &&
      !existsSync(join(scratch, ".claude", "hooks", "ai-dev-kit", "installer-hooks.json")) &&
      !existsSync(join(scratch, ".claude", "hooks", "ai-dev-kit", "plugin-hooks.json")),
  );

  const merged = JSON.parse(readFileSync(settingsPath, "utf8"));
  const markerHooks = (event) =>
    (merged.hooks[event] ?? []).flatMap((e) => e.hooks ?? []).filter(carriesMarker);

  check("preserve: non-hook top-level key survives", eq(merged.permissions, seeded.permissions));
  check(
    "preserve: foreign event (Notification) survives verbatim",
    eq(merged.hooks.Notification, [userNotify]),
  );
  check(
    "preserve: user entry on the (now-kit) Stop event survives",
    (merged.hooks.Stop ?? []).some((e) => eq(e, userStop)),
  );
  check(
    "preserve: user entry on a kit event survives",
    (merged.hooks.PreToolUse ?? []).some((e) => eq(e, userPre)),
  );
  check(
    "preserve: user hook sharing an entry with a kit hook survives",
    (merged.hooks.PostToolUse ?? []).some(
      (e) =>
        e.matcher === "Edit|Write" &&
        eq(e.hooks, [{ type: "command", command: "echo user-post" }]),
    ),
  );

  check(
    "replace: stale kit-marker entry is gone",
    !JSON.stringify(merged).includes("removed-handler.mjs"),
  );
  check(
    "replace: exec-form stale kit entry is gone (marker only in args)",
    !JSON.stringify(merged).includes("removed-exec-handler.mjs"),
  );
  check(
    "preserve: user exec-form hook (no marker) survives",
    (merged.hooks.PreToolUse ?? []).some((e) => eq(e, userExec)),
  );
  for (const event of Object.keys(kitHooks)) {
    // Kit hooks all carry the marker (smoke-hooks enforces the anchored path),
    // so marker-bearing entries after the merge must be exactly hooks.json's.
    const kitEntries = (merged.hooks[event] ?? []).filter((e) =>
      (e.hooks ?? []).some(carriesMarker),
    );
    check(`replace: ${event} kit entries match hooks.json`, eq(kitEntries, kitHooks[event]));
    const want = kitHooks[event].flatMap((e) => e.hooks).length;
    check(
      `no-dup: ${event} marker-hook count equals hooks.json`,
      markerHooks(event).length === want,
      `${markerHooks(event).length} vs ${want}`,
    );
  }

  const afterFirst = readFileSync(settingsPath, "utf8");
  const second = run("--hooks");
  check(
    "byte-stable: re-run reports 0 file(s) written",
    second.status === 0 && second.stdout.includes("0 file(s) written"),
    second.stdout.trim(),
  );
  check(
    "byte-stable: settings.json byte-identical after re-run",
    readFileSync(settingsPath, "utf8") === afterFirst,
  );

  // ---- stale leftovers in kit-owned dirs ----
  const ghost = join(scratch, ".claude", "hooks", "ai-dev-kit", "ghost.mjs");
  const staleNote = join(scratch, ".claude", "skills", "checkpoint", "stale-note.md");
  const nested = join(scratch, ".claude", "skills", "checkpoint", "old-dir", "nested.md");
  const userSkill = join(scratch, ".claude", "skills", "my-own-skill", "SKILL.md");
  for (const f of [ghost, staleNote, nested, userSkill]) {
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, "leftover\n");
  }

  const staleCheck = run("--check");
  check(
    "stale: --check exits 1 on leftovers in kit-owned dirs",
    staleCheck.status === 1,
    `exit ${staleCheck.status}`,
  );
  const staleErr = staleCheck.stderr ?? "";
  check("stale: --check names ghost.mjs", staleErr.includes("ghost.mjs"));
  check("stale: --check names stale-note.md", staleErr.includes("stale-note.md"));
  check("stale: --check names old-dir/nested.md", staleErr.includes("old-dir/nested.md"));
  check("stale: --check leaves non-manifest skills alone", !staleErr.includes("my-own-skill"));

  const prune = run("--hooks");
  check(
    "prune: install reports pruned 3 file(s)",
    prune.status === 0 && prune.stdout.includes("pruned 3 file(s)"),
    prune.stdout.trim(),
  );
  check(
    "prune: leftover files removed",
    !existsSync(ghost) && !existsSync(staleNote) && !existsSync(nested),
  );
  check(
    "prune: emptied subdir removed",
    !existsSync(join(scratch, ".claude", "skills", "checkpoint", "old-dir")),
  );
  check("prune: non-manifest skill untouched", existsSync(userSkill));

  const postCheck = run("--check");
  check("prune: --check green afterwards", postCheck.status === 0, postCheck.stderr.trim());
  const third = run("--hooks");
  check(
    "prune: nothing left to prune, 0 file(s) written",
    third.status === 0 &&
      third.stdout.includes("0 file(s) written") &&
      !third.stdout.includes("pruned"),
    third.stdout.trim(),
  );

  // ---- advisory adapter re-validation on --check (config is user-owned) ----
  // The exit code must stay drift/stale-only; schema issues and unparseable
  // JSON surface as an ADVISORY on stderr, so a broken config is visible
  // instead of silently degrading the skills that read it.
  const cfgPath = join(scratch, ".claude", "ai-dev-kit.config.json");
  writeFileSync(cfgPath, `${JSON.stringify({ project: 42, nope: true })}\n`);
  const advisory = run("--check");
  check(
    "advisory: --check exits 0 despite a broken user config",
    advisory.status === 0,
    `exit ${advisory.status}`,
  );
  check(
    "advisory: broken config draws an ADVISORY on stderr",
    (advisory.stderr ?? "").includes("ADVISORY"),
    (advisory.stderr ?? "").trim(),
  );
  check(
    "advisory: violations named with their config path",
    (advisory.stderr ?? "").includes("config.project") &&
      (advisory.stderr ?? "").includes("config.nope"),
  );
  writeFileSync(cfgPath, `${JSON.stringify({ project: "scratch" })}\n`);
  const advisoryQuiet = run("--check");
  check(
    "advisory: valid config stays quiet",
    advisoryQuiet.status === 0 && !(advisoryQuiet.stderr ?? "").includes("ADVISORY"),
    (advisoryQuiet.stderr ?? "").trim(),
  );
  writeFileSync(cfgPath, "{ not json\n");
  const advisoryUnparseable = run("--check");
  check(
    "advisory: unparseable config warns, exit code unchanged",
    advisoryUnparseable.status === 0 && (advisoryUnparseable.stderr ?? "").includes("ADVISORY"),
    `exit ${advisoryUnparseable.status}: ${(advisoryUnparseable.stderr ?? "").trim()}`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

// ---- adapter fixtures: every shipped adapter installs, re-installs to zero,
// and --checks green. next-web-boilerplate.json is the frozen v1 regression
// fixture; godot-game/rust-cli exercise the v2 fields (projectType ·
// ecosystem · verify) and prove the schema growth stayed additive.
const fixtures = readdirSync("adapters")
  .filter((f) => f.endsWith(".json") && f !== "project.schema.json")
  .sort();
for (const fixture of fixtures) {
  const fdest = mkdtempSync(join(tmpdir(), "adk-fixture-"));
  const frun = (...extra) =>
    spawnSync(process.execPath, [installer, "--dest", fdest, ...extra], { encoding: "utf8" });
  try {
    const first = frun("--adapter", join("adapters", fixture), "--hooks");
    check(`fixture ${fixture}: installs clean`, first.status === 0, (first.stderr ?? "").trim());
    const again = frun("--adapter", join("adapters", fixture), "--hooks");
    check(
      `fixture ${fixture}: idempotent re-run`,
      again.status === 0 && (again.stdout ?? "").includes("0 file(s) written"),
      (again.stdout ?? "").trim(),
    );
    const drift = frun("--check");
    check(`fixture ${fixture}: --check green`, drift.status === 0, (drift.stderr ?? "").trim());
  } finally {
    rmSync(fdest, { recursive: true, force: true });
  }
}

// A v2 enum violation must die loudly pre-write, like any schema violation.
const badDir = mkdtempSync(join(tmpdir(), "adk-badadapter-"));
try {
  const badAdapter = join(badDir, "bad.json");
  writeFileSync(badAdapter, `${JSON.stringify({ projectType: "spaceship" })}\n`);
  const bad = spawnSync(
    process.execPath,
    [installer, "--dest", join(badDir, "dest"), "--adapter", badAdapter],
    { encoding: "utf8" },
  );
  check("fixture: projectType enum violation exits 1", bad.status === 1, `exit ${bad.status}`);
  check(
    "fixture: violation names the enum",
    (bad.stderr ?? "").includes("projectType"),
    (bad.stderr ?? "").trim(),
  );
  check("fixture: violation writes nothing", !existsSync(join(badDir, "dest", ".claude")));
} finally {
  rmSync(badDir, { recursive: true, force: true });
}

// A bannedApis entry missing its required "paths"/"rules" must die loudly
// pre-write too, like any other schema violation (B1-37: the validator didn't
// enforce `required` at all, so this used to install clean and fail-open the
// banned-api-guard at runtime).
const reqDir = mkdtempSync(join(tmpdir(), "adk-required-"));
try {
  const badAdapter = join(reqDir, "bad.json");
  writeFileSync(
    badAdapter,
    `${JSON.stringify({ enforcement: { bannedApis: [{ name: "no-eval" }] } })}\n`,
  );
  const bad = spawnSync(
    process.execPath,
    [installer, "--dest", join(reqDir, "dest"), "--adapter", badAdapter],
    { encoding: "utf8" },
  );
  check("required: missing paths/rules exits 1", bad.status === 1, `exit ${bad.status}`);
  check(
    "required: violation names the missing keys",
    (bad.stderr ?? "").includes('missing required "paths"') &&
      (bad.stderr ?? "").includes('missing required "rules"'),
    (bad.stderr ?? "").trim(),
  );
  check("required: violation writes nothing", !existsSync(join(reqDir, "dest", ".claude")));

  // Same shape, but as an already-installed (user-owned) config re-checked by
  // --check: advisory only, exit code unaffected.
  const advDest = mkdtempSync(join(tmpdir(), "adk-required-check-"));
  const cfgPath = join(advDest, ".claude", "ai-dev-kit.config.json");
  mkdirSync(dirname(cfgPath), { recursive: true });
  writeFileSync(cfgPath, `${JSON.stringify({ enforcement: { bannedApis: [{ name: "x" }] } })}\n`);
  const adv = spawnSync(process.execPath, [installer, "--dest", advDest, "--check"], {
    encoding: "utf8",
  });
  check(
    "required: --check advisory names the missing keys",
    (adv.stderr ?? "").includes('missing required "paths"') &&
      (adv.stderr ?? "").includes('missing required "rules"'),
    (adv.stderr ?? "").trim(),
  );
  rmSync(advDest, { recursive: true, force: true });
} finally {
  rmSync(reqDir, { recursive: true, force: true });
}

// B2-38: a bannedApis rule whose pattern doesn't compile as a RegExp must die
// pre-write (the schema can only assert it's a string, not that it compiles —
// banned-api-guard.mjs would otherwise skip the rule silently at runtime).
const patDir = mkdtempSync(join(tmpdir(), "adk-pattern-"));
try {
  const badAdapter = join(patDir, "bad.json");
  writeFileSync(
    badAdapter,
    `${JSON.stringify({
      enforcement: {
        bannedApis: [{ paths: ["src"], rules: [{ pattern: "(unterminated", why: "x" }] }],
      },
    })}\n`,
  );
  const bad = spawnSync(
    process.execPath,
    [installer, "--dest", join(patDir, "dest"), "--adapter", badAdapter],
    { encoding: "utf8" },
  );
  check("pattern: non-compiling pattern exits 1", bad.status === 1, `exit ${bad.status}`);
  check(
    "pattern: violation names the path and reason",
    (bad.stderr ?? "").includes("rules[0].pattern: not a valid RegExp"),
    (bad.stderr ?? "").trim(),
  );
  check("pattern: violation writes nothing", !existsSync(join(patDir, "dest", ".claude")));

  const advDest = mkdtempSync(join(tmpdir(), "adk-pattern-check-"));
  const cfgPath = join(advDest, ".claude", "ai-dev-kit.config.json");
  mkdirSync(dirname(cfgPath), { recursive: true });
  writeFileSync(
    cfgPath,
    `${JSON.stringify({
      enforcement: {
        bannedApis: [{ paths: ["src"], rules: [{ pattern: "(unterminated", why: "x" }] }],
      },
    })}\n`,
  );
  const adv = spawnSync(process.execPath, [installer, "--dest", advDest, "--check"], {
    encoding: "utf8",
  });
  check(
    "pattern: --check advisory names the non-compiling pattern",
    (adv.stderr ?? "").includes("rules[0].pattern: not a valid RegExp"),
    (adv.stderr ?? "").trim(),
  );
  rmSync(advDest, { recursive: true, force: true });
} finally {
  rmSync(patDir, { recursive: true, force: true });
}

if (failures > 0) process.exit(1);
console.log("installer smoke: all merge + stale + advisory + fixture cases passed.");
