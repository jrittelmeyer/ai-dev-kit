#!/usr/bin/env node
/**
 * CI smoke: harness-audit's inventory.mjs memory and eval-presence sections
 * (B3-55) against scratch fixtures. Every child runs with HOME/USERPROFILE
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
 *    collapse, a malformed fixture, a fixture naming no installed skill
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

const run = (root, env = {}) => {
  const childEnv = { ...process.env, HOME: home, USERPROFILE: home, ...env };
  for (const k of ["CLAUDE_CONFIG_DIR", "CLAUDE_CODE_PROJECT_DIR_NAME", "CLAUDE_CODE_DISABLE_AUTO_MEMORY"]) {
    if (!(k in env)) delete childEnv[k];
  }
  const r = spawnSync(process.execPath, [inventory, root], { encoding: "utf8", env: childEnv });
  return { status: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
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
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\ninventory smoke: ${failures} failure(s).`);
  process.exit(1);
}
console.log("inventory smoke: all memory-resolution, budget and eval-presence cases passed.");
