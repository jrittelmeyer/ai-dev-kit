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
const firstLine = (m) => String(m).split("\n")[0];
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** JSON.parse that tolerates the UTF-8 BOM Windows editors prepend. */
const parseJson = (text) => JSON.parse(text.replace(/^\uFEFF/, ""));
const readJsonStrict = (p) => parseJson(readFileSync(p, "utf8"));
const readJson = (p) => {
  try {
    return readJsonStrict(p);
  } catch {
    return null;
  }
};
/** Directory test that follows links — a `Dirent` reports a symlink or a
 * Windows junction as neither file nor directory. False for a dangling link. */
const isDir = (p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
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

/** Every file under `dir`, following directory links. A realpath seen-set
 * stops a link back to an ancestor from looping; dangling links are skipped. */
function walk(dir, seen = new Set()) {
  const real = realpathSync(dir);
  if (seen.has(real)) return [];
  seen.add(real);
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    let stat;
    try {
      stat = statSync(p);
    } catch {
      return [];
    }
    return stat.isDirectory() ? walk(p, seen) : [p];
  });
}

function findSkillsDir() {
  for (const candidate of [".claude/skills", "skills"]) {
    if (isDir(join(root, candidate))) return candidate;
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
  const entries = readdirSync(join(root, skillsDir))
    .filter((n) => isDir(join(root, skillsDir, n)))
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
      const nested = readdirSync(pluginSkillsDir)
        .filter((n) => isDir(join(pluginSkillsDir, n)))
        .sort();
      for (const n of nested) {
        const p = join(pluginSkillsDir, n);
        if (existsSync(join(p, "SKILL.md"))) out.push({ label: `${name}/${n}`, dirPath: p });
      }
    }
  }
  return out;
}

