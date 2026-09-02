#!/usr/bin/env node
/**
 * Release green-gate: v0.23.0 was tagged on 6f2099e, a sha whose CI had
 * actually failed (fixture staleness split across follow-up commits). This
 * asserts a target sha's check runs are ALL completed + success before a tag
 * is cut, via `gh api` (requires `gh` authenticated — same tool the release
 * ritual already uses to watch CI).
 *
 * Run from inside the job it gates (release.yml), this job's own check run
 * is always still `in_progress` and is excluded via GITHUB_JOB. Any other
 * check still running at that instant (e.g. CodeQL, which starts on the same
 * push but isn't the workflow_run trigger) gets a short poll window rather
 * than an immediate false-negative — it's expected to finish within minutes
 * of CI, not fail.
 */
import { execFileSync } from "node:child_process";

const sha = process.argv[2] ?? "HEAD";
const resolvedSha = execFileSync("git", ["rev-parse", sha], { encoding: "utf8" }).trim();

const repo = execFileSync("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], {
  encoding: "utf8",
}).trim();

const selfJob = process.env.GITHUB_ACTIONS === "true" ? process.env.GITHUB_JOB : undefined;

function fetchCheckRuns() {
  const raw = execFileSync(
    "gh",
    ["api", `repos/${repo}/commits/${resolvedSha}/check-runs`, "--jq", ".check_runs"],
    { encoding: "utf8" },
  );
  return JSON.parse(raw).filter((r) => r.name !== selfJob);
}

const POLL_INTERVAL_MS = 15_000;
const POLL_TIMEOUT_MS = 5 * 60_000;
const deadline = Date.now() + POLL_TIMEOUT_MS;

let checkRuns = fetchCheckRuns();
if (checkRuns.length === 0) {
  console.error(`No check runs found for ${resolvedSha} — CI may not have started yet.`);
  process.exit(1);
}

let notGreen = checkRuns.filter((r) => r.status !== "completed" || r.conclusion !== "success");
while (notGreen.length > 0 && notGreen.every((r) => r.status !== "completed") && Date.now() < deadline) {
  console.log(`Waiting on ${notGreen.length} still-running check run(s): ${notGreen.map((r) => r.name).join(", ")}`);
  execFileSync("node", ["-e", `setTimeout(()=>{}, ${POLL_INTERVAL_MS})`]);
  checkRuns = fetchCheckRuns();
  notGreen = checkRuns.filter((r) => r.status !== "completed" || r.conclusion !== "success");
}

if (notGreen.length > 0) {
  console.error(`CI is not green on ${resolvedSha}:`);
  for (const r of notGreen) {
    console.error(`  ${r.name.padEnd(40)} status=${r.status} conclusion=${r.conclusion ?? "(pending)"}`);
  }
  console.error("Fix: do not tag until every check run above is completed + success.");
  process.exit(1);
}

console.log(`CI green on ${resolvedSha}: ${checkRuns.length} check run(s) all completed + success.`);
