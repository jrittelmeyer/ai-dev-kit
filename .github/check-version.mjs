#!/usr/bin/env node
/**
 * CI gate: the kit version is stamped in six places — VERSION, manifest.json,
 * the CHANGELOG's top entry, the deck's eyebrow + footer, and the plugin
 * manifest (the marketplace's update signal). The stamps are hand-bumped
 * together (README · Rules); this asserts they actually agree, so a release
 * commit can no longer ship with a stale stamp.
 *
 * It also enforces AGENTS.md's "CHANGELOG entries end with a Verification
 * paragraph" rule from v0.23.11 onward — that rule drifted five releases
 * running with no tripwire before a manual backfill caught it (B3-50).
 */
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const deck = read("docs/pitch-deck.html");

const VERIFICATION_FLOOR = "0.23.11";
const parseVersion = (v) => v.split(".").map((n) => parseInt(n, 10));
const isAtLeast = (v, floor) => {
  const a = parseVersion(v);
  const b = parseVersion(floor);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return true;
};

function checkChangelogVerification(changelog) {
  const entries = changelog.split(/^(?=## )/m).filter((e) => e.startsWith("## "));
  const missing = [];
  for (const entry of entries) {
    const version = entry.match(/^## +(\S+)/)?.[1];
    if (!version || !isAtLeast(version, VERIFICATION_FLOOR)) continue;
    if (!/^\*\*Verification[^*\n]*:\*\*/m.test(entry)) missing.push(version);
  }
  if (missing.length > 0) {
    console.error(
      `CHANGELOG entries missing a **Verification:** paragraph (required from v${VERIFICATION_FLOOR} on):`,
    );
    for (const v of missing) console.error(`  ${v}`);
    process.exit(1);
  }
  console.log(
    `changelog verification paragraphs present: all entries >= v${VERIFICATION_FLOOR} checked.`,
  );
}

const sites = {
  VERSION: read("VERSION").trim(),
  "manifest.json": JSON.parse(read("manifest.json")).version,
  "CHANGELOG.md top entry": read("CHANGELOG.md").match(/^## +(\S+)/m)?.[1],
  "deck eyebrow": deck.match(/class="eyebrow">ai-dev-kit · v([0-9][\w.-]*)</)?.[1],
  "deck footer": deck.match(/current as of [0-9-]+ · ai-dev-kit ([0-9][\w.-]*) ·/)?.[1],
  "plugin.json": JSON.parse(read(".claude-plugin/plugin.json")).version,
};

const versions = new Set(Object.values(sites));
if (versions.size !== 1 || versions.has(undefined)) {
  console.error("Version stamps disagree:");
  for (const [site, version] of Object.entries(sites)) {
    console.error(`  ${site.padEnd(22)} ${version ?? "NOT FOUND"}`);
  }
  console.error(
    "Fix: bump VERSION, manifest.json, CHANGELOG.md, both deck stamps, and .claude-plugin/plugin.json together (README · Rules).",
  );
  process.exit(1);
}
console.log(`version stamps agree: ${[...versions][0]} (${Object.keys(sites).length} sites).`);

checkChangelogVerification(read("CHANGELOG.md"));
