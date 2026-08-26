#!/usr/bin/env node
/**
 * Advisory (non-blocking): warns when a shipped version in CHANGELOG.md has
 * no matching `v<version>` git tag. The newest (top) entry is expected to be
 * untagged until the post-CI release ritual cuts its tag, so it's skipped —
 * only older entries count as drift. Versions older than the earliest tag
 * that exists at all (v0.8.0 — tagging wasn't a practice before it) are also
 * exempt: that's accepted history, not drift. B1-44: v0.23.5–v0.23.9 shipped
 * five versions deep before this gap was caught by a manual audit.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const compareVersions = (a, b) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

const changelog = readFileSync("CHANGELOG.md", "utf8");
const versions = [...changelog.matchAll(/^## +(\S+)/gm)].map((m) => m[1]);

const tags = new Set(
  execFileSync("git", ["tag", "--list", "v*"], { encoding: "utf8" })
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean),
);

const floor = [...tags]
  .map((t) => t.slice(1))
  .sort(compareVersions)[0];

const [newest, ...older] = versions;
const untagged = older.filter((v) => !tags.has(`v${v}`) && compareVersions(v, floor) >= 0);

if (untagged.length > 0) {
  console.warn(`Advisory: ${untagged.length} shipped version(s) have no matching git tag:`);
  for (const v of untagged) console.warn(`  v${v}`);
  console.warn(
    `(newest CHANGELOG entry v${newest} is exempt — tags are cut after CI goes green, per the release ritual)`,
  );
  console.warn("Fix: cut the missing tags + GitHub Releases, or note why they're intentionally skipped.");
} else {
  console.log(`tag currency: all ${older.length} prior shipped version(s) tagged (v${newest} pending its ritual tag).`);
}
