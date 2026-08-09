#!/usr/bin/env node
/**
 * CI gate: the kit version is stamped in five places — VERSION, manifest.json,
 * the CHANGELOG's top entry, and the deck's eyebrow + footer. The stamps are
 * hand-bumped together (README · Rules); this asserts they actually agree, so
 * a release commit can no longer ship with a stale stamp.
 */
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const deck = read("docs/pitch-deck.html");

const sites = {
  VERSION: read("VERSION").trim(),
  "manifest.json": JSON.parse(read("manifest.json")).version,
  "CHANGELOG.md top entry": read("CHANGELOG.md").match(/^## +(\S+)/m)?.[1],
  "deck eyebrow": deck.match(/class="eyebrow">ai-dev-kit · v([0-9][\w.-]*)</)?.[1],
  "deck footer": deck.match(/current as of [0-9-]+ · ai-dev-kit ([0-9][\w.-]*) ·/)?.[1],
};

const versions = new Set(Object.values(sites));
if (versions.size !== 1 || versions.has(undefined)) {
  console.error("Version stamps disagree:");
  for (const [site, version] of Object.entries(sites)) {
    console.error(`  ${site.padEnd(22)} ${version ?? "NOT FOUND"}`);
  }
  console.error(
    "Fix: bump VERSION, manifest.json, CHANGELOG.md, and both deck stamps together (README · Rules).",
  );
  process.exit(1);
}
console.log(`version stamps agree: ${[...versions][0]} (${Object.keys(sites).length} sites).`);
