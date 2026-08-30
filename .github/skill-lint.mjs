#!/usr/bin/env node
/**
 * CI lint: the skill surface. Frontmatter is the discovery surface the harness
 * always-loads — shape, size, and encoding defects there degrade every session,
 * so they gate CI (ERR ⇒ exit 1). Budget and style heuristics warn and never
 * fail the build, so a wording edit can't knife-edge CI.
 *
 * Checks: dir/SKILL.md structure · frontmatter shape (incl. `>-` folded
 * descriptions) · description length + third-person + "Use when…" clause ·
 * body line/token budgets (grandfather list below, emptied by the reference
 * splits) · path hygiene (backslashes, absolute drives — prose files only;
 * bundled scripts are exempt, hook-wiring variables in prose) ·
 * reference resolution + one-level nesting + TOC-for-long-refs ·
 * encoding (BOM/CRLF) · bare-date freshness (suppress with a
 * `lint-ok: dated — <reason>` comment within 3 lines) · manifest.json ⇄
 * skills/ bijection with semver versions · shared-by-copy byte-equality ·
 * hooks.json wired handlers exist.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const SKILLS_DIR = "skills";
// Body token ceiling grandfathers — emptied by the 0.15.0 reference splits;
// re-add a name only with a recorded reason.
const SIZE_GRANDFATHER = new Set([]);
// Groups of files that must stay byte-identical (shared-by-copy across
// self-contained skills).
const SHARED = [
  [
    "skills/project-init/references/inception-shared.md",
    "skills/project-adopt/references/inception-shared.md",
  ],
];

let errors = 0;
let warnings = 0;
const err = (msg) => {
  errors++;
  console.error(`ERR  ${msg}`);
};
const warn = (msg) => {
  warnings++;
  console.error(`warn ${msg}`);
};
const posix = (p) => p.replaceAll("\\", "/");
const tokens = (s) => Math.ceil(s.length / 4);

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });

/**
 * Minimal frontmatter parser: `---` fences, `key: value` scalars, `key: >-`
 * folded blocks (indented continuations joined with spaces). Returns null when
 * no fence parses.
 */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
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

