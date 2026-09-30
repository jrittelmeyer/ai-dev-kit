/**
 * ai-dev-kit — script-exec-guard's detection rules. Pure: no imports, no I/O.
 *
 * scan(body, added, kind) → [{ line, text, why }]: lines that RECURSIVELY
 * delete a non-literal or critical target — a variable/env ref, ~/HOME, `/` or
 * a drive root, a bare glob, a substitution, a `..` climb, a runtime-built
 * string. Literal relative targets pass, as do names assigned only from
 * mktemp/mkdtemp (the cleanup idiom). `added` (1-based line Set, or null =
 * whole body) keeps the session's own lines: the hit line was added, or a name
 * it deletes is assigned on an added line (#88462: old trap, new $HOME).
 * `kind`: "shell" (sh/ps1/bat) · "js" · "py" · "any" (inline code, heredocs).
 * JS/Python string literals are blanked before call matching, so a file that
 * only mentions a delete call inside a string (a test fixture) never matches.
 */
const unq = (t) => t.replace(/^[("'`]+|[)"'`,;]+$/g, "");
const ROOTISH =
  /^(?:\.?[\\/]?\*[\\/]?|\.\*|[\\/]|[a-z]:[\\/]?\*?|(?:\/home|\/users|[a-z]:[\\/]users)(?:[\\/][^\\/*]+)?[\\/]?)$/i;
const bad = (t) => /[$%`~]|\.\.|\b(?:HOME|USERPROFILE)\b/.test(t) || ROOTISH.test(unq(t));
const RECURSIVE = /(?:^|[\s"',[])(?:-[fivdI]*[rR][rRfivdI]*|--recursive|-rec\w*|\/s)(?=[\s"',\]:]|$)/i;
const VERB = /(?:^|[\s;&|(`'"{])(rm|rmdir|rd|del|erase|ri|remove-item)(?=\s|["']|$)/gi;
const VERB1 = new RegExp(VERB.source, "i");
const EXEC =
  /\b(?:exec(?:Sync|File|FileSync|a|aSync)?|spawn(?:Sync)?|system|Popen|check_call|check_output|subprocess\.(?:run|call))\s*\(/;
const CALL = /\b(rmSync|rmdirSync|rm|rmdir|rimraf(?:\.sync|Sync)?|rmtree|(?:fs|fse|fsp|fsExtra)\.remove(?:Sync)?)\s*\(/g;
const MKTEMP = /^["']?(?:\$\(\s*mktemp\b|`mktemp\b|(?:await\s+)?(?:[\w.]+\.)?mkdtemp(?:Sync)?\s*\()/;
const COMMENT = /^\s*(?:#|\/\/|\*|::|rem\s|<#)/i;
const LIT = /(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g;
const blank = (s) => s.replace(LIT, (m) => m[0] + " ".repeat(m.length - 2) + m[0]);
const namesOf = (t) => [...t.matchAll(/\$\{?(\w+)|\$env:(\w+)|%(\w+)%/gi)].map((m) => m[1] ?? m[2] ?? m[3]);
const isLit = (a) => /^(["'])(?:\\.|(?!\1)[^\\])*\1$/.test(a) || /^`[^`$]*`$/.test(a);
// Delete targets in a shell segment: drop flags (-x, /x) and redirections.
const targets = (seg) => seg.split(/\s+/).filter((t) => t && !/^(?:-|\/[a-z]$|\d?[<>])/i.test(unq(t)));

export function scan(body, added = null, kind = "any") {
  const lines = body.replace(/\r/g, "").split("\n");
  const cand = []; // { i: 0-based line, toks: offending targets }
  const shellish = kind === "shell" || kind === "any";
  const codeish = kind !== "shell";
  lines.forEach((line, i) => {
    if (COMMENT.test(line)) return;
    if (shellish) {
      for (const m of line.matchAll(VERB)) {
        const at = m.index + m[0].length;
        let seg = line.slice(at).split(/;|&&|\|\||\|/)[0];
        if (!RECURSIVE.test(seg)) continue;
        if (/\|\s*$/.test(line.slice(0, at - m[1].length))) seg = line.slice(0, at) + seg; // piped in
        const toks = targets(seg).filter(bad);
        if (toks.length) cand.push({ i, toks });
      }
      const f = /(?:^|[\s;&|(])find\s+(.*)/.exec(line);
      if (f && /-delete\b|-exec\s+rm/.test(f[1])) {
        const starts = [];
        for (const t of f[1].split(/\s+/)) {
          if (/^[-(!\\]/.test(t)) break;
          starts.push(t);
        }
        const toks = starts.filter(bad);
        if (toks.length) cand.push({ i, toks });
      }
      const d = /IO\.Directory\]::Delete\(\s*([^,)]+),\s*\$true/i.exec(line);
      if (d && bad(d[1])) cand.push({ i, toks: [d[1]] });
    }
    if (codeish && EXEC.test(line)) {
      // A shell delete handed to exec/spawn/system: literal targets are judged
      // like shell; any runtime-built part (+, ${}, %s, f-string, a bare
      // identifier in an argv array) makes the target non-literal.
      const lits = [...line.matchAll(LIT)];
      const v = lits.findIndex((l) => VERB1.test(" " + l[0].slice(1, -1)));
      if (v >= 0 && RECURSIVE.test(line.slice(lits[v].index).replace(/["'`,[\]]/g, " "))) {
        const tail = line.slice(lits[v].index);
        const code = blank(tail);
        const arr = /\[([^\]]*)\]/.exec(code)?.[1] ?? "";
        const ids = [...code.matchAll(/\+\s*([A-Za-z_$][\w$]*)/g)].map((x) => "$" + x[1]);
        ids.push(...(arr.match(/(?<![\w$"'`])[A-Za-z_$][\w$]*/g) ?? []).map((x) => "$" + x));
        const toks = [...ids, ...namesOf(tail).map((n) => "$" + n)];
        const dyn = toks.length > 0 || /\$\{|%[sdr]|\.format\(|\bf["']/.test(tail);
        if (dyn && !toks.length) toks.push("(built at runtime)");
        if (!dyn) toks.push(...targets(lits.slice(v).map((l) => l[0].slice(1, -1)).join(" ")).filter(bad));
        if (toks.length) cand.push({ i, toks });
      }
    }
  });
  if (codeish) {
    const src = lines.map((l) => (COMMENT.test(l) ? " ".repeat(l.length) : l)).join("\n");
    const bl = blank(src);
    for (const m of bl.matchAll(CALL)) {
      const open = m.index + m[0].length - 1;
      let depth = 0;
      let end = open;
      let comma = -1;
      for (; end < Math.min(bl.length, open + 800); end++) {
        const c = bl[end];
        if ("([{".includes(c)) depth++;
        else if (")]}".includes(c) && --depth === 0) break;
        else if (c === "," && depth === 1 && comma < 0) comma = end;
      }
      if (/^(?:rm|rmSync|rmdir|rmdirSync)$/.test(m[1]) && !/recursive\s*:\s*true/.test(bl.slice(open, end + 1))) continue;
      const arg = src.slice(open + 1, comma > 0 ? comma : end).trim();
      if (!arg || (isLit(arg) && !bad(arg.slice(1, -1)))) continue;
      const i = src.slice(0, m.index).split("\n").length - 1;
      cand.push({ i, toks: [/^[A-Za-z_$][\w$]*$/.test(arg) ? "$" + arg : arg] });
    }
  }

  const assigns = (name) => {
    if (/^\d+$/.test(name)) return [];
    const re = new RegExp(
      `(?:^|[\\s;(\\]])(?:export\\s+|local\\s+|readonly\\s+|declare\\s+(?:-\\w+\\s+)*|const\\s+|let\\s+|var\\s+|set\\s+)?\\$?${name}\\s*=(?!=)\\s*(.*)$`,
    );
    return lines.flatMap((l, j) => {
      const a = re.exec(l);
      return a ? [{ j, rhs: a[1], text: l.trim() }] : [];
    });
  };
  const sourced = /(?:^|[\s;])(?:source|eval)\s|^\s*\.\s/m.test(body);
  // A target is the cleanup idiom when every name in it is assigned, and only
  // ever from mktemp/mkdtemp, and nothing critical is left once they're gone.
  const tempOnly = (tok) => {
    const names = namesOf(tok);
    if (!names.length || sourced || tok.includes("..")) return false;
    const as = names.flatMap(assigns);
    return names.every((n) => assigns(n).length) && as.every((a) => MKTEMP.test(a.rhs)) &&
      !bad(tok.replace(/\$\{?\w+\}?|\$env:\w+|%\w+%/gi, ""));
  };
  const hits = [];
  const seen = new Set();
  for (const c of cand.sort((a, b) => a.i - b.i)) {
    const live = c.toks.filter((t) => !tempOnly(t));
    if (!live.length || seen.has(c.i)) continue;
    const as = live.flatMap(namesOf).flatMap(assigns);
    if (added && !added.has(c.i + 1) && !as.some((a) => added.has(a.j + 1))) continue;
    seen.add(c.i);
    const why = as.slice(0, 3).map((a) => `${a.text.slice(0, 60)} @L${a.j + 1}`);
    hits.push({ line: c.i + 1, text: lines[c.i].trim(), why });
  }
  return hits;
}
