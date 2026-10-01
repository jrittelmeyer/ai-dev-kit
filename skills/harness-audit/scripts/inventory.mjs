#!/usr/bin/env node
/**
 * harness-audit §1 inventory emitter — zero-dep, no network. Measures the
 * local surface (per-skill description/body sizes + references, eval fixture
 * presence, wired hook events, the standing-instruction file, the project's
 * auto-memory budgets) so a harness-audit run starts from numbers instead of
 * hand-counts. Report-only: never fails, never writes files. The only read
 * outside the project root is the auto-memory directory under the Claude Code
 * config dir (`~/.claude`, or `CLAUDE_CONFIG_DIR`).
 *
 * Usage: node .claude/skills/harness-audit/scripts/inventory.mjs [projectRoot]
 *        (run from the consumer's project root; projectRoot defaults to cwd)
 */
import { closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const root = process.argv[2] ?? process.cwd();
const tokens = (s) => Math.ceil(s.length / 4);
const posix = (p) => p.replaceAll("\\", "/");
const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
};

/** Minimal frontmatter reader: `---` fence, `key: value` scalars + `>-` folded blocks. */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fields: {}, body: text };
  const fields = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      fields[key] = kv[2] === ">-" || kv[2] === ">" ? "" : kv[2];
    } else if (key && /^\s+\S/.test(line)) {
      fields[key] = (fields[key] ? `${fields[key]} ` : "") + line.trim();
    }
  }
  return { fields, body: text.slice(m[0].length) };
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });

function findSkillsDir() {
  for (const candidate of [".claude/skills", "skills"]) {
    if (existsSync(join(root, candidate))) return candidate;
  }
  return null;
}

/** Every skill directory under `skillsDir`, one level deep as a plain skill
 * (`<skillsDir>/<name>/SKILL.md`), or one level deeper still when `<name>`
 * is itself a skills-dir plugin (`<skillsDir>/<name>/.claude-plugin/
 * plugin.json` + `<skillsDir>/<name>/skills/<nested>/SKILL.md`) — the route
 * A95/D072 packages ai-dev-kit's own kit-managed skills through, so a
 * consumer who takes that route doesn't go invisible to this inventory.
 * `label` disambiguates nested skills as `<plugin>/<skill>` in the report. */