/** Encoding, path-hygiene, and freshness checks for one file under skills/. */
function fileChecks(path) {
  const text = readFileSync(path, "utf8");
  const p = posix(path);
  if (text.charCodeAt(0) === 0xfeff) err(`${p}: UTF-8 BOM`);
  if (text.includes("\r\n")) warn(`${p}: CRLF line endings (repo normalizes to LF)`);
  // Whole-file opt-out for files whose dates are maintained metadata (e.g.
  // harness-audit's sources/stack rows, refreshed every run) rather than
  // prose that rots unnoticed.
  const datedFileOk = /lint-ok:\s*dated-file/i.test(text);
  const lines = text.split(/\r?\n/);
  const suppressed = new Set();
  lines.forEach((l, i) => {
    if (/lint-ok:\s*dated/i.test(l)) {
      for (let d = -3; d <= 3; d++) suppressed.add(i + d);
    }
  });
  // Path-hygiene checks (backslash paths, absolute drives) target prose that
  // mentions filesystem paths; script source legitimately contains backslash
  // escapes (regex literals, \r\n) that aren't paths at all.
  const isCode = /\.(mjs|js|cjs|ts)$/.test(p);
  lines.forEach((line, i) => {
    const at = `${p}:${i + 1}`;
    if (/\$\{CLAUDE_PROJECT_DIR\}/.test(line)) {
      err(`${at}: \${CLAUDE_PROJECT_DIR} is hook-wiring vocabulary — meaningless in skill prose`);
    }
    if (!isCode && /\b[\w.-]+\\[\w.-]+/.test(line)) {
      err(`${at}: backslash path — skills use forward slashes everywhere`);
    }
    if (!isCode && /(^|[\s`("'])[A-Za-z]:[\\/]/.test(line)) {
      err(`${at}: absolute drive path — skills must stay machine-portable`);
    }
    if (/\b20\d{2}\b/.test(line) && !suppressed.has(i) && !datedFileOk) {
      warn(`${at}: bare year/date rots — rephrase, or suppress: lint-ok: dated — <reason>`);
    }
  });
}

const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const manifestByName = new Map(manifest.skills.map((s) => [s.name, s]));
const descRows = [];

for (const dir of dirs) {
  const id = `skills/${dir}`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(dir) || dir.length > 64) {
    err(`${id}: dir name must be lowercase-hyphen, ≤64 chars`);
  }
  if (/anthropic|claude/i.test(dir)) {
    err(`${id}: dir name contains a reserved word ("anthropic"/"claude")`);
  }
  const skillPath = join(SKILLS_DIR, dir, "SKILL.md");
  if (!existsSync(skillPath)) {
    err(`${id}: missing SKILL.md`);
    continue;
  }
  const files = walk(join(SKILLS_DIR, dir));
  for (const f of files) fileChecks(f);

  const text = readFileSync(skillPath, "utf8");
  const fm = parseFrontmatter(text);
  if (!fm) {
    err(`${id}/SKILL.md: no parseable frontmatter fence`);
    continue;
  }
  const { fields, body } = fm;

  const allowedKeys = new Set([
    "name",
    "description",
    "allowed-tools",
    "disable-model-invocation",
    "effort",
  ]);
  for (const k of Object.keys(fields)) {
    if (!allowedKeys.has(k)) err(`${id}: unknown frontmatter key "${k}"`);
  }
  if (!fields.name) err(`${id}: frontmatter missing name`);
  if (!fields.description) err(`${id}: frontmatter missing description`);
  if (fields.name && fields.name !== dir) {
    err(`${id}: frontmatter name "${fields.name}" ≠ directory name`);
  }

  const desc = fields.description ?? "";
  if (desc.length > 1024) err(`${id}: description ${desc.length} chars (max 1024)`);
  if (!/\bUse\s+(when|whenever|to|for|on|if|at|before|after)\b/i.test(desc)) {
    warn(`${id}: description lacks a "Use when…" trigger clause (what + when)`);
  }
  // First-person = the SKILL speaking ("I can help…"). "my" is excluded: it
  // appears in quoted user trigger phrases ("here's my idea"), which belong.
  if (/(^|\s)I(’|')?(ll|m)?\s/.test(desc)) {
    warn(`${id}: description reads first-person — write third person`);
  }
  descRows.push([dir, desc.length, tokens(desc)]);

  const bodyLines = body.split(/\r?\n/).length;
  if (bodyLines > 500) err(`${id}: body ${bodyLines} lines (max 500)`);
  const bodyTok = tokens(body);
  if (!SIZE_GRANDFATHER.has(dir)) {
    if (bodyTok > 4500) {
      err(`${id}: body ≈${bodyTok} tokens (hard ceiling 4500 — split into references/)`);
    } else if (bodyTok > 3000) {
      warn(`${id}: body ≈${bodyTok} tokens (>3000 split-candidate, the kit's own heuristic)`);
    }
  }

  // References: every mentioned bundled file resolves, one level deep only;
  // bundled files are mentioned; long references carry a Contents heading.
  const refMentions = [
    ...new Set(
      [...body.matchAll(/(?:\]\(|`)((?:references|scripts|assets)\/[^)`\s]+)/g)].map((m) => m[1]),
    ),
  ];
  for (const rel of refMentions) {
    if (rel.split("/").length > 2) err(`${id}: reference "${rel}" nests deeper than one level`);
    if (!existsSync(join(SKILLS_DIR, dir, rel))) {
      err(`${id}: referenced file "${rel}" does not exist`);
    }
  }
  for (const f of files.filter((x) => !x.endsWith("SKILL.md"))) {
    const rel = posix(relative(join(SKILLS_DIR, dir), f));
    if (!refMentions.includes(rel)) warn(`${id}: bundled "${rel}" never referenced from SKILL.md`);
    if (f.endsWith(".md")) {
      const refText = readFileSync(f, "utf8");
      if (
        refText.split(/\r?\n/).length > 100 &&
        !/^#+\s+(contents|table of contents)\b/im.test(refText)
      ) {
        warn(`${id}: "${rel}" is >100 lines without a Contents heading`);
      }
    }
  }

  const entry = manifestByName.get(dir);
  if (!entry) {
    err(`${id}: not listed in manifest.json skills[]`);
  } else {
    if (!/^\d+\.\d+\.\d+$/.test(entry.version ?? "")) {
      err(`${id}: manifest version "${entry.version}" is not semver`);
    }
    if (fields.name && entry.name !== fields.name) err(`${id}: manifest name ≠ frontmatter name`);
  }
}

for (const s of manifest.skills) {
  if (!dirs.includes(s.name)) err(`manifest.json: skill "${s.name}" has no skills/${s.name}/ dir`);
}

for (const group of SHARED) {
  const [first, ...rest] = group;
  const want = readFileSync(first);
  for (const f of rest) {
    if (!readFileSync(f).equals(want)) err(`shared-by-copy drift: ${f} ≠ ${first}`);
  }
}

for (const wiring of ["hooks/installer-hooks.json", "hooks/hooks.json"]) {
  const wired = JSON.parse(readFileSync(wiring, "utf8")).hooks;
  for (const entries of Object.values(wired)) {
    for (const entry of entries) {
      for (const h of entry.hooks ?? []) {
        const handler = [h.command ?? "", ...(Array.isArray(h.args) ? h.args : [])]
          .join(" ")
          .match(/([\w-]+\.mjs)\b/)?.[1];
        if (handler && !existsSync(join("hooks", handler))) {
          err(`${wiring}: wired handler hooks/${handler} does not exist`);
        }
      }
    }
  }
}

console.log("always-loaded description budget (chars → ≈tokens):");
let totalTok = 0;
for (const [name, chars, tok] of descRows) {
  totalTok += tok;
  console.log(`  ${name.padEnd(16)} ${String(chars).padStart(4)} → ${tok}`);
}
console.log(`  ${"total".padEnd(16)}      → ${totalTok}`);
if (totalTok > 900) {
  warn(`always-loaded description total ≈${totalTok} tokens (>900 — trim descriptions)`);
}

if (errors > 0) {
  console.error(`skill-lint: ${errors} error(s), ${warnings} warning(s).`);
  process.exit(1);
}
console.log(`skill-lint: ${dirs.length} skills clean — 0 errors, ${warnings} warning(s).`);
