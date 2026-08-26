#!/usr/bin/env node
/**
 * Release green-gate: v0.23.0 was tagged on 6f2099e, a sha whose CI had
 * actually failed (fixture staleness split across follow-up commits). This
 * asserts a target sha's check runs are ALL completed + success before a tag
 * is cut, via `gh api` (requires `gh` authenticated — same tool the release
 * ritual already uses to watch CI).
 */
import { execFileSync } from "node:child_process";

const sha = process.argv[2] ?? "HEAD";
const resolvedSha = execFileSync("git", ["rev-parse", sha], { encoding: "utf8" }).trim();

const repo = execFileSync("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], {
  encoding: "utf8",
}).trim();

const raw = execFileSync(
  "gh",
  ["api", `repos/${repo}/commits/${resolvedSha}/check-runs`, "--jq", ".check_runs"],
  { encoding: "utf8" },
);
const checkRuns = JSON.parse(raw);

if (checkRuns.length === 0) {
  console.error(`No check runs found for ${resolvedSha} — CI may not have started yet.`);
  process.exit(1);
}

const notGreen = checkRuns.filter((r) => r.status !== "completed" || r.conclusion !== "success");

if (notGreen.length > 0) {
  console.error(`CI is not green on ${resolvedSha}:`);
  for (const r of notGreen) {
    console.error(`  ${r.name.padEnd(40)} status=${r.status} conclusion=${r.conclusion ?? "(pending)"}`);
  }
  console.error("Fix: do not tag until every check run above is completed + success.");
  process.exit(1);
}

console.log(`CI green on ${resolvedSha}: ${checkRuns.length} check run(s) all completed + success.`);
