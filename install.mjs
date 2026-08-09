#!/usr/bin/env node
/**
 * ai-dev-kit installer — copies kit skills into a project's `.claude/skills/`
 * (and dual-home skills into `~/.claude/skills/` with --global).
 *
 * Usage:
 *   node install.mjs [--dest <project-root>] [--adapter <file>] [--global] [--hooks]
 *   node install.mjs --check [--dest <project-root>] [--global]
 *
 * Pure Node fs — no shell, no symlinks (Windows-safe). Idempotent: a re-run with an
 * unchanged kit writes nothing. `--adapter` is schema-validated against
 * adapters/project.schema.json before anything is written, then copied verbatim.
 * `--check` exits 1 listing any installed file that drifted from kit source (the
 * adapter config and settings.json are user-owned and never checked) and any
 * stale file left in a kit-owned dir by a renamed/removed kit file — a plain
 * install prunes those leftovers. Skills in `.claude/skills/` that the manifest
 * doesn't list are left untouched. `--hooks`
 * merges hooks/hooks.json into `.claude/settings.json` — only entries whose command
 * carries the kit's handler-path marker are ever replaced.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const kitRoot = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(kitRoot, "manifest.json"), "utf8"));

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
};

const checkMode = flag("--check");
const withGlobal = flag("--global");
const withHooks = flag("--hooks");
const dest = resolve(opt("--dest") ?? process.cwd());
const adapterArg = opt("--adapter");

/** Recursively list all files under a directory. */
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });

/** Remove directories left empty after a prune (bottom-up). */
const pruneEmptyDirs = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) pruneEmptyDirs(join(dir, entry.name));
  }
  if (readdirSync(dir).length === 0) rmdirSync(dir);
};

const posix = (p) => p.replaceAll("\\", "/");
const label = (p) => posix(p.startsWith(dest) ? relative(dest, p) : p);

/**
 * Validate a parsed adapter against the subset of JSON Schema the kit's schema
 * actually uses: type · enum · properties + additionalProperties:false · array
 * items. Returns human-readable violations ("path: reason").
 */
