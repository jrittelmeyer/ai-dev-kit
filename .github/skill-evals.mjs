#!/usr/bin/env node
/**
 * CI gate: per-skill eval scenarios (`.github/skill-evals/<skill>.json`).
 *
 * Two tiers out of one fixture set. The **mechanical tier** (default run) is a
 * regression guard: every expected behavior carries an `anchor` — a literal the
 * skill still has to contain — so a refactor that quietly drops checkpoint's
 * three-strikes rule or dep-check's release-age window turns CI red instead of
 * sailing through every other gate, which only ever checked shape and size. The
 * **model tier** (`--report`) prints the same scenarios as a prompt + rubric run
 * sheet for a graded pass (harness-audit step 4), keeping API keys, cost, and
 * nondeterminism out of CI. `--report --delta` adds a baseline run of each prompt
 * (no skill installed) so a grader can score a true with/without delta instead of
 * just "does the skill's own text produce compliant behavior."
 *
 * ERR ⇒ exit 1: coverage, fixture schema, and unresolved anchors — defects that
 * mean the eval is not actually testing anything. Routing and rubric checks warn
 * and never fail the build, per skill-lint's doctrine that a wording edit must
 * not knife-edge CI.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const EVALS_DIR = ".github/skill-evals";
const SKILLS_DIR = "skills";
const MIN_SCENARIOS = 3;
// Anchors shorter than this match by accident ("Drop", "union") and would pass
// against a body that no longer says the thing.
const MIN_ANCHOR_CHARS = 8;

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

/** Body = SKILL.md minus the frontmatter fence: anchors must hit prose, not the description. */
const stripFrontmatter = (text) => text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

/** The description as the harness sees it, including `>-` folded blocks (skill-lint gates the shape). */
function description(text) {
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex((l) => /^description:/.test(l));
  if (start === -1) return "";
  const first = lines[start].replace(/^description:\s*/, "");
  if (first !== ">-" && first !== ">") return first;
  const folded = [];
  for (const line of lines.slice(start + 1)) {
    if (!/^\s+\S/.test(line)) break;
    folded.push(line.trim());
  }
  return folded.join(" ");
}

// Routing scorer: deliberately crude — term overlap, no model. Its job is
// collision detection across descriptions sharing one always-loaded budget, so
// it warns and never gates.
const STOPWORDS = new Set(
  ("a an and are as at be by can do does for from has have how i in into is it its my of on or our" +
    " should that the then there this to us we what when where which who why with you your")
    .split(" "),
);
const terms = (s) =>
  new Set(
    (s.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? []).filter(
      (w) => w.length > 2 && !STOPWORDS.has(w),
    ),
  );
const overlap = (promptTerms, skillTerms) => {
  if (promptTerms.size === 0) return 0;
  let hits = 0;
  for (const t of promptTerms) if (skillTerms.has(t)) hits++;
  return hits / promptTerms.size;
};

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const skills = new Map();
for (const entry of manifest.skills) {
  const path = join(SKILLS_DIR, entry.name, "SKILL.md");
  if (!existsSync(path)) continue; // skill-lint owns the bijection check
  const text = readFileSync(path, "utf8");
  skills.set(entry.name, {
    body: stripFrontmatter(text),
    terms: terms(`${description(text)} ${(entry.triggers ?? []).join(" ")}`),
  });
}

