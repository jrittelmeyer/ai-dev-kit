#!/usr/bin/env node
/**
 * ai-dev-kit hook — script-exec-guard (PreToolUse: Bash|PowerShell). OPT-IN; ASKS, NEVER BLOCKS.
 *
 * Claude Code's permission layer judges the command LINE: auto mode's
 * classifier and the critical-path rm check never see the body of a script a
 * command runs, so `bash /tmp/x.sh` reads as harmless even when x.sh — written
 * by the agent moments earlier — ends in `rm -rf "$VAR"` with VAR reassigned
 * to $HOME (anthropics/claude-code#88462, the fifth report of that class).
 * Before such a command runs, this handler reads each script it executes —
 * the whole body if untracked or outside any repo, only uncommitted lines if
 * tracked, nothing if tracked-clean — plus inline code (node -e, python -c,
 * pwsh -Command), and answers permissionDecision "ask" on a recursive delete
 * of a non-literal or critical target, so the human decides. Never denies,
 * never exits 2. What runs: script-exec-parse.mjs; what counts:
 * script-exec-scan.mjs.
 *
 * Inert unless the user-owned adapter config sets enforcement.scriptExecGuard.
 * Fail-safe: if a helper can't load or anything throws, a crude
 * recursive-delete match still asks — a guard bug must not become an open door.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

let input = null;
try {
  let raw = readFileSync(0, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1); // PowerShell 5.1 BOM
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}
const cmd = String(input?.tool_input?.command ?? "").replace(/\r/g, "");
if (!cmd.trim()) process.exit(0);
try {
  const cfg = JSON.parse(
    readFileSync(resolve(process.env.CLAUDE_PROJECT_DIR ?? ".", ".claude/ai-dev-kit.config.json"), "utf8"),
  );
  if (cfg?.enforcement?.scriptExecGuard !== true) process.exit(0);
} catch {
  process.exit(0); // no adapter config — enforcement is opt-in, stay inert
}

const CRUDE = /\brm\s+-\w*r|remove-item\b.*-rec|\brd\s+\/s|rmtree|rimraf|recursive\s*:\s*true/i;
let scan = null;
let parse = null;
try {
  ({ scan } = await import("./script-exec-scan.mjs"));
  ({ parse } = await import("./script-exec-parse.mjs"));
} catch {
  /* a helper is missing — calling it throws below and the crude match takes over */
}

function git(args, dir) {
  try {
    const env = { ...process.env, GIT_OPTIONAL_LOCKS: "0" }; // never touch the index
    const opts = { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 3000, windowsHide: true, env };
    return execFileSync("git", args, opts);
  } catch {
    return null;
  }
}
// "all" = untracked or outside any repo · a Set = uncommitted added lines · null = tracked-clean.
function review(file) {
  const d = dirname(file);
  const b = basename(file);
  if (!git(["ls-files", "--", b], d)?.trim()) return "all";
  const diff = git(["diff", "-U0", "HEAD", "--", b], d);
  if (diff === null) return "all";
  const added = new Set();
  let n = 0;
  for (const l of diff.split("\n")) {
    const h = /^@@ -\S+ \+(\d+)/.exec(l);
    if (h) n = Number(h[1]);
    else if (l.startsWith("+") && !l.startsWith("+++")) added.add(n++);
  }
  return added.size ? added : null;
}
function ask(where, text, why = []) {
  const reason =
    `ai-dev-kit script-exec-guard: ${where} holds a recursive delete of a non-literal or critical target: ` +
    `\`${text.slice(0, 160)}\`${why.length ? ` · ${why.join(" · ")}` : ""}. Claude Code's permission check sees only ` +
    "the command line, not this script's body (anthropics/claude-code#88462). Approve only if that target can never " +
    "resolve to $HOME, /, a drive root, or the project.";
  const decision = { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason };
  console.log(JSON.stringify({ hookSpecificOutput: decision }));
  process.exit(0);
}

let lastBody = cmd;
try {
  for (const t of parse(cmd, input?.cwd ?? process.cwd())) {
    let body = t.code;
    let added = null;
    let kind = "any";
    if (t.file) {
      if (/[\\/]node_modules[\\/]/.test(t.file) || statSync(t.file).size > 256 * 1024) continue;
      body = readFileSync(t.file, "utf8");
      if (body.includes("\0")) continue; // binary
      const r = review(t.file);
      if (r === null) continue;
      added = r === "all" ? null : r;
      kind = /\.[cm]?[jt]sx?$/i.test(t.file) ? "js" : /\.py$/i.test(t.file) ? "py" : "shell";
    }
    lastBody = body;
    let hits;
    try {
      hits = scan(body, added, kind);
    } catch {
      hits = CRUDE.test(body) ? [{ line: "?", text: "(crude match — scanner unavailable)", why: [] }] : [];
    }
    if (!hits.length) continue;
    const where = t.file ? t.file.replace(/\\/g, "/") : t.label;
    const mode = t.file ? (added ? "uncommitted lines" : "untracked or outside a repo — whole body") : "inline code";
    ask(`${where}:${hits[0].line} (${mode})`, hits[0].text, hits[0].why);
  }
} catch {
  // A helper is missing or threw: crude-check the text in hand and every file
  // the command names, rather than let `bash x.sh` through unread.
  const base = input?.cwd ?? process.cwd();
  for (const t of [lastBody, ...cmd.split(/\s+/)]) {
    let body = t;
    try {
      const p = resolve(base, t.replace(/^["']|["']$/g, ""));
      if (t !== lastBody && statSync(p).isFile() && statSync(p).size < 262144) body = readFileSync(p, "utf8");
    } catch {
      /* not a file — test the token itself */
    }
    if (CRUDE.test(body)) ask("(guard fallback — crude match)", body.split("\n").find((l) => CRUDE.test(l)) ?? "");
  }
}
process.exit(0);