function validateAdapter(value, schema, path = "adapter") {
  const typeOf = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
  const t = schema.type;
  if (t === "integer" ? !Number.isInteger(value) : t && typeOf(value) !== t) {
    return [`${path}: expected ${t}, got ${typeOf(value)}`];
  }
  const errors = [];
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: "${value}" is not one of ${schema.enum.join(" | ")}`);
  }
  if (t === "object" && schema.properties) {
    for (const [key, v] of Object.entries(value)) {
      if (schema.properties[key]) {
        errors.push(...validateAdapter(v, schema.properties[key], `${path}.${key}`));
      } else if (schema.additionalProperties === false) {
        errors.push(
          `${path}.${key}: unknown key (allowed: ${Object.keys(schema.properties).join(", ")})`,
        );
      }
    }
  }
  if (t === "array" && schema.items) {
    value.forEach((v, i) => errors.push(...validateAdapter(v, schema.items, `${path}[${i}]`)));
  }
  return errors;
}

// Adapter is read and schema-validated up front — a bad adapter must fail the
// install before any file is written (previously invalid JSON died mid-install).
let adapterText = null;
if (adapterArg && !checkMode) {
  adapterText = readFileSync(resolve(adapterArg), "utf8");
  const schema = JSON.parse(readFileSync(join(kitRoot, "adapters", "project.schema.json"), "utf8"));
  const violations = validateAdapter(JSON.parse(adapterText), schema);
  if (violations.length > 0) {
    console.error(`adapter ${adapterArg}: ${violations.length} schema violation(s):`);
    for (const v of violations) {
      console.error(`  ${v}`);
    }
    console.error("Schema: adapters/project.schema.json. Nothing was installed.");
    process.exit(1);
  }
}

const drifted = [];
const expected = new Set();
let written = 0;
let unchanged = 0;

/** Copy (or, in check mode, diff) one file from kit source to an installed path. */
function syncFile(srcPath, outPath) {
  expected.add(outPath);
  const want = readFileSync(srcPath);
  const have = existsSync(outPath) ? readFileSync(outPath) : null;
  if (have?.equals(want)) {
    unchanged++;
    return;
  }
  if (checkMode) {
    drifted.push(label(outPath));
    return;
  }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, want);
  written++;
}

function syncSkill(name, skillsDir) {
  const src = join(kitRoot, "skills", name);
  for (const file of walk(src)) {
    syncFile(file, join(skillsDir, name, relative(src, file)));
  }
}

// 1. Project skills — every skill in the manifest.
const projectSkills = join(dest, ".claude", "skills");
for (const skill of manifest.skills) {
  syncSkill(skill.name, projectSkills);
}

// 2. Dual-home skills — also installed to the user's global skills dir.
const globalSkills = join(homedir(), ".claude", "skills");
if (withGlobal) {
  for (const skill of manifest.skills.filter((s) => s.dualHome)) {
    syncSkill(skill.name, globalSkills);
  }
}

// 3. Hook handlers — installed alongside skills (and drift-guarded the same way);
//    inert until the hook config is merged into settings via --hooks.
const hooksSrc = join(kitRoot, "hooks");
const hooksDest = join(dest, ".claude", "hooks", "ai-dev-kit");
for (const file of walk(hooksSrc)) {
  if (file.endsWith(".mjs")) {
    syncFile(file, join(hooksDest, relative(hooksSrc, file)));
  }
}

// 4. Stale leftovers — files in kit-owned dirs that no longer exist in kit source
//    (renamed/removed upstream). --check flags them as STALE; a plain install
//    prunes them. Skills the manifest doesn't list are never candidates.
const kitOwnedDirs = [
  ...manifest.skills.map((s) => join(projectSkills, s.name)),
  hooksDest,
  ...(withGlobal
    ? manifest.skills.filter((s) => s.dualHome).map((s) => join(globalSkills, s.name))
    : []),
];
const stale = kitOwnedDirs
  .filter((dir) => existsSync(dir))
  .flatMap((dir) => walk(dir))
  .filter((file) => !expected.has(file));
if (stale.length > 0 && !checkMode) {
  for (const file of stale) {
    rmSync(file);
  }
  for (const dir of kitOwnedDirs) {
    if (existsSync(dir)) pruneEmptyDirs(dir);
  }
  console.log(`stale → pruned ${stale.length} file(s) no longer in kit source:`);
  for (const f of stale) {
    console.log(`  ${label(f)}`);
  }
}

// 5. Adapter config — schema-validated up front, then copied verbatim. User-owned
//    after install: edit it freely in the project; --check never polices it.
if (adapterText !== null) {
  const outPath = join(dest, ".claude", "ai-dev-kit.config.json");
  const have = existsSync(outPath) ? readFileSync(outPath, "utf8") : null;
  if (have === adapterText) {
    unchanged++;
  } else {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, adapterText);
    written++;
    console.log(`adapter → ${label(outPath)}`);
  }
}

// 6. Hook config — merged into .claude/settings.json (--hooks). Kit-owned entries
//    are identified by the handler-path marker and replaced wholesale; everything
//    else in settings.json is preserved. Run-twice ⇒ byte-identical output.
if (withHooks && !checkMode) {
  const kitHooks = JSON.parse(readFileSync(join(hooksSrc, "hooks.json"), "utf8")).hooks;
  const settingsPath = join(dest, ".claude", "settings.json");
  const before = existsSync(settingsPath) ? readFileSync(settingsPath, "utf8") : null;
  const settings = before ? JSON.parse(before) : {};
  const marker = ".claude/hooks/ai-dev-kit/";
  settings.hooks = settings.hooks ?? {};
  for (const [event, entries] of Object.entries(kitHooks)) {
    const kept = (settings.hooks[event] ?? [])
      .map((e) => ({
        ...e,
        hooks: (e.hooks ?? []).filter((h) => !String(h.command ?? "").includes(marker)),
      }))
      .filter((e) => e.hooks.length > 0);
    settings.hooks[event] = [...kept, ...entries];
  }
  const text = `${JSON.stringify(settings, null, 2)}\n`;
  if (text === before) {
    unchanged++;
  } else {
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, text);
    written++;
    console.log(`hooks → merged into ${label(settingsPath)}`);
  }
}

// 7. Version stamp — deterministic (no timestamp) so re-installs produce zero diff.
const stamp = {
  kit: manifest.version,
  skills: Object.fromEntries(manifest.skills.map((s) => [s.name, s.version])),
};
const stampText = `${JSON.stringify(stamp, null, 2)}\n`;
const stampPath = join(dest, ".claude", "ai-dev-kit.installed.json");
const haveStamp = existsSync(stampPath) ? readFileSync(stampPath, "utf8") : null;
if (haveStamp === stampText) {
  unchanged++;
} else if (checkMode) {
  drifted.push(label(stampPath));
} else {
  mkdirSync(dirname(stampPath), { recursive: true });
  writeFileSync(stampPath, stampText);
  written++;
}

// 8. Report.
if (checkMode) {
  if (drifted.length > 0) {
    console.error(`ai-dev-kit ${manifest.version}: DRIFT in ${drifted.length} file(s):`);
    for (const f of drifted) {
      console.error(`  ${f}`);
    }
    console.error("Fix: edit kit source, then re-run the installer (install.mjs).");
  }
  if (stale.length > 0) {
    console.error(
      `ai-dev-kit ${manifest.version}: STALE ${stale.length} file(s) in kit-owned dirs, gone from kit source:`,
    );
    for (const f of stale) {
      console.error(`  ${label(f)}`);
    }
    console.error("Fix: re-run the installer (install.mjs) to prune them.");
  }
  if (drifted.length > 0 || stale.length > 0) process.exit(1);
  console.log(
    `ai-dev-kit ${manifest.version}: installed copies match kit source (${unchanged} files).`,
  );
} else {
  console.log(
    `ai-dev-kit ${manifest.version}: ${written} file(s) written, ${unchanged} unchanged.`,
  );
  if (!withHooks) {
    console.log("Run with --hooks to merge the hook config into .claude/settings.json.");
  }
}
