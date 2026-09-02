#!/usr/bin/env node
/**
 * Cuts the tag + GitHub Release for the current VERSION, targeting a given
 * sha. Called by release.yml after check-release-ready.mjs has confirmed
 * that sha's CI is green. No-ops if v<version> is already tagged (re-runs of
 * the workflow, or a version bump that hasn't shipped yet).
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const sha = process.argv[2] ?? "HEAD";
const resolvedSha = execFileSync("git", ["rev-parse", sha], { encoding: "utf8" }).trim();

const version = readFileSync("VERSION", "utf8").trim();
const tag = `v${version}`;

const existingTags = execFileSync("git", ["tag", "--list", tag], { encoding: "utf8" }).trim();
if (existingTags === tag) {
  console.log(`${tag} already exists — no-op.`);
  process.exit(0);
}

const changelog = readFileSync("CHANGELOG.md", "utf8");
const entryMatch = changelog.match(
  new RegExp(`^## ${version.replace(/\./g, "\\.")}.*\\n([\\s\\S]*?)(?=\\n## |$)`, "m"),
);
if (!entryMatch) {
  console.error(`No CHANGELOG.md entry found for ${version} — refusing to release.`);
  process.exit(1);
}
const body = entryMatch[1].trim();

// Subject line: everything up to the first sentence-ending period in the
// entry's first paragraph, so the title tracks the CHANGELOG (which stays
// with VERSION) rather than any one commit — a fix landing on top of the
// release commit, still on the same un-tagged VERSION, must not break this.
const firstParagraph = body.split(/\n\n/)[0].replace(/\s+/g, " ").trim();
const subject = firstParagraph.split(/(?<=[.!?])\s/)[0].replace(/[.!?]+$/, "");
const title = `${tag} — ${subject}`;

execFileSync("git", ["tag", "-a", tag, resolvedSha, "-m", title], { stdio: "inherit" });
execFileSync("git", ["push", "origin", tag], { stdio: "inherit" });

execFileSync(
  "gh",
  ["release", "create", tag, "--target", resolvedSha, "--title", title, "--notes", body],
  { stdio: "inherit" },
);

console.log(`Released ${tag} on ${resolvedSha}.`);