if (!existsSync(EVALS_DIR)) {
  err(`${EVALS_DIR}/ does not exist — every skill needs eval scenarios`);
  process.exit(1);
}
const fixtureFiles = readdirSync(EVALS_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

const loaded = new Map();
for (const file of fixtureFiles) {
  const id = `${EVALS_DIR}/${file}`;
  const stem = file.replace(/\.json$/, "");
  let fixture;
  try {
    fixture = JSON.parse(readFileSync(join(EVALS_DIR, file), "utf8"));
  } catch (e) {
    err(`${id}: does not parse — ${e.message}`);
    continue;
  }
  if (fixture.skill !== stem) {
    err(`${id}: "skill": "${fixture.skill}" ≠ filename stem "${stem}"`);
    continue;
  }
  if (!skills.has(stem)) {
    err(`${id}: no skills/${stem}/ — a fixture for a skill that does not exist`);
    continue;
  }
  const scenarios = fixture.scenarios ?? [];
  if (scenarios.length < MIN_SCENARIOS) {
    err(`${id}: ${scenarios.length} scenario(s) — the authoring rubric asks ${MIN_SCENARIOS}+`);
  }
  loaded.set(stem, scenarios);

  const { body } = skills.get(stem);
  const seenIds = new Set();
  for (const [i, s] of scenarios.entries()) {
    const at = `${id}#${s.id ?? i}`;
    if (!s.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) {
      err(`${at}: scenario id must be lowercase-hyphen`);
    } else if (seenIds.has(s.id)) {
      err(`${at}: duplicate scenario id`);
    } else {
      seenIds.add(s.id);
    }
    if (!s.prompt?.trim()) err(`${at}: missing prompt — the model tier has nothing to run`);

    const expects = s.expect ?? [];
    if (expects.length === 0) err(`${at}: no expect[] entries`);
    for (const e of expects) {
      if (!e.behavior?.trim()) err(`${at}: expect entry missing "behavior"`);
      const anchor = e.anchor ?? "";
      if (!anchor.trim()) {
        err(`${at}: expect "${e.behavior ?? "?"}" has no anchor`);
        continue;
      }
      if (anchor.length < MIN_ANCHOR_CHARS) {
        err(`${at}: anchor "${anchor}" is ${anchor.length} chars (min ${MIN_ANCHOR_CHARS}) — too short to mean anything`);
        continue;
      }
      // Default target is the skill body; `in` points at a bundled file.
      let haystack = body;
      if (e.in) {
        if (e.in.split("/").length > 2) {
          err(`${at}: "in": "${e.in}" nests deeper than one level`);
          continue;
        }
        const refPath = join(SKILLS_DIR, stem, e.in);
        if (!existsSync(refPath)) {
          err(`${at}: "in": "${e.in}" does not exist`);
          continue;
        }
        haystack = readFileSync(refPath, "utf8");
      }
      if (!haystack.toLowerCase().includes(anchor.toLowerCase())) {
        err(
          `${at}: anchor "${anchor}" no longer appears in ${e.in ?? "the skill body"} — ` +
            `the behavior "${e.behavior}" was edited away or the anchor spans a line wrap`,
        );
      }
    }

    const rejects = s.reject ?? [];
    if (rejects.length === 0) warn(`${at}: no reject[] lines — the graded pass has nothing to fail on`);

    // Routing: the intended skill must outrank every decoy on the prompt.
    const decoys = s.decoys ?? [];
    if (decoys.length === 0) {
      warn(`${at}: no decoys[] — routing goes unchecked for this prompt`);
    }
    const promptTerms = terms(s.prompt ?? "");
    const mine = overlap(promptTerms, skills.get(stem).terms);
    for (const decoy of decoys) {
      if (decoy === stem) {
        err(`${at}: "${decoy}" is listed as its own decoy`);
        continue;
      }
      if (!skills.has(decoy)) {
        err(`${at}: decoy "${decoy}" is not a skill`);
        continue;
      }
      const theirs = overlap(promptTerms, skills.get(decoy).terms);
      // Strictly outranks only: a tie between two low bag-of-words scores is
      // the scorer hitting its resolution limit, not evidence of a collision.
      if (theirs > mine) {
        warn(
          `${at}: decoy "${decoy}" scores ${theirs.toFixed(2)} vs intended ${mine.toFixed(2)} — ` +
            `descriptions may collide on this prompt`,
        );
      }
    }
  }
}

for (const name of skills.keys()) {
  if (!loaded.has(name)) err(`skills/${name}: no ${EVALS_DIR}/${name}.json — every skill needs eval scenarios`);
}

if (process.argv.includes("--report")) {
  // --delta adds a second, unlabeled-skill run of the same prompt per scenario, so a
  // grader can score expect[]/reject[] against both runs and see which behaviors the
  // skill actually earns (vs. ones the model does anyway, unprompted). Still a pure
  // run-sheet generator: no API calls here, the grading happens outside this script.
  const delta = process.argv.includes("--delta");
  const lines = [
    "# Skill eval run sheet",
    "",
    "The model-graded tier. Run each prompt against the installed skills, then",
    "grade: every **expect** behavior should appear, no **reject** behavior should.",
    "Anchors are what CI already proved still present — they are shown so a grader",
    "can see which body text each behavior rests on.",
    "",
  ];
  if (delta) {
    lines.push(
      "**Delta mode:** each scenario carries two runs of the *same prompt* — grade both.",
      "Run A has the skill installed and available for routing, as usual. Run B is the",
      "baseline: no skill files present, no skill named, same model, same prompt, fresh",
      "context. Score expect[]/reject[] against each run independently; a behavior that",
      "shows up in both isn't evidence the skill did anything.",
      "",
    );
  }
  for (const [name, scenarios] of [...loaded].sort()) {
    lines.push(`## ${name}`, "");
    for (const s of scenarios) {
      lines.push(`### ${s.id}`, "");
      if (delta) {
        lines.push(`**Run A — with skill available:** ${s.prompt}`, "");
      } else {
        lines.push(`**Prompt:** ${s.prompt}`, "");
      }
      lines.push("**Expect:**");
      for (const e of s.expect ?? []) {
        lines.push(`- ${e.behavior}  \`${e.anchor}\`${e.in ? ` (${e.in})` : ""}`);
      }
      if ((s.reject ?? []).length) {
        lines.push("", "**Reject:**");
        for (const r of s.reject) lines.push(`- ${r}`);
      }
      if (delta) {
        lines.push(
          "",
          `**Run B — baseline, WITHOUT the skill installed/available:** ${s.prompt}`,
          "",
          "Run this in a session with no skill files present and no skill named — same",
          "model, same prompt, fresh context. Grade the same expect[]/reject[] lines above",
          "against this run's output; note per-behavior whether it appeared, and where the",
          "two runs diverge.",
        );
      }
      lines.push("");
    }
  }
  if (delta) {
    lines.push(
      "## Computing the delta",
      "",
      "For each scenario, count expect[] behaviors present in Run A but absent in Run B —",
      "those are the behaviors the skill actually earns. Record as `N/M expect behaviors",
      'present only with the skill loaded" per skill (M = total expect[] count across its',
      "scenarios). A behavior present in both runs is not evidence the skill helped; a",
      "reject[] line that fires in Run B but not Run A is a skill actively preventing a",
      "regression, and worth calling out the same way.",
      "",
    );
  }
  console.log(lines.join("\n"));
}

const scenarioCount = [...loaded.values()].reduce((n, s) => n + s.length, 0);
const anchorCount = [...loaded.values()]
  .flat()
  .reduce((n, s) => n + (s.expect ?? []).length, 0);

if (errors > 0) {
  console.error(`skill-evals: ${errors} error(s), ${warnings} warning(s).`);
  process.exit(1);
}
console.log(
  `skill-evals: ${loaded.size} skills · ${scenarioCount} scenarios · ${anchorCount} anchors resolved — ` +
    `0 errors, ${warnings} warning(s).`,
);
