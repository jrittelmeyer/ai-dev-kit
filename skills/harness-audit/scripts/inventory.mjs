#!/usr/bin/env node
/**
 * harness-audit §1 inventory emitter — zero-dep, no network. Measures the
 * local surface (per-skill description/body sizes + references, wired hook
 * events) so a harness-audit run starts from numbers instead of hand-counts.
 * Report-only: never fails, never writes files.
 *
 * Usage: node .claude/skills/harness-audit/scripts/inventory.mjs [projectRoot]
 *        (run from the consumer's project root; projectRoot defaults to cwd)
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.argv[2] ?? process.cwd();
const tokens = (s) => Math.ceil(s.length / 4);
const posix = (p) => p.replaceAll("\\", "/");

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

function skillRows(skillsDir) {
  const rows = [];
  const dirs = readdirSync(join(root, skillsDir), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  for (const name of dirs) {
    const skillPath = join(root, skillsDir, name, "SKILL.md");
    if (!existsSync(skillPath)) continue;
    const { fields, body } = parseFrontmatter(readFileSync(skillPath, "utf8"));
    const desc = fields.description ?? "";
    const files = walk(join(root, skillsDir, name)).filter((f) => !f.endsWith("SKILL.md"));
    const refs = files.map((f) => posix(relative(join(root, skillsDir, name), f)));
    rows.push({
      name,
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

/** The standing-instruction file (`CLAUDE.md` takes precedence over
 * `AGENTS.md` when both exist, matching context-guard's own precedent) plus
 * its line count and the adapter's line budget, defaulting to hunts.md's
 * documented 150-line convention when no adapter config is present. */
function printInstructionFileReport() {
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
  let maxLines = 150;
  try {
    const cfg = JSON.parse(readFileSync(join(root, ".claude/ai-dev-kit.config.json"), "utf8"));
    if (typeof cfg?.contextBudget?.agentsMdMaxLines === "number") {
      maxLines = cfg.contextBudget.agentsMdMaxLines;
    }
  } catch {
    /* no adapter config — keep the default */
  }
  const text = readFileSync(found.path, "utf8");
  const lines = text.replace(/\r?\n$/, "").split(/\r?\n/).length;
  console.log(`${found.name}: ${lines} lines (budget ${maxLines}) — ≈${tokens(text)} tokens.`);
}

const skillsDir = findSkillsDir();
if (!skillsDir) {
  console.error(`inventory: no .claude/skills or skills directory found under ${root}`);
  process.exit(1);
}
printSkillTable(skillRows(skillsDir));
printHookTable(findHookFiles());
printInstructionFileReport();
