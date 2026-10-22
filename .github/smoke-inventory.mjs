#!/usr/bin/env node
/**
 * CI smoke: harness-audit's inventory.mjs (B3-55, B2-64) against scratch
 * fixtures — every report section. Every child runs with HOME/USERPROFILE
 * pointed into scratch and CLAUDE_CONFIG_DIR / CLAUDE_CODE_PROJECT_DIR_NAME /
 * CLAUDE_CODE_DISABLE_AUTO_MEMORY stripped unless a case sets them, so the
 * real ~/.claude is never read.
 *  - memory dir resolution: project-root slug, git-root slug from a subdir,
 *    linked worktree → main checkout, submodule-shaped .git file,
 *    autoMemoryDirectory, CLAUDE_CODE_PROJECT_DIR_NAME, transcript-cwd
 *    fallback, not-found (exit 0)
 *  - memory budgets: MEMORY.md load cap, adapter token override, an
 *    over-budget topic file, auto memory disabled
 *  - eval presence: the three fixture shapes in the fleet, the kit-managed
 *    collapse, a malformed fixture, a fixture naming no installed skill, a
 *    non-fixture JSON in skill-evals/ ignored, a mis-shaped skill-named one flagged
 *  - skills: table, charged-vs-portable budget, nested plugin skill, references,
 *    a BOM'd SKILL.md, no skills dir, symlinked skill dir, symlink cycle, dangling link
 *  - hooks: loaded rows, reference parity + drift (path-insensitive, `if`-aware),
 *    full-definition dedup, BOM'd / malformed / mis-shaped wiring files,
 *    non-.mjs / prompt / agent handler names, plugin.json manifest hooks
 *    (inline, path, array, escaping path, merged with hooks/hooks.json)
 *  - degradation: a section that throws prints `<Section>: not measured` and
 *    the report continues (exit 0)
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const inventory = join(process.cwd(), "skills/harness-audit/scripts/inventory.mjs");

let failures = 0;
const check = (name, ok, detail = "") => {
  if (ok) {
    console.log(`ok   ${name}`);
  } else {
    failures++;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
};
const posix = (p) => p.replaceAll("\\", "/");
const slug = (p) => resolve(p).replace(/[^a-zA-Z0-9]/g, "-");
const put = (path, text) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

const scratch = mkdtempSync(join(tmpdir(), "adk-inventory-"));
const home = join(scratch, "home");
const defaultCfg = join(home, ".claude");
const memDir = (cfgDir, dirName) => join(cfgDir, "projects", dirName, "memory");

const run = (root, env = {}, timeout = 60_000) => {
  const childEnv = { ...process.env, HOME: home, USERPROFILE: home, ...env };
  for (const k of ["CLAUDE_CONFIG_DIR", "CLAUDE_CODE_PROJECT_DIR_NAME", "CLAUDE_CODE_DISABLE_AUTO_MEMORY"]) {
    if (!(k in env)) delete childEnv[k];
  }
  const r = spawnSync(process.execPath, [inventory, root], { encoding: "utf8", env: childEnv, timeout });
  return { status: r.status, out: r.stdout ?? "", err: r.stderr ?? "", signal: r.signal };
};
/** A project root with one plain local skill, so inventory has a skills dir. */
const project = (rel) => {
  const root = join(scratch, rel);
  put(join(root, ".claude/skills/local-skill/SKILL.md"), "---\nname: local-skill\ndescription: x\n---\nbody\n");
  return root;
};
const resolvedDir = (out) => out.match(/^Directory: (.+) \(resolved via (.+)\)\.?$/m);
const expectDir = (name, r, dir, method) => {
  const m = resolvedDir(r.out);
  check(`${name}: exits 0`, r.status === 0, `exit ${r.status} ${r.err.trim()}`);
  check(`${name}: resolves ${posix(dir)}`, m?.[1] === posix(dir), m ? m[1] : "no Directory line");
  check(`${name}: via ${method}`, (m?.[2] ?? "").startsWith(method), m ? m[2] : "no Directory line");
};
const noMem = { CLAUDE_CONFIG_DIR: join(scratch, "empty-cfg") };
const sectionOf = (out, title) => out.split(new RegExp(`^## ${title}$`, "m"))[1]?.split(/^## /m)[0] ?? "";
const countOf = (text, re) => (text.match(re) ?? []).length;
const hooksJson = (map) => JSON.stringify({ hooks: map });
const cmd = (command, extra = {}) => ({ type: "command", command, ...extra });
/** A directory link — a junction on Windows (no privilege needed), the type is
 * ignored on POSIX. False (with a printed skip) when the platform refuses. */
const link = (target, path) => {
  try {
    mkdirSync(dirname(path), { recursive: true });
    symlinkSync(target, path, "junction");
    return true;
  } catch (e) {
    console.log(`skip ${posix(path)} — directory link refused (${e.code ?? e.message})`);
    return false;
  }
};

// Case 1's expectation (project root, no repo) only holds when no ancestor of
// the scratch dir is itself a git checkout (e.g. a home dir under version control).
const ancestorGit = (() => {
  for (let d = resolve(scratch); ; d = dirname(d)) {
    if (existsSync(join(d, ".git"))) return d;
    if (dirname(d) === d) return null;
  }
})();

try {
  // ---- 1. no repo: slug of the project root under the default config dir ----
  if (ancestorGit) {
    console.log(`skip no-repo slug — scratch sits inside a git checkout (${ancestorGit})`);
  } else {
    const root = project("plain");
    const dir = memDir(defaultCfg, slug(root));
    put(join(dir, "MEMORY.md"), "# idx\n- [a](a.md) — hook\n- [b](b.md) — hook\n");
    put(join(dir, "a.md"), "fact a\n");
    const r = run(root);
    expectDir("no-repo slug", r, dir, "project-root slug");
    check("no-repo slug: MEMORY.md measured", /^MEMORY\.md: 3 lines · /m.test(r.out), r.out);
    check("no-repo slug: topic files counted", /^Topic files: 1 · /m.test(r.out), r.out);
  }

  // ---- 2. subdir of a repo → the repo root's slug ----
  {
    const repo = join(scratch, "repo");
    mkdirSync(join(repo, ".git"), { recursive: true });
    const root = project("repo/sub");
    const dir = memDir(defaultCfg, slug(repo));
    put(join(dir, "MEMORY.md"), "- one\n");
    expectDir("repo subdir", run(root), dir, "git-root slug");
  }

  // ---- 3. linked worktree (.git file + commondir) → the main checkout's slug ----
  {
    const main = join(scratch, "main");
    const wtGit = join(main, ".git", "worktrees", "wt");
    put(join(wtGit, "commondir"), "../..\n");
    const root = project("wt");
    put(join(root, ".git"), `gitdir: ${wtGit}\n`);
    const dir = memDir(defaultCfg, slug(main));
    put(join(dir, "MEMORY.md"), "- one\n");
    expectDir("linked worktree", run(root), dir, "git-root slug");
  }

  // ---- 3b. submodule-shaped .git file (no commondir) → the dir holding it ----
  {
    const root = project("submod");
    put(join(scratch, "super", ".git", "modules", "submod", "HEAD"), "ref: refs/heads/main\n");
    put(join(root, ".git"), "gitdir: ../super/.git/modules/submod\n");
    const dir = memDir(defaultCfg, slug(root));
    put(join(dir, "MEMORY.md"), "- one\n");
    expectDir("submodule .git file", run(root), dir, "git-root slug");
  }

  // ---- 4. autoMemoryDirectory (~/ form) beats the slug dir ----
  {
    const root = project("custom");
    put(join(root, ".claude/settings.json"), JSON.stringify({ autoMemoryDirectory: "~/custom-mem" }));
    put(join(memDir(defaultCfg, slug(root)), "MEMORY.md"), "- slug copy\n");
    const dir = join(home, "custom-mem");
    put(join(dir, "MEMORY.md"), "- custom\n");
    const r = run(root);
    expectDir("autoMemoryDirectory", r, dir, "autoMemoryDirectory");
    check("autoMemoryDirectory: trust caveat on a project-scope setting", /trusted/.test(r.out), r.out);
  }

  // ---- 5. CLAUDE_CONFIG_DIR + CLAUDE_CODE_PROJECT_DIR_NAME ----
  {
    const cfg = join(scratch, "cfg5");
    const root = project("named");
    put(join(memDir(cfg, slug(root)), "MEMORY.md"), "- slug copy\n");
    const dir = memDir(cfg, "shared-name");
    put(join(dir, "MEMORY.md"), "- shared\n");
    const r = run(root, { CLAUDE_CONFIG_DIR: cfg, CLAUDE_CODE_PROJECT_DIR_NAME: "shared-name" });
    expectDir("CLAUDE_CODE_PROJECT_DIR_NAME", r, dir, "CLAUDE_CODE_PROJECT_DIR_NAME");
  }

  // ---- 6. slug dir absent, a transcript's cwd names the project ----
  {
    const cfg = join(scratch, "cfg6");
    const root = project("transcript");
    const dir = memDir(cfg, "truncated-abc123");
    put(join(dir, "MEMORY.md"), "- found by transcript\n");
    put(
      join(cfg, "projects", "truncated-abc123", "session.jsonl"),
      `${JSON.stringify({ type: "user", cwd: resolve(root) })}\n`,
    );
    put(join(memDir(cfg, "unrelated"), "MEMORY.md"), "- other\n");
    put(join(cfg, "projects", "unrelated", "s.jsonl"), `${JSON.stringify({ cwd: resolve(scratch, "elsewhere") })}\n`);
    expectDir("transcript fallback", run(root, { CLAUDE_CONFIG_DIR: cfg }), dir, "transcript cwd");
  }

  // ---- 7. nothing on disk → says so, names what it tried, exits 0 ----
  {
    const root = project("orphan");
    const r = run(root, { CLAUDE_CONFIG_DIR: join(scratch, "empty-cfg") });
    check("not found: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check(
      "not found: reported with tried paths",
      /No auto-memory directory found — tried: .*empty-cfg/.test(r.out),
      r.out,
    );
  }

  // ---- 8. budgets: load cap, adapter override, over-budget topic, disabled ----
  {
    const root = project("budget");
    put(
      join(root, ".claude/ai-dev-kit.config.json"),
      JSON.stringify({ contextBudget: { memoryIndexMaxTokens: 10 } }),
    );
    const dir = memDir(defaultCfg, slug(root));
    put(join(dir, "MEMORY.md"), `${Array.from({ length: 205 }, (_, i) => `- line ${i}`).join("\n")}\n`);
    put(join(dir, "big.md"), "x".repeat(1600 * 4));
    put(join(dir, "small.md"), "fine\n");
    const r = run(root, { CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" });
    check("budget: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check(
      "budget: adapter index budget honored",
      /^MEMORY\.md: 205 lines .*budget 10\b.*over budget/m.test(r.out),
      r.out,
    );
    check("budget: load cap flagged", /\*\*Load cap\*\*.*200 lines/.test(r.out), r.out);
    check("budget: over-budget topic file listed", /^\| big\.md \| 1600 \|$/m.test(r.out), r.out);
    check("budget: in-budget topic file not listed", !/^\| small\.md/m.test(r.out), r.out);
    check(
      "budget: auto memory disabled noted",
      /^Auto memory: disabled \(CLAUDE_CODE_DISABLE_AUTO_MEMORY\)/m.test(r.out),
      r.out,
    );
  }

  // ---- 9. eval presence: shapes A/B/C, kit-managed collapse, bad fixtures ----
  {
    const root = project("evals");
    for (const s of ["alpha", "beta", "gamma", "kitskill"]) {
      put(join(root, `.claude/skills/${s}/SKILL.md`), `---\nname: ${s}\ndescription: x\n---\nbody\n`);
    }
    put(
      join(root, ".claude/ai-dev-kit.installed.json"),
      JSON.stringify({ kit: "0.0.0", skills: { kitskill: "0.1.0" } }),
    );
    put(join(root, ".github/skill-evals/alpha.json"), JSON.stringify({ skill: "alpha", scenarios: [{}, {}] }));
    put(join(root, ".github/skill-evals/broken.json"), "{not json");
    put(join(root, ".github/skill-evals/ghost.json"), JSON.stringify({ skill: "ghost", scenarios: [{}] }));
    put(join(root, ".github/skill-evals/results.json"), JSON.stringify({ runs: [{ pass: 3 }] }));
    put(join(root, ".github/skill-evals/local-skill.json"), JSON.stringify({ cases: [{}] }));
    put(join(root, "evals/evals.json"), JSON.stringify({ skills: [{ skill: "beta", scenarios: [{}, {}, {}] }] }));
    put(join(root, ".claude/skills/gamma/evals/evals.json"), JSON.stringify({ skill_name: "gamma", evals: [{}] }));
    const r = run(root, { CLAUDE_CONFIG_DIR: join(scratch, "empty-cfg") });
    const section = r.out.split(/^## Eval presence$/m)[1]?.split(/^## /m)[0] ?? "";
    check("evals: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check("evals: section present", section !== "", r.out);
    check(
      "evals: kit-format fixture (A)",
      /^\| alpha \| \.github\/skill-evals\/alpha\.json \| 2 \|$/m.test(r.out),
      r.out,
    );
    check("evals: aggregate fixture (B)", /^\| beta \| evals\/evals\.json \| 3 \|$/m.test(r.out), r.out);
    check(
      "evals: per-skill fixture (C)",
      /^\| gamma \| \.claude\/skills\/gamma\/evals\/evals\.json \| 1 \|$/m.test(r.out),
      r.out,
    );
    check("evals: uncovered local skill shown", /^\| local-skill \| — \| — \|$/m.test(r.out), r.out);
    check(
      "evals: kit-managed skill collapsed",
      /^1 kit-managed skill\(s\) without a local fixture.*kitskill/m.test(section) && !/^\| kitskill /m.test(section),
      r.out,
    );
    check("evals: coverage summary", /Project-local skills with fixtures: 3\/4\./.test(r.out), r.out);
    check("evals: malformed fixture reported", /Unreadable fixture\(s\): .*broken\.json/.test(r.out), r.out);
    check("evals: fixture naming no installed skill reported", /naming no installed skill: .*ghost/.test(r.out), r.out);
    check(
      "evals: non-fixture JSON in skill-evals/ ignored, not unreadable",
      /^Ignored \(not a fixture shape\): \.github\/skill-evals\/results\.json\.$/m.test(section) &&
        !/Unreadable fixture\(s\): .*results\.json/.test(section),
      section,
    );
    check(
      "evals (regression guard): mis-shaped fixture named for an installed skill still flagged",
      /Unreadable fixture\(s\): .*local-skill\.json/.test(section),
      section,
    );
  }

  // ---- 10. skills section (regression guards): table, budget split, nested plugin skill, references ----
  {
    const root = project("skills");
    put(
      join(root, ".claude/skills/manual/SKILL.md"),
      `---\nname: manual\ndescription: ${"d".repeat(40)}\ndisable-model-invocation: true\n---\n${"b".repeat(20)}\n`,
    );
    put(join(root, ".claude/skills/manual/scripts/s.mjs"), "x\n");
    put(join(root, ".claude/skills/manual/references/r.md"), "x\n");
    put(join(root, ".claude/skills/plug/.claude-plugin/plugin.json"), JSON.stringify({ name: "plug" }));
    put(join(root, ".claude/skills/plug/skills/nested/SKILL.md"), "---\nname: nested\ndescription: abcd\n---\nb\n");
    put(join(root, ".claude/skills/bommed/SKILL.md"), "﻿---\nname: bommed\ndescription: abcdefgh\n---\nbody\n");
    const r = run(root, noMem);
    const section = sectionOf(r.out, "Skills");
    check("skills: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check("skills: plain skill row", /^\| local-skill \| 1 \| 1 \| 2 \| — \|$/m.test(section), section);
    check(
      "skills: references/scripts listed (sorted)",
      /^\| manual \| 40 \| 10 \| 6 \| references\/r\.md, scripts\/s\.mjs \|$/m.test(section),
      section,
    );
    check("skills: nested plugin skill labelled plugin/skill", /^\| plug\/nested \| 4 \| 1 \| 1 \| — \|$/m.test(section), section);
    check("skills: BOM'd SKILL.md frontmatter read", /^\| bommed \| 8 \| 2 \| 2 \| — \|$/m.test(section), section);
    check(
      "skills: portable vs charged budget split",
      /≈14 tokens across 4 skills \(portable\) — ≈4 tokens across 3 skills \(Claude Code charged/.test(section),
      section,
    );
  }

  // ---- 11. hooks section (regression guards): loaded row, reference parity, drift ----
  {
    const root = project("hooks-parity");
    const loaded = (h) => cmd("node", { args: [`\${CLAUDE_PROJECT_DIR}/.claude/hooks/kit/${h}`], timeout: 10 });
    const ref = (h) => cmd("node", { args: [`\${CLAUDE_PLUGIN_ROOT}/hooks/${h}`], timeout: 10 });
    put(join(root, ".claude/settings.json"), hooksJson({ PreToolUse: [{ matcher: "Bash", hooks: [loaded("guard.mjs")] }] }));
    put(join(root, "hooks/hooks.json"), hooksJson({ PreToolUse: [{ matcher: "Bash", hooks: [ref("guard.mjs")] }] }));
    let r = run(root, noMem);
    let section = sectionOf(r.out, "Hooks");
    check("hooks: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check(
      "hooks: loaded row",
      /^\| PreToolUse \| Bash \| guard\.mjs \| command \| — \| 10 \| \.claude\/settings\.json \|$/m.test(section),
      section,
    );
    check("hooks: reference parity across path spellings", /1 unique, all matching a loaded row above\./.test(section), section);
    check("hooks: no drift when parity holds", !/\*\*Drift\*\*/.test(section), section);

    put(
      join(root, "hooks/hooks.json"),
      hooksJson({ PreToolUse: [{ matcher: "Bash", hooks: [ref("guard.mjs"), ref("orphan.mjs")] }] }),
    );
    r = run(root, noMem);
    section = sectionOf(r.out, "Hooks");
    check(
      "hooks: reference-only hook reported as drift",
      /\*\*Drift\*\* — 1 reference-only hook\(s\).*PreToolUse\|Bash\|orphan\.mjs/.test(section),
      section,
    );
  }

  // ---- 12. B2-64: BOM'd, malformed and mis-shaped wiring files degrade, never abort ----
  {
    const root = project("bom-ok");
    put(
      join(root, ".claude/settings.json"),
      `\uFEFF${hooksJson({ PreToolUse: [{ matcher: "Bash", hooks: [cmd("node lint.mjs")] }] })}`,
    );
    const r = run(root, noMem);
    check("bom: BOM'd settings.json exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check("bom: BOM'd settings.json hooks parsed", /^\| PreToolUse \| Bash \| lint\.mjs \|/m.test(r.out), r.out);
  }
  {
    const root = project("bom-bad");
    put(join(root, ".claude/settings.json"), "\uFEFF{not json");
    put(join(root, ".claude/settings.local.json"), hooksJson({ Stop: [{ hooks: [cmd("node keep.mjs")] }] }));
    put(join(root, "CLAUDE.md"), "# rules\n");
    const r = run(root, noMem);
    check("bom: malformed body exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check("bom: malformed body → unreadable line", /^unreadable: \.claude\/settings\.json \(.+\)$/m.test(r.out), r.out);
    check("bom: other wiring file still read", /^\| Stop \| \* \| keep\.mjs \|/m.test(r.out), r.out);
    check(
      "bom: later sections survive",
      /^## Standing-instruction file$/m.test(r.out) && /^CLAUDE\.md: 1 lines/m.test(r.out) && /^## Memory$/m.test(r.out),
      r.out,
    );
  }
  {
    const root = project("bad-shape");
    put(join(root, ".claude/settings.json"), JSON.stringify({ hooks: { Stop: { x: 1 } } }));
    put(join(root, "CLAUDE.md"), "# rules\n");
    const r = run(root, noMem);
    check("shape: non-array event exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check("shape: non-array event → unreadable line", /^unreadable: \.claude\/settings\.json \(.*Stop.*\)$/m.test(r.out), r.out);
    check(
      "shape: later sections survive",
      /^## Standing-instruction file$/m.test(r.out) && /^## Memory$/m.test(r.out),
      r.out,
    );
  }
  {
    const root = project("bom-budget");
    put(join(root, ".claude/ai-dev-kit.config.json"), `\uFEFF${JSON.stringify({ contextBudget: { agentsMdMaxLines: 7 } })}`);
    put(join(root, "CLAUDE.md"), "a\nb\nc\n");
    const r = run(root, noMem);
    check("bom: BOM'd adapter contextBudget honored", /^CLAUDE\.md: 3 lines \(budget 7\)/m.test(r.out), r.out);
  }

  // ---- 13. B2-64: loaded dedup on the full definition; parity keyed with `if` ----
  {
    const root = project("dedup");
    const guard = (base, cond) => cmd("node", { args: [`${base}/guard.mjs`], if: cond });
    const stop = { hooks: [cmd("node s/stop.mjs")] };
    put(
      join(root, ".claude/settings.json"),
      hooksJson({
        PreToolUse: [
          {
            matcher: "Bash|PowerShell",
            hooks: [guard("${CLAUDE_PROJECT_DIR}/g", "Bash(git *)"), guard("${CLAUDE_PROJECT_DIR}/g", "PowerShell(git *)")],
          },
        ],
        Stop: [stop],
      }),
    );
    put(join(root, ".claude/settings.local.json"), hooksJson({ Stop: [stop] }));
    put(
      join(root, "hooks/hooks.json"),
      hooksJson({
        PreToolUse: [
          {
            matcher: "Bash|PowerShell",
            hooks: [
              guard("${CLAUDE_PLUGIN_ROOT}/hooks", "Bash(git *)"),
              guard("${CLAUDE_PLUGIN_ROOT}/hooks", "PowerShell(git *)"),
              guard("${CLAUDE_PLUGIN_ROOT}/hooks", "Bash(rm *)"),
            ],
          },
        ],
        Stop: [{ hooks: [cmd("node ${CLAUDE_PLUGIN_ROOT}/hooks/stop.mjs")] }],
      }),
    );
    const r = run(root, noMem);
    const section = sectionOf(r.out, "Hooks");
    check("dedup: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check(
      "dedup: same handler, different `if` → 2 loaded rows",
      countOf(section, /^\| PreToolUse \| Bash\|PowerShell \| guard\.mjs \|/gm) === 2,
      section,
    );
    check(
      "dedup (regression guard): identical hook in settings.json + settings.local.json → 1 row",
      countOf(section, /^\| Stop \| \* \| stop\.mjs \|/gm) === 1,
      section,
    );
    check("dedup: loaded count", /^3 hook\(s\) loaded\./m.test(section), section);
    check(
      "dedup: reference differing only in `if` is drift",
      /\*\*Drift\*\* — 1 reference-only hook\(s\).*guard\.mjs\|Bash\(rm \*\)/.test(section),
      section,
    );
  }

  // ---- 14. B2-64: non-.mjs command, prompt and agent handlers get distinct names ----
  {
    const root = project("handlers");
    put(
      join(root, ".claude/settings.json"),
      hooksJson({
        PostToolUse: [
          {
            matcher: "*",
            hooks: [
              cmd("bash lint.sh"),
              cmd("python3 check.py --strict"),
              cmd("npx eslint ."),
              cmd('"C:/Program Files/nodejs/node.exe" "C:/hooks/win-hook.mjs"'),
              { type: "prompt", prompt: "Is this edit safe? Answer yes or no and explain why." },
              { type: "agent", prompt: "Verify the tests pass" },
            ],
          },
        ],
      }),
    );
    const r = run(root, noMem);
    const section = sectionOf(r.out, "Hooks");
    check("handlers: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check("handlers: .sh by basename", /^\| PostToolUse \| \* \| lint\.sh \| command \|/m.test(section), section);
    check("handlers: .py by basename", /^\| PostToolUse \| \* \| check\.py \| command \|/m.test(section), section);
    check("handlers: bare command by first token", /^\| PostToolUse \| \* \| npx \| command \|/m.test(section), section);
    check(
      "handlers: prompt hook by its prompt",
      /^\| PostToolUse \| \* \| prompt: "Is this edit safe\? Answer yes or no and…" \| prompt \|/m.test(section),
      section,
    );
    check(
      "handlers: agent hook by its prompt",
      /^\| PostToolUse \| \* \| agent: "Verify the tests pass" \| agent \|/m.test(section),
      section,
    );
    check(
      "handlers (regression guard): an .exe interpreter yields to the script it runs",
      /^\| PostToolUse \| \* \| win-hook\.mjs \| command \|/m.test(section) && !/\| node\.exe \|/.test(section),
      section,
    );
    check("handlers: no `?` rows, 6 loaded", !/\| \? \|/.test(section) && /^6 hook\(s\) loaded\./m.test(section), section);
  }

  // ---- 15. B2-64: plugin.json manifest hooks (inline · path · array · escape · merged) ----
  {
    const root = project("plugins");
    const sk = (p) => join(root, ".claude/skills", p);
    const manifest = (dir, extra) => put(sk(`${dir}/.claude-plugin/plugin.json`), JSON.stringify({ name: dir, ...extra }));
    manifest("inl", { hooks: { PreToolUse: [{ matcher: "Bash", hooks: [cmd("node ${CLAUDE_PLUGIN_ROOT}/hooks/inline-a.mjs")] }] } });
    manifest("pth", { hooks: "./config/extra.json" });
    put(sk("pth/config/extra.json"), hooksJson({ PostToolUse: [{ matcher: "Edit", hooks: [cmd("node path-b.mjs")] }] }));
    manifest("mix", { hooks: ["../../../evil.json", { Stop: [{ hooks: [cmd("node inline-c.mjs")] }] }] });
    put(join(root, "evil.json"), hooksJson({ Stop: [{ hooks: [cmd("node evil.mjs")] }] }));
    manifest("both", {
      hooks: { SessionStart: [{ matcher: "startup", hooks: [cmd("node both-x.mjs"), cmd("node both-z.mjs")] }] },
    });
    put(
      sk("both/hooks/hooks.json"),
      hooksJson({ SessionStart: [{ matcher: "startup", hooks: [cmd("node both-x.mjs"), cmd("node both-y.mjs")] }] }),
    );
    put(
      join(root, ".claude-plugin/plugin.json"),
      JSON.stringify({ name: "rootplug", hooks: { Stop: [{ hooks: [cmd("node root-ref.mjs")] }] } }),
    );
    const r = run(root, noMem);
    const section = sectionOf(r.out, "Hooks");
    check("plugins: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check(
      "plugins: inline manifest hooks loaded from plugin.json",
      /^\| PreToolUse \| Bash \| inline-a\.mjs \| .* \| \.claude\/skills\/inl\/\.claude-plugin\/plugin\.json \|$/m.test(section),
      section,
    );
    check(
      "plugins: manifest path-string hooks file loaded",
      /^\| PostToolUse \| Edit \| path-b\.mjs \| .* \| \.claude\/skills\/pth\/config\/extra\.json \|$/m.test(section),
      section,
    );
    check("plugins: inline object inside a manifest array loaded", /^\| Stop \| \* \| inline-c\.mjs \|/m.test(section), section);
    check(
      "plugins: path escaping the plugin dir refused",
      !/evil\.mjs/.test(section) && /^unreadable: .*mix.*escapes plugin directory/m.test(section),
      section,
    );
    check(
      "plugins: manifest hooks merge with hooks/hooks.json",
      countOf(section, /^\| SessionStart \| startup \| both-x\.mjs \|/gm) === 1 &&
        /\| both-y\.mjs \|/.test(section) &&
        /\| both-z\.mjs \|/.test(section),
      section,
    );
    check(
      "plugins: root plugin.json inline hooks are a reference (drift)",
      /\*\*Drift\*\* — 1 reference-only hook\(s\).*root-ref\.mjs/.test(section) && !/^\| Stop \| \* \| root-ref\.mjs/m.test(section),
      section,
    );
  }

  // ---- 16. B2-64: no skills dir → "Skills: none", the rest of the report still runs ----
  {
    const root = join(scratch, "noskills");
    put(join(root, ".claude/settings.json"), hooksJson({ Stop: [{ hooks: [cmd("node keep.mjs")] }] }));
    put(join(root, "CLAUDE.md"), "# rules\n");
    const r = run(root, noMem);
    check("noskills: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check(
      "noskills: says Skills: none",
      /^## Skills$/m.test(r.out) && /^Skills: none \(looked for \.claude\/skills, skills under .+\)/m.test(r.out),
      r.out,
    );
    check(
      "noskills: hooks, eval presence and instruction file still reported",
      /^\| Stop \| \* \| keep\.mjs \|/m.test(r.out) && /^## Eval presence$/m.test(r.out) && /^CLAUDE\.md: 1 lines/m.test(r.out),
      r.out,
    );
  }

  // ---- 17. B2-64: linked skill dirs followed; cycles and dangling links are guards ----
  {
    const root = project("links");
    const target = join(scratch, "link-src", "linked-skill");
    put(join(target, "SKILL.md"), "---\nname: linked-skill\ndescription: x\n---\nbody\n");
    put(join(target, "references/r.md"), "x\n");
    const linked = link(target, join(root, ".claude/skills/linked-skill"));
    const dangling = link(join(scratch, "nowhere"), join(root, ".claude/skills/dangling"));
    if (linked || dangling) {
      const r = run(root, noMem);
      const section = sectionOf(r.out, "Skills");
      check("links: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
      if (linked) {
        check("links: linked skill dir in the table", /^\| linked-skill \| 1 \| 1 \| 2 \| references\/r\.md \|$/m.test(section), section);
      }
      if (dangling) check("links (regression guard): dangling link skipped", !/^\| dangling /m.test(section), section);
    }
  }
  {
    // Regression guard: cannot fail on pre-B2-64 code (links weren't followed);
    // against a follow-links walk with no seen-set it hangs — two back-links
    // make it 2^depth before the OS's ELOOP / path-length limit stops a branch.
    const root = project("cycle");
    const cyc = join(root, ".claude/skills/cyc");
    put(join(cyc, "SKILL.md"), "---\nname: cyc\ndescription: x\n---\nbody\n");
    if (link(cyc, join(cyc, "a")) && link(cyc, join(cyc, "b"))) {
      const r = run(root, noMem, 20_000);
      check(
        "cycle (regression guard): a link back to its parent terminates",
        r.status === 0 && r.signal === null,
        `exit ${r.status} signal ${r.signal} ${r.err.trim().split("\n")[0]}`,
      );
      check("cycle (regression guard): skill still reported", /^\| cyc \|/m.test(r.out), r.out);
    }
  }

  // ---- 18. B2-64: a section that throws is reported "not measured"; the rest runs ----
  {
    const root = project("eisdir");
    mkdirSync(join(root, ".claude/skills/weird/SKILL.md"), { recursive: true });
    put(join(root, "CLAUDE.md"), "# rules\n");
    const r = run(root, noMem);
    check("degrade: exits 0", r.status === 0, `exit ${r.status} ${r.err.trim()}`);
    check("degrade: Skills not measured", /^Skills: not measured — /m.test(r.out), r.out);
    check(
      "degrade: later sections survive",
      /^## Hooks$/m.test(r.out) && /^## Standing-instruction file$/m.test(r.out) && /^## Memory$/m.test(r.out),
      r.out,
    );
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\ninventory smoke: ${failures} failure(s).`);
  process.exit(1);
}
console.log("inventory smoke: all skills, eval-presence, hooks, instruction-file and memory cases passed.");