function skillRows(skillDirs) {
  const rows = [];
  for (const { label, dirPath } of skillDirs) {
    const skillPath = join(dirPath, "SKILL.md");
    const { fields, body } = parseFrontmatter(readFileSync(skillPath, "utf8").replace(/^﻿/, ""));
    const desc = fields.description ?? "";
    const files = walk(dirPath).filter((f) => !f.endsWith("SKILL.md"));
    const refs = files.map((f) => posix(relative(dirPath, f))).sort();
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

/** Short, quoted, table-safe excerpt of a prompt or URL. */
const clip = (s, n = 40) => {
  const t = String(s).replace(/\s+/g, " ").trim();
  return (t.length > n ? `${t.slice(0, n).trimEnd()}…` : t).replaceAll("|", "\\|");
};
const baseName = (t) => t.split(/[\\/]/).filter(Boolean).pop() ?? t;

/** A readable handler name: a command hook's first path-like token (its
 * basename carries an extension — `guard.mjs`, `lint.sh`, `check.py` — and an
 * `.exe` interpreter yields to the script after it), else its first token
 * (`npx`, `eslint`); prompt/agent hooks by their prompt, http hooks by URL. */
function handlerName(h) {
  const type = h.type ?? "command";
  if (type === "prompt" || type === "agent") return `${type}: "${clip(h.prompt ?? "")}"`;
  if (type === "http") return `http: ${clip(h.url ?? "")}`;
  const tokens = [...String(h.command ?? "").split(/\s+/), ...(Array.isArray(h.args) ? h.args.map(String) : [])]
    .map((t) => t.replace(/^["']+|["';]+$/g, ""))
    .filter(Boolean);
  const pathy = tokens.filter((t) => /[^./\\]\.[A-Za-z0-9]{1,8}$/.test(baseName(t)));
  const name = pathy.find((t) => !/\.exe$/i.test(t)) ?? pathy[0] ?? tokens[0];
  return name ? baseName(name) : "?";
}

/** Rows from one hooks event map ({ EventName: [{ matcher, hooks: [...] }] }),
 * shape-checked so a malformed map throws and the caller reports the whole
 * source unreadable rather than half-reading it. */
function hookRows(wired, file, source) {
  if (!isObject(wired)) throw new Error("`hooks` is not an object");
  const rows = [];
  for (const [event, entries] of Object.entries(wired)) {
    if (!Array.isArray(entries)) throw new Error(`hooks.${event} is not an array`);
    for (const entry of entries) {
      if (!isObject(entry) || !Array.isArray(entry.hooks ?? [])) throw new Error(`hooks.${event} has a malformed matcher group`);
      for (const h of entry.hooks ?? []) {
        if (!isObject(h)) throw new Error(`hooks.${event} has a non-object handler`);
        const matcher = entry.matcher ?? "*";
        const type = h.type ?? "command";
        rows.push({
          event,
          matcher,
          handler: handlerName(h),
          type,
          if: h.if ?? "",
          timeout: h.timeout ?? "",
          file,
          source,
          // The full definition: two entries differing only in `if` (or in a
          // command's arguments) are two hooks, not one.
          defKey: JSON.stringify([event, matcher, type, h.command ?? "", h.args ?? [], h.prompt ?? "", h.url ?? "", h.if ?? ""]),
        });
      }
    }
  }
  return rows;
}

/** The event map of a hooks.json- or settings.json-shaped file (both wrap it
 * in a top-level `hooks` key). Throws on unreadable JSON or a non-object root. */
function fileHooks(path) {
  const parsed = readJsonStrict(path);
  if (!isObject(parsed)) throw new Error("not a JSON object");
  return parsed.hooks ?? {};
}

/** Every hook source as { file, source, load }, `load()` returning an event map
 * or throwing. 'source' is "loaded" for what Claude Code reads directly
 * (.claude/settings*.json, a skills-dir plugin's hooks) or "reference" for an
 * installer/plugin-manifest copy (hooks/hooks.json, a root plugin manifest, an
 * installed hook dir's own hooks.json) that describes the same hooks but is
 * not itself read by Claude Code. */
function findHookSources() {
  const sources = [];
  const seen = new Set();
  const rel = (p) => posix(relative(root, p));
  const addFile = (path, source) => {
    if (seen.has(resolve(path))) return;
    seen.add(resolve(path));
    sources.push({ file: rel(path), source, load: () => fileHooks(path) });
  };
  const fail = (file, source, message) =>
    sources.push({
      file,
      source,
      load: () => {
        throw new Error(message);
      },
    });
  /** A plugin manifest's `hooks` — per the plugins reference a `.json` path,
   * an inline event map, or an array of either, merged with the plugin's
   * hooks/hooks.json (never replacing it). A path must resolve inside the
   * plugin dir; one that escapes or is missing is reported, not read. */
  const addManifestHooks = (pluginDir, source) => {
    const manifest = join(pluginDir, ".claude-plugin", "plugin.json");
    if (!existsSync(manifest)) return;
    let declared;
    try {
      const parsed = readJsonStrict(manifest);
      if (!isObject(parsed)) throw new Error("not a JSON object");
      declared = parsed.hooks;
    } catch (e) {
      fail(rel(manifest), source, firstLine(e.message));
      return;
    }
    if (declared === undefined) return;
    for (const item of Array.isArray(declared) ? declared : [declared]) {
      if (typeof item !== "string") {
        sources.push({ file: rel(manifest), source, load: () => item });
        continue;
      }
      const target = resolve(pluginDir, item);
      const back = relative(resolve(pluginDir), target);
      if (back === ".." || back.startsWith(`..${sep}`) || isAbsolute(back)) {
        fail(rel(manifest), source, `hooks path escapes plugin directory: ${item}`);
      } else if (!existsSync(target)) {
        fail(rel(manifest), source, `hooks path not found: ${item}`);
      } else {
        addFile(target, source);
      }
    }
  };

  for (const candidate of ["hooks/hooks.json", "hooks/installer-hooks.json"]) {
    const p = join(root, candidate);
    if (existsSync(p)) addFile(p, "reference");
  }
  addManifestHooks(root, "reference");
  for (const candidate of [".claude/settings.json", ".claude/settings.local.json"]) {
    const p = join(root, candidate);
    if (existsSync(p)) addFile(p, "loaded");
  }
  const installedDir = join(root, ".claude/hooks");
  if (isDir(installedDir)) {
    for (const name of readdirSync(installedDir)) {
      const p = join(installedDir, name, "hooks.json");
      if (isDir(join(installedDir, name)) && existsSync(p)) addFile(p, "reference");
    }
  }
  // Skills-dir plugins (`.claude/skills/<name>/.claude-plugin/plugin.json`)
  // auto-load their own `hooks/hooks.json` plus any manifest `hooks` directly —
  // no settings.json merge, no separate reference copy to drift against
  // (A95/D072).
  const skillsDirPath = join(root, ".claude/skills");
  if (isDir(skillsDirPath)) {
    for (const name of readdirSync(skillsDirPath).sort()) {
      const pluginDir = join(skillsDirPath, name);
      if (!isDir(pluginDir) || !existsSync(join(pluginDir, ".claude-plugin", "plugin.json"))) continue;
      const pluginHooks = join(pluginDir, "hooks", "hooks.json");
      if (existsSync(pluginHooks)) addFile(pluginHooks, "loaded");
      addManifestHooks(pluginDir, "loaded");
    }
  }
  return sources;
}

function printSkillTable(skillsDir) {
  console.log("## Skills\n");
  if (!skillsDir) {
    console.log(`Skills: none (looked for .claude/skills, skills under ${posix(resolve(root))}).`);
    return;
  }
  const rows = skillRows(collectSkillDirs(skillsDir));
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

function printHookTable(sources) {
  console.log("\n## Hooks\n");
  if (sources.length === 0) {
    console.log("No hooks.json / installer-hooks.json / settings.json / plugin.json hooks found under the given root.");
    return;
  }
  const allRows = [];
  let unreadable = 0;
  for (const { file, source, load } of sources) {
    try {
      allRows.push(...hookRows(load(), file, source));
    } catch (e) {
      // Report-only: one bad wiring file costs its own rows, not the report.
      console.log(`unreadable: ${file} (${firstLine(e.message)})`);
      unreadable++;
    }
  }
  if (unreadable > 0) console.log("");
  // Parity is path-insensitive: a loaded copy spells the handler's path under
  // the project dir, a reference copy under the plugin root.
  const hookKey = (r) => `${r.event}|${r.matcher}|${r.handler}${r.if ? `|${r.if}` : ""}`;

  const loadedRows = [];
  const loadedDefs = new Set();
  for (const row of allRows.filter((r) => r.source === "loaded")) {
    if (loadedDefs.has(row.defKey)) continue;
    loadedDefs.add(row.defKey);
    loadedRows.push(row);
  }
  const loadedKeys = new Set(loadedRows.map(hookKey));
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
        `loaded settings file (event|matcher|handler[|if]): ${orphanKeys.join(", ")}.`,
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
      // `.github/skill-evals/` can also hold results or config JSON: only a
      // fixture-shaped file (or one named for an installed skill) is read.
      sources.push({ path: join(kitFormatDir, f), fallback: f.slice(0, -".json".length), shapeGated: true });
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
  const ignored = [];
  const orphans = [];
  const fixtureShaped = (json, fallback) =>
    Boolean(skillFor(fallback)) || (isObject(json) && ["skill", "skill_name", "scenarios", "evals"].some((k) => k in json));
  for (const { path, fallback, shapeGated } of sources) {
    if (!existsSync(path)) continue;
    const rel = posix(relative(root, path));
    let entries;
    try {
      const json = readJsonStrict(path);
      if (shapeGated && !fixtureShaped(json, fallback)) {
        ignored.push(rel);
        continue;
      }
      entries = fixtureEntries(json, fallback);
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
  if (ignored.length > 0) console.log(`Ignored (not a fixture shape): ${ignored.join(", ")}.`);
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

/** Report-only: a section that throws says so and the rest still runs. */
const section = (name, print) => {
  try {
    print();
  } catch (e) {
    console.log(`${name}: not measured — ${firstLine(e.message)}`);
  }
};
const skillsDir = findSkillsDir();
const budget = loadContextBudget();
section("Skills", () => printSkillTable(skillsDir));
section("Eval presence", () => printEvalPresence(skillsDir ? collectSkillDirs(skillsDir) : []));
section("Hooks", () => printHookTable(findHookSources()));
section("Standing-instruction file", () => printInstructionFileReport(budget));
section("Memory", () => printMemoryReport(budget));
