/**
 * ai-dev-kit — script-exec-guard's command parser. Reads nothing but stat().
 *
 * parse(cmd, cwd) → [{ file } | { code, label }]: what a Bash/PowerShell
 * command executes. Only heads in command position count (start, ; & | ( `
 * { $( or a newline; wrappers like sudo/env/VAR=x skipped), so `cat x.sh` and
 * `grep bash x.sh` read rather than run. An interpreter (bash/sh/zsh,
 * node/deno/bun, python, pwsh, cmd) yields its first existing file argument or
 * its inline code (-e / -c / -Command); a head that is itself a path runs that
 * file; `cd` / Set-Location moves the base for relative paths. A script the
 * same command writes by heredoc, or one not on disk yet, yields the command
 * text itself.
 */
import { statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, resolve } from "node:path";

const HEAD =
  /(?:^|[;&|(\n`{]|\$\()\s*((?:(?:sudo|env|time|nohup|exec|then|do|if|else|npx|bunx|xargs|uv|poetry|pipenv)\s+(?:run\s+)?|[A-Za-z_]\w*=\S*\s+)*)("[^"]*"|'[^']*'|[^\s;&|()<>]+)/g;
const TOK = /"(?:\\.|[^"\\])*"|'[^']*'|[;&|\n)]+|[^\s;&|()<>]+/g;
const INTERP = /^(?:bash|sh|zsh|dash|ksh|source|\.|node|deno|bun|tsx|ts-node|python[\d.]*|py|pwsh|powershell|cmd)$/;
const INLINE = { node: /^(?:-e|-p|--eval|--print)$/, py: /^-c$/, sh: /^-c$/, ps: /^-c(?:ommand)?$/i, cmd: /^\/[ck]$/i };
const SCRIPT_EXT = /\.(?:sh|bash|zsh|ps1|psm1|bat|cmd|py|[cm]?[jt]sx?)$/i;
const unq = (t) => t.replace(/^(["'])([\s\S]*)\1$/, "$2");
const isFile = (p) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

// Expand ~ and env refs; on Windows map Git-Bash paths (/tmp, /c/...) — else
// the #88462 shape (`bash /tmp/x.sh`) resolves to a nonexistent C:\tmp\x.sh.
function expand(t, base) {
  let p = unq(t)
    .replace(/^~(?=[\\/]|$)/, homedir())
    .replace(/\$\{?(\w+)\}?|\$env:(\w+)|%(\w+)%/gi, (m, a, b, c) => process.env[a ?? b ?? c] ?? m);
  if (process.platform === "win32") p = p.replace(/^\/tmp(?=\/|$)/i, tmpdir()).replace(/^\/([a-z])(?=\/)/i, "$1:");
  return resolve(base, p);
}

export function parse(cmd, cwd) {
  const out = [];
  let missing = false;
  for (const m of cmd.matchAll(HEAD)) {
    const head = unq(m[2]);
    const b = basename(head.replace(/\\/g, "/")).toLowerCase().replace(/\.exe$/, "");
    const args = [];
    for (const t of cmd.slice(m.index + m[0].length).match(TOK) ?? []) {
      if (/^[;&|\n)]+$/.test(t)) break;
      args.push(t);
    }
    if (/^(?:cd|pushd|set-location|sl|chdir)$/.test(b)) {
      if (args[0]) cwd = expand(args[0], cwd);
      continue;
    }
    let file = null;
    if (INTERP.test(b)) {
      const fam = /^(?:node|deno|bun|tsx|ts-node)$/.test(b) ? "node" : /^py/.test(b) ? "py"
        : /^(?:pwsh|powershell)$/.test(b) ? "ps" : b === "cmd" ? "cmd" : "sh";
      for (let k = 0; k < args.length; k++) {
        const a = unq(args[k]);
        if (INLINE[fam].test(a)) {
          const next = unq(args[k + 1] ?? "");
          if (fam !== "cmd" || !SCRIPT_EXT.test(next)) out.push({ code: next, label: `${b} ${a}` });
          else if (isFile(expand(next, cwd))) file = expand(next, cwd);
          else missing = true;
          break;
        }
        if (a.startsWith("-")) continue;
        if (isFile(expand(a, cwd))) {
          file = expand(a, cwd);
          break;
        }
        if (SCRIPT_EXT.test(a)) missing = true;
      }
    } else if (/[\\/]/.test(head) || SCRIPT_EXT.test(head)) {
      if (isFile(expand(head, cwd))) file = expand(head, cwd);
      else if (SCRIPT_EXT.test(head)) missing = true;
    }
    if (file) out.push({ file });
  }
  if (missing || (out.length && /<</.test(cmd))) out.push({ code: cmd, label: "command text" });
  return out;
}