function collectSkillDirs(skillsDir) {
  const out = [];
  const entries = readdirSync(join(root, skillsDir), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  for (const name of entries) {
    const base = join(root, skillsDir, name);
    if (existsSync(join(base, "SKILL.md"))) {
      out.push({ label: name, dirPath: base });
      continue;
    }
    const pluginManifest = join(base, ".claude-plugin", "plugin.json");
    const pluginSkillsDir = join(base, "skills");
    if (existsSync(pluginManifest) && existsSync(pluginSkillsDir)) {
      const nested = readdirSync(pluginSkillsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
      for (const n of nested) {
        const p = join(pluginSkillsDir, n);
        if (existsSync(join(p, "SKILL.md"))) out.push({ label: `${name}/${n}`, dirPath: p });
      }
    }
  }
  return out;
}

function skillRows(skillsDir) {
  const rows = [];
  for (const { label, dirPath } of collectSkillDirs(skillsDir)) {
    const skillPath = join(dirPath, "SKILL.md");
    const { fields, body } = parseFrontmatter(readFileSync(skillPath, "utf8"));
    const desc = fields.description ?? "";
    const files = walk(dirPath).filter((f) => !f.endsWith("SKILL.md"));
    const refs = files.map((f) => posix(relative(dirPath, f)));
    rows.push({
      name: label,
      descChars: desc.length,
      descTok: tokens(desc),
      bodyTok: tokens(body),
      charged: fields["disable-model-invocation"] !== "true",
      refs,
    });
  }
  return rows;
}

/** Wired hook events from a single hooks.json- or settings.json-shaped file
 * (both nest { hooks: { EventName: [{ matcher, hooks: [...] }] } }).
 * 'source' is "loaded" for a file Claude Code reads directly
 * (.claude/settings*.json) or "reference" for an installer/plugin-manifest
 * copy (hooks/hooks.json, or an installed hook dir's own hooks.json) that
 * describes the same hooks but is not itself read by Claude Code. */
function hooksFromFile(path, source) {
  const rows = [];
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  const wired = parsed.hooks ?? {};
  for (const [event, entries] of Object.entries(wired)) {
    for (const entry of entries) {
      for (const h of entry.hooks ?? []) {
        const handler =
          [h.command ?? "", ...(Array.isArray(h.args) ? h.args : [])]
            .join(" ")
            .match(/([\w-]+\.mjs)\b/)?.[1] ?? "?";
        rows.push({
          event,
          matcher: entry.matcher ?? "*",
          handler,
          type: h.type ?? "command",
          if: h.if ?? "",
          timeout: h.timeout ?? "",
          file: posix(relative(root, path)),
          source,
        });
      }
    }
  }
  return rows;
}

function findHookFiles() {
  const found = [];
  for (const candidate of ["hooks/hooks.json", "hooks/installer-hooks.json"]) {
    const p = join(root, candidate);
    if (existsSync(p)) found.push({ path: p, source: "reference" });
  }
  for (const candidate of [".claude/settings.json", ".claude/settings.local.json"]) {
    const p = join(root, candidate);
    if (existsSync(p)) found.push({ path: p, source: "loaded" });
  }
  const installedDir = join(root, ".claude/hooks");
  if (existsSync(installedDir)) {
    for (const entry of readdirSync(installedDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const p = join(installedDir, entry.name, "hooks.json");
      if (existsSync(p)) found.push({ path: p, source: "reference" });
    }
  }
  // Skills-dir plugins (`.claude/skills/<name>/.claude-plugin/plugin.json`)
  // auto-load their own `hooks/hooks.json` directly — no settings.json merge,
  // no separate reference copy to drift against (A95/D072).
  const skillsDirPath = join(root, ".claude/skills");
  if (existsSync(skillsDirPath)) {
    for (const entry of readdirSync(skillsDirPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pluginManifest = join(skillsDirPath, entry.name, ".claude-plugin", "plugin.json");
      const pluginHooks = join(skillsDirPath, entry.name, "hooks", "hooks.json");
      if (existsSync(pluginManifest) && existsSync(pluginHooks)) {
        found.push({ path: pluginHooks, source: "loaded" });
      }
    }
  }
  return found;
}

function printSkillTable(rows) {
  console.log("## Skills\n");
  console.log("| skill | desc chars | desc ≈tok | body ≈tok | references/scripts |");
  console.log("|---|---:|---:|---:|---|");
  let totalDescTok = 0;
  let chargedDescTok = 0;
  for (const r of rows) {
    totalDescTok += r.descTok;
    if (r.charged) chargedDescTok += r.descTok;
    console.log(`| ${r.name} | ${r.descChars} | ${r.descTok} | ${r.bodyTok} | ${r.refs.join(", ") || "—"} |`);
  }
  const chargedCount = rows.filter((r) => r.charged).length;
  console.log(
    `\nAlways-loaded description budget: ≈${totalDescTok} tokens across ${rows.length} skills (portable) — ` +
      `≈${chargedDescTok} tokens across ${chargedCount} skills (Claude Code charged, auto-invocable only).`,
  );
}

function printHookTable(hookFiles) {
  console.log("\n## Hooks\n");
  if (hookFiles.length === 0) {
    console.log("No hooks.json / installer-hooks.json / settings.json found under the given root.");
    return;
  }
  const allRows = hookFiles.flatMap(({ path, source }) => hooksFromFile(path, source));
  const hookKey = (r) => `${r.event}|${r.matcher}|${r.handler}`;

  const loadedRows = [];
  const loadedKeys = new Set();
  for (const row of allRows.filter((r) => r.source === "loaded")) {
    const key = hookKey(row);
    if (loadedKeys.has(key)) continue;
    loadedKeys.add(key);
    loadedRows.push(row);
  }
  console.log("**Loaded** — read directly by Claude Code (`.claude/settings*.json`):\n");
  console.log("| event | matcher | handler | type | if | timeout | wiring file |");
  console.log("|---|---|---|---|---|---:|---|");
  for (const row of loadedRows) {
    console.log(
      `| ${row.event} | ${row.matcher} | ${row.handler} | ${row.type} | ${row.if || "—"} | ${row.timeout || "—"} | ${row.file} |`,
    );
  }

  const referenceRows = allRows.filter((r) => r.source === "reference");
  const referenceKeys = new Set(referenceRows.map(hookKey));
  const orphanKeys = [...referenceKeys].filter((k) => !loadedKeys.has(k));
  const parityNote =
    orphanKeys.length === 0
      ? `${referenceKeys.size} unique, all matching a loaded row above.`
      : `${referenceKeys.size} unique.`;
  console.log(
    `\n${loadedRows.length} hook(s) loaded. ${referenceRows.length} additional row(s) found in ` +
      "reference files (installer/plugin manifests such as `hooks/hooks.json` or " +
      "`.claude/hooks/*/hooks.json`, which Claude Code does not read directly) — " +
      parityNote,
  );
  if (orphanKeys.length > 0) {
    console.log(
      `\n**Drift** — ${orphanKeys.length} reference-only hook(s) declared but not found in any ` +
        `loaded settings file (event|matcher|handler): ${orphanKeys.join(", ")}.`,
    );
  }
}

/** Fixture entries from one eval file, across the three shapes the fleet uses:
 * the kit's `.github/skill-evals/<skill>.json` ({ skill, scenarios }), a root
 * aggregate `evals/evals.json` ({ skills: [{ skill, scenarios }] }), and a
 * per-skill `<skill>/evals/evals.json` ({ skill_name, evals }). */
function fixtureEntries(json, fallbackName) {
  if (Array.isArray(json?.skills)) return json.skills.flatMap((s) => fixtureEntries(s, null));
  const name = json?.skill ?? json?.skill_name ?? fallbackName;
  const list = json?.scenarios ?? json?.evals;
  if (typeof name !== "string" || !Array.isArray(list)) {
    throw new Error("no skill name or scenarios/evals array");
  }
  return [{ name, count: list.length }];
}

/** Which skills have local eval scenarios. Kit-managed skills (named in the
 * installer's stamp, or nested under an `ai-dev-kit` skills-dir plugin) carry
 * their evals upstream in the kit repo, so without a local fixture they
 * collapse into one line rather than reading as gaps. Presence only — the
 * graded pass, not this table, is what harness-audit scores. */
function printEvalPresence(skillDirs) {
  console.log("\n## Eval presence\n");
  const sources = [];
  const kitFormatDir = join(root, ".github/skill-evals");
  if (existsSync(kitFormatDir)) {
    for (const f of readdirSync(kitFormatDir).filter((n) => n.endsWith(".json")).sort()) {
      sources.push({ path: join(kitFormatDir, f), fallback: f.slice(0, -".json".length) });
    }
  }
  sources.push({ path: join(root, "evals/evals.json"), fallback: null });
  for (const { label, dirPath } of skillDirs) {
    sources.push({ path: join(dirPath, "evals/evals.json"), fallback: label });
  }

  const labels = skillDirs.map((s) => s.label);
  const skillFor = (name) => labels.find((l) => l === name) ?? labels.find((l) => l.split("/").pop() === name);
  const covered = new Map();
  const unreadable = [];
  const orphans = [];
  for (const { path, fallback } of sources) {
    if (!existsSync(path)) continue;
    const rel = posix(relative(root, path));
    let entries;
    try {
      entries = fixtureEntries(JSON.parse(readFileSync(path, "utf8")), fallback);
    } catch (e) {
      unreadable.push(`${rel} (${String(e.message).split("\n")[0]})`);
      continue;
    }
    for (const { name, count } of entries) {
      const label = skillFor(name);
      if (!label) {
        orphans.push(`${name} (${rel})`);
        continue;
      }
      const entry = covered.get(label) ?? { paths: [], count: 0 };
      entry.paths.push(rel);
      entry.count += count;
      covered.set(label, entry);
    }
  }

  const stamped = new Set(Object.keys(readJson(join(root, ".claude/ai-dev-kit.installed.json"))?.skills ?? {}));
  const kitManaged = (label) => stamped.has(label) || label.startsWith("ai-dev-kit/");
  const rows = labels.filter((l) => covered.has(l) || !kitManaged(l));
  if (rows.length > 0) {
    console.log("| skill | fixture | scenarios |");
    console.log("|---|---|---:|");
    for (const label of rows) {
      const c = covered.get(label);
      console.log(`| ${label} | ${c ? c.paths.join(", ") : "—"} | ${c ? c.count : "—"} |`);
    }
    console.log("");
  }
  const upstream = labels.filter((l) => kitManaged(l) && !covered.has(l));
  if (upstream.length > 0) {
    console.log(
      `${upstream.length} kit-managed skill(s) without a local fixture — their evals live upstream in ` +
        `ai-dev-kit's \`.github/skill-evals/\`: ${upstream.join(", ")}.`,
    );
  }
  if (orphans.length > 0) console.log(`Fixture(s) naming no installed skill: ${orphans.join(", ")}.`);
  if (unreadable.length > 0) console.log(`Unreadable fixture(s): ${unreadable.join(", ")}.`);
  const local = labels.filter((l) => !kitManaged(l));
  const managedLocal = labels.filter((l) => kitManaged(l) && covered.has(l)).length;
  console.log(
    `Project-local skills with fixtures: ${local.filter((l) => covered.has(l)).length}/${local.length}. ` +
      (managedLocal > 0 ? `Kit-managed skills with local fixtures: ${managedLocal}. ` : "") +
      "Presence only — harness-audit §4 scores effectiveness from the graded pass, not from fixture existence.",
  );
}

/** Adapter `contextBudget` overrides (`.claude/ai-dev-kit.config.json`) over
 * hunts.md's documented defaults. */
function loadContextBudget() {
  const budget = { agentsMdMaxLines: 150, memoryIndexMaxTokens: 700, memoryFileMaxTokens: 1500 };
  const configured = readJson(join(root, ".claude/ai-dev-kit.config.json"))?.contextBudget ?? {};
  for (const key of Object.keys(budget)) {
    if (typeof configured[key] === "number") budget[key] = configured[key];
  }
  return budget;
}

/** The standing-instruction file (`CLAUDE.md` takes precedence over
 * `AGENTS.md` when both exist, matching context-guard's own precedent) plus
 * its line count and the adapter's line budget, defaulting to hunts.md's
 * documented 150-line convention when no adapter config is present. */
function printInstructionFileReport(budget) {
  console.log("\n## Standing-instruction file\n");
  let found = null;
  for (const name of ["CLAUDE.md", "AGENTS.md"]) {
    const p = join(root, name);
    if (existsSync(p)) {
      found = { name, path: p };
      break;
    }
  }
  if (!found) {
    console.log("No CLAUDE.md / AGENTS.md found at the project root.");
    return;
  }
  const text = readFileSync(found.path, "utf8");
  const lines = text.replace(/\r?\n$/, "").split(/\r?\n/).length;
  console.log(`${found.name}: ${lines} lines (budget ${budget.agentsMdMaxLines}) — ≈${tokens(text)} tokens.`);
}

// Claude Code's documented MEMORY.md load cap: the first 200 lines or 25 KB,
// whichever comes first, load at session start; the rest is dropped.
const LOAD_CAP_LINES = 200;
const LOAD_CAP_BYTES = 25_000;
const caseFolding = process.platform === "win32" || process.platform === "darwin";
const samePath = (a, b) => (caseFolding ? a.toLowerCase() === b.toLowerCase() : a === b);
/** Claude Code's project-dir name: every non-alphanumeric character → `-`
 * (inferred from on-disk dirs, e.g. `C:\a\b-c` → `C--a-b-c`; undocumented). */
const slugOf = (p) => p.replace(/[^a-zA-Z0-9]/g, "-");

/** The checkout auto memory is keyed to — the docs say every subdirectory and
 * worktree of one repo shares a directory. Walks up to the first `.git`: a
 * directory names the repo root; a `gitdir:` file with a `commondir` is a
 * linked worktree whose main checkout owns the memory; a `gitdir:` file
 * without one (a submodule) is its own root. Null outside any repo. */
function gitRoot(start) {
  for (let d = resolve(start); ; d = dirname(d)) {
    const dotGit = join(d, ".git");
    if (existsSync(dotGit)) {
      if (statSync(dotGit).isDirectory()) return d;
      const gitdir = readFileSync(dotGit, "utf8").match(/^gitdir:\s*(.+?)\s*$/m)?.[1];
      if (!gitdir) return d;
      const gitdirPath = resolve(d, gitdir);
      const commondir = join(gitdirPath, "commondir");
      if (!existsSync(commondir)) return d;
      return dirname(resolve(gitdirPath, readFileSync(commondir, "utf8").trim()));
    }
    if (dirname(d) === d) return null;
  }
}

/** The `cwd` recorded in a project dir's first transcript, read from at most
 * its first 64 KB. */
function transcriptCwd(dir) {
  const jsonl = readdirSync(dir).find((f) => f.endsWith(".jsonl"));
  if (!jsonl) return null;
  let fd;
  try {
    fd = openSync(join(dir, jsonl), "r");
    const buf = Buffer.alloc(64 * 1024);
    const n = readSync(fd, buf, 0, buf.length, 0);
    const m = buf.toString("utf8", 0, n).match(/"cwd":\s*"((?:[^"\\]|\\.)*)"/);
    return m ? JSON.parse(`"${m[1]}"`) : null;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/** Fallback when the slug rule misses (e.g. a long path the harness
 * shortens): the project dir whose transcript ran in this checkout, or
 * failing that, in a directory under it. Only dirs holding `memory/` count. */
function memoryFromTranscripts(projectsDir, checkout) {
  if (!existsSync(projectsDir)) return null;
  const target = resolve(checkout);
  let under = null;
  for (const entry of readdirSync(projectsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(projectsDir, entry.name);
    if (!existsSync(join(dir, "memory"))) continue;
    const cwd = transcriptCwd(dir);
    if (!cwd) continue;
    const c = resolve(cwd);
    if (samePath(c, target)) return join(dir, "memory");
    if (!under && samePath(c.slice(0, target.length + 1), target + sep)) under = join(dir, "memory");
  }
  return under;
}

/** Locates the project's auto-memory directory the way Claude Code documents
 * it: `autoMemoryDirectory` (local › project › user settings) or
 * `CLAUDE_CODE_PROJECT_DIR_NAME` when set — both authoritative — else
 * `<config dir>/projects/<slug of the git root>/memory`, else a transcript
 * whose cwd is this checkout. Also reports whether auto memory is off. */
function resolveMemoryDir() {
  const cfgDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
  const settings = [
    { label: ".claude/settings.local.json", path: join(root, ".claude/settings.local.json"), project: true },
    { label: ".claude/settings.json", path: join(root, ".claude/settings.json"), project: true },
    { label: "user settings.json", path: join(cfgDir, "settings.json"), project: false },
  ]
    .map((s) => ({ ...s, json: readJson(s.path) }))
    .filter((s) => s.json);

  let disabled = null;
  if (/^(1|true)$/i.test(process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY ?? "")) {
    disabled = "CLAUDE_CODE_DISABLE_AUTO_MEMORY";
  } else {
    const s = settings.find((x) => typeof x.json.autoMemoryEnabled === "boolean");
    if (s && s.json.autoMemoryEnabled === false) disabled = `autoMemoryEnabled: false in ${s.label}`;
  }

  const custom = settings.find((s) => typeof s.json.autoMemoryDirectory === "string" && s.json.autoMemoryDirectory);
  if (custom) {
    const v = custom.json.autoMemoryDirectory;
    const dir = v.startsWith("~/") ? join(homedir(), v.slice(2)) : v;
    if (isAbsolute(dir)) {
      const trust = custom.project ? " — honored only once the folder is trusted" : "";
      const via = `autoMemoryDirectory in ${custom.label}${trust}`;
      return existsSync(dir) ? { dir, via, disabled } : { dir: null, tried: [`${dir} (${via})`], disabled };
    }
  }

  const projectsDir = join(cfgDir, "projects");
  const named = process.env.CLAUDE_CODE_PROJECT_DIR_NAME;
  if (named) {
    const dir = join(projectsDir, named, "memory");
    const via = "CLAUDE_CODE_PROJECT_DIR_NAME";
    return existsSync(dir) ? { dir, via, disabled } : { dir: null, tried: [`${dir} (${via})`], disabled };
  }

  const repo = gitRoot(root);
  const checkout = repo ?? resolve(root);
  const via = repo ? "git-root slug" : "project-root slug";
  const tried = [];
  const spellings = [checkout];
  try {
    const real = realpathSync.native(checkout);
    if (real !== checkout) spellings.push(real);
  } catch {
    /* unresolvable — keep the one spelling */
  }
  for (const p of spellings) {
    const dir = join(projectsDir, slugOf(p), "memory");
    if (existsSync(dir)) return { dir, via, disabled };
    tried.push(dir);
  }
  const fromTranscript = memoryFromTranscripts(projectsDir, checkout);
  if (fromTranscript) return { dir: fromTranscript, via: "transcript cwd", disabled };
  tried.push(`${projectsDir}/*/*.jsonl (transcript cwd)`);
  return { dir: null, tried, disabled };
}

/** The auto-memory index against the harness's hard load cap and the
 * adapter's token budget, plus every topic file against its per-file budget. */
function printMemoryReport(budget) {
  console.log("\n## Memory\n");
  const { dir, via, tried, disabled } = resolveMemoryDir();
  if (disabled) console.log(`Auto memory: disabled (${disabled}) — reporting what is on disk.`);
  if (!dir) {
    console.log(`No auto-memory directory found — tried: ${tried.map(posix).join(", ")}.`);
    return;
  }
  console.log(`Directory: ${posix(dir)} (resolved via ${via}).`);

  const index = join(dir, "MEMORY.md");
  if (existsSync(index)) {
    const text = readFileSync(index, "utf8");
    const lines = text.replace(/\r?\n$/, "").split(/\r?\n/).length;
    const bytes = Buffer.byteLength(text);
    const tok = tokens(text);
    const over = tok > budget.memoryIndexMaxTokens ? " — **over budget**" : "";
    console.log(`MEMORY.md: ${lines} lines · ${bytes} B · ≈${tok} tokens (budget ${budget.memoryIndexMaxTokens})${over}.`);
    if (lines > LOAD_CAP_LINES || bytes > LOAD_CAP_BYTES) {
      console.log(
        `**Load cap** — Claude Code loads only the first ${LOAD_CAP_LINES} lines or 25 KB of MEMORY.md ` +
          "at session start; everything past it is dropped.",
      );
    }
  } else {
    console.log("MEMORY.md: absent.");
  }

  const topics = walk(dir)
    .filter((f) => f.endsWith(".md") && f !== index)
    .map((f) => ({ name: posix(relative(dir, f)), tok: tokens(readFileSync(f, "utf8")) }));
  if (topics.length === 0) {
    console.log("Topic files: 0.");
    return;
  }
  const largest = topics.reduce((a, b) => (b.tok > a.tok ? b : a));
  const overBudget = topics.filter((t) => t.tok > budget.memoryFileMaxTokens);
  console.log(
    `Topic files: ${topics.length} · largest ≈${largest.tok} tokens (${largest.name}) · ` +
      `over ${budget.memoryFileMaxTokens}: ${overBudget.length || "none"}.`,
  );
  if (overBudget.length > 0) {
    console.log("\n| topic file | ≈tok |");
    console.log("|---|---:|");
    for (const t of overBudget) console.log(`| ${t.name} | ${t.tok} |`);
  }
}

const skillsDir = findSkillsDir();
if (!skillsDir) {
  console.error(`inventory: no .claude/skills or skills directory found under ${root}`);
  process.exit(1);
}
const budget = loadContextBudget();
printSkillTable(skillRows(skillsDir));
printEvalPresence(collectSkillDirs(skillsDir));
printHookTable(findHookFiles());
printInstructionFileReport(budget);
try {
  printMemoryReport(budget);
} catch (e) {
  // Report-only: an unreadable memory dir must not take down the rest.
  console.log(`Memory: not measured — ${e.message}`);
}
