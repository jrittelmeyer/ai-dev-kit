# Project audit — ai-dev-kit — 2026-08-09

**Kit version audited:** 0.8.0 (HEAD `4f4405e` + pending doc-currency fixes in the
working tree) · **Aggregate: 90.4 / 100** · First audit of this repo — full pass,
no git bounding (no prior report exists).

## Method

- Read every file in the repo (27 files) plus the agent-memory directory (empty).
- Verified doc claims against code directly; ran the full CI suite locally on
  Windows (installer round-trip → 15 files, idempotent re-run → 0 written,
  `--check` green, 14 smoke cases + 4 anchoring assertions green).
- Adversarial probes beyond CI: settings-merge against a pre-populated
  `settings.json` (user hooks + stale kit entry + foreign events) — **correct**:
  preserved, replaced, no duplicates. context-guard driven from a subdirectory
  with a custom `docs.contextDir` — **coverage silently lost** (see H-1).
- Verified `hooks.json` field claims (`if`, `statusMessage`, `timeout`,
  `additionalContext` for Pre/PostToolUse) against current official Claude Code
  docs via a research agent: all supported; hooks spawn with **session cwd**, and
  the harness exports `CLAUDE_PROJECT_DIR` to the hook process.
- Public surface via APIs, not badges: CI + CodeQL green on recent pushes; **0
  open code-scanning alerts, 0 open Dependabot alerts, 0 issues, 0 PRs**; MIT
  recognized; `actions/checkout` latest is v7.0.1 and `actions/setup-node`
  v7.0.0 vs the pinned v4.x; **no git tags and no GitHub releases exist**.
- No adapter config exists in this repo (the kit is not its own consumer), so doc
  paths defaulted: report → `docs/archive/`, backlog → new `docs/BACKLOG.md`,
  status surface → README.

## Scores

| # | Group | Score | Headline deductions |
|---|-------|------:|---------------------|
| 1 | Lifecycle skills (checkpoint · dep-check · live-verify · tidy · doc-audit · project-audit) | 95 | web-app-shaped assumptions; no recorded trials for this six (inception skills got them) |
| 2 | Inception skills (project-init · project-adopt) | 95 | trials recorded but not repeatable; no in-kit worked example |
| 3 | Adapter contract (schema + reference) | 92 | `additionalProperties: false` unenforced anywhere; schema never checked in CI |
| 4 | Installer (`install.mjs`) | 86 | stale-leftover blindness; silent unknown flags; no `--help`; merge/idempotency untested |
| 5 | Hooks & automation | 90 | context-guard cwd bug (proven); stdin fragility; contextDir substring imprecision |
| 6 | Testing & CI | 85 | idempotency asserted as exit-0 only; no version gate; no merge-state case; no floor matrix |
| 7 | Security & supply chain | 91 | no SECURITY.md; no dependabot.yml; actions 3 majors behind (SHA-pinned, green) |
| 8 | Versioning & release discipline | 90 | no tags/releases — version pinning impossible; hand-bumped stamps drifted twice |
| 9 | Docs & showcase (README · PLAYBOOK · deck) | 93 | deck's "schema-validated" overclaim; no Node floor stated |
| 10 | Public surface & governance | 87 | no CONTRIBUTING/SECURITY/topics/badges; kit doesn't dogfood itself (no self-adapter) |

Calibration: graded against "the most competently executed, robust starter of its
kind available today," not against the repo's history. Dimension-level notes
below; every deduction maps to a backlog row or the excluded list.

### Named deductions per group

**1 · Lifecycle skills — 95** (Corr 29 · Compl 23 · Sec 15 · Perf 10 · Test 8 · DX 10)
- Compl −2: `live-verify` and `tidy` lean web-app-shaped (ports, dev servers,
  e2e users); CLI/library consumers get thinner guidance. No row — accepted
  scope for now, noted for a future consumer-shape pass.
- Test −2: the six lifecycle skills have no recorded live trial (both inception
  skills do). Trial-hardening is the kit's own quality mechanism. No row —
  trials happen on real consumer use; recorded here as the standing expectation.
- Corr −1: checkpoint's context-health arithmetic is judgment prose — fine, but
  unfalsifiable; kept as designed.

**2 · Inception skills — 95** (29 · 24 · 15 · 10 · 8 · 9)
- Compl −1: no worked example (a tiny fixture adoption) demonstrating the
  disposition map / parity-spec output shapes. Excluded (cost > breadth today).
- Test −2: trials (0.4.1, 0.6.1) were live but unrepeatable. DX −1: both files
  are dense (~230 lines); deliberate, navigable.

**3 · Adapter contract — 92** (28 · 24 · 13 · 10 · 7 · 10)
- Corr −2 / Sec −2 / Test −3: the schema's `additionalProperties: false`
  contract is enforced by nothing — installer JSON.parses only; CI never
  validates even the reference adapter. A typo'd key silently degrades to
  defaults at runtime (context-guard reads the config live). → **B1-3**.
- Compl −1: `docs.handoff` absent from the reference adapter (deliberate
  default; documented) — no row.

**4 · Installer — 86** (26 · 22 · 14 · 10 · 6 · 8)
- Corr −4: `--check` and install are both blind to stale leftovers — a file
  removed/renamed in a kit skill leaves an orphan in every consumer forever,
  and drift reads green. → **B2-7**. Unknown/misspelled flags are silently
  ignored (`--desst x` installs into cwd). → **B3-13**.
- Compl −3: no prune, no `--help`, no schema validation (→ B1-3).
- Sec −1: settings.json rewritten without a backup (content verified preserved).
- Test −4: merge-from-populated-state and true idempotency untested → **B2-6**,
  **B1-4**. DX −2: usage lives only in a source comment → **B3-13**.

**5 · Hooks & automation — 90** (25 · 23 · 15 · 10 · 8 · 9)
- Corr −5: **proven** — context-guard reads `.claude/ai-dev-kit.config.json`
  relative to the session cwd; from a subdirectory the custom `contextDir` is
  silently lost (the exact cwd class 0.7.2 fixed for handler *paths*; the
  harness exports `CLAUDE_PROJECT_DIR`, unused here). → **B1-1**.
- Compl −2: contextDir match is unanchored substring (`otherdocs/context/`
  false-positives) and instruction-file match is case-sensitive → **B3-15**.
- Test −2: no smoke case for the config-override path or malformed stdin
  → folded into **B1-1**, **B3-12**. DX −1: the marker⇆hooks.json coupling is
  documented only in installer comments.

**6 · Testing & CI — 85** (28 · 17 · 15 · 10 · 6 · 9)
- Corr −2: the "Re-run is idempotent" step passes on exit 0 alone — the claim
  it names is not asserted → **B1-4**.
- Compl −8: no version-consistency gate (→ **B1-2**), no populated-merge case
  (→ **B2-6**), no Node-floor leg (→ **B2-9**), no adapter-schema check
  (→ B1-3). Test −4: smoke-case gaps (npm-install variant, `git -c … commit`,
  config override, garbage stdin). DX −1: no CI badge (→ **B2-11**).

**7 · Security & supply chain — 91** (30 · 20 · 13 · 10 · 9 · 9)
- Compl −5: no SECURITY.md (→ **B2-11**), no dependabot.yml — with zero npm
  deps the only moving surface is the two actions, which never get update PRs
  (→ **B2-8**). Sec −2: actions three majors behind (v4 → v7; SHA-pinned and
  green, so exposure is low). Test −1: no scorecard/pin-audit automation —
  excluded. DX −1: posture undocumented.

**8 · Versioning & release — 90** (27 · 22 · 15 · 10 · 7 · 9)
- Corr −3: the hand-bump rule (manifest + VERSION + CHANGELOG together) drifted
  twice in the audited tree — committed README said "Three" hooks with four
  shipped; the deck sat at 0.7.1 under a 0.8.0 kit. Fixes were in the working
  tree, uncommitted (a checkpoint-discipline miss).
- Compl −3: **no git tags, no GitHub releases** — "re-run from a fresh clone"
  always installs HEAD; a consumer cannot pin or roll back → **B1-5**.
- Test −3: nothing gates the stamps (→ **B1-2**). DX −1: three hand-synced
  version sites.

**9 · Docs & showcase — 93** (27 · 23 · 15 · 10 · 9 · 9)
- Corr −3: deck claimed adapters are "schema-validated" — false today (fixed
  this pass: reworded to "schema-documented"; **B1-3** makes the stronger claim
  true again). Committed-tree hook-count/stamp drift (see group 8).
- Compl −2: no Node floor stated (→ **B2-9**); no troubleshooting section —
  excluded (support surface too small). Test −1: links unchecked in CI —
  excluded. DX −1: no badges (→ **B2-11**).

**10 · Public surface & governance — 87** (29 · 17 · 14 · 10 · 9 · 8)
- Compl −8: no CONTRIBUTING.md or SECURITY.md (→ **B2-11**), no repo topics, no
  CI badge, and the kit repo is not its own consumer — no self-adapter, no
  installed skills/hooks, so kit sessions (this audit included) run without the
  kit's own machinery and doc paths must be defaulted (→ **B2-10**).
- Sec −1: no private-report channel. Test −1: no dogfooding. DX −2:
  discoverability (topics/badges). Corr −1: working tree sat dirty for a day.

## Drift findings (docs wrong — fixed in docs this pass)

1. **Deck "schema-validated"** (`docs/pitch-deck.html`, Portability slide):
   nothing validates adapters against `project.schema.json`. Reworded to
   "schema-documented"; B1-3 restores the stronger claim by making it true.
2. **Pre-existing, uncommitted fixes carried forward:** README/PLAYBOOK
   "Three → Four hooks", deck restamp 0.7.1 → 0.8.0 + selective-merge card +
   roadmap "Later" expansion. Correct in the working tree; committed with this
   audit. The committed tree had shipped 0.8.0 with a 0.7.1-stamped deck —
   evidence for B1-2.
3. Everything else checked clean: README install/flag semantics ✓ (verified by
   execution), manifest hooks/skills/pipeline tables ✓, PLAYBOOK ↔ skills
   cross-references ✓, adapter schema ↔ reference adapter ✓, CHANGELOG claims
   spot-checked against code ✓, `hooks.json` field syntax ✓ (current docs),
   README's external links resolve ✓.

## Goals & gates re-check

- Roadmap rows re-read against reality — no goal drift. npm packaging stays
  demand-gated (no demand signal: zero issues/PRs). Exec-form hooks stay gated
  on kit-internal marker work — now a scheduled row (**B3-14**), not a wish.
  Git-root resolution for `CLAUDE_PROJECT_DIR` remains an upstream harness
  limitation — watch row; B1-1 removes the kit's own share of that class.
- Ecosystem currency: hook-config fields re-verified against today's docs (all
  valid, none deprecated); pinned actions have newer majors (**B2-8**).

## Prioritized backlog

Bands follow the kit's own convention (B1 do-next → B4 pivot-only), ordered by
breadth of downstream value. Full rows live in [docs/BACKLOG.md](../BACKLOG.md);
this table is the durable record.

| Band | # | Area | Item | Recovers | Effort |
|------|---|------|------|----------|--------|
| B1 | 1 | hooks | Anchor context-guard's config read on `CLAUDE_PROJECT_DIR` (env var is exported to hooks); add config-override smoke case | Hooks +5, CI +1 | S |
| B1 | 2 | ci | Version-consistency gate: VERSION == manifest == CHANGELOG top == deck stamps | CI +3, Versioning +3, Docs +1 | S |
| B1 | 3 | installer | Zero-dep schema validation of adapters at install (types · enums · unknown keys); validate reference adapter in CI; restore deck claim | Adapter +5, Installer +2, CI +1 | M |
| B1 | 4 | ci | Assert idempotency for real: second run must print "0 file(s) written" | CI +2, Installer +1 | S |
| B1 | 5 | release | Annotated tag per version (backfill 0.8.0); GitHub Releases from changelog | Versioning +3, Public +1 | S |
| B2 | 6 | ci | Settings-merge regression tests from pre-populated settings.json (preserve · replace · no-dup · byte-stable) | CI +3, Installer +3 | M |
| B2 | 7 | installer | Stale-leftover detection: `--check` flags (and install prunes/reports) files in kit-owned dirs absent from kit source | Installer +4 | M |
| B2 | 8 | security | `dependabot.yml` (github-actions, weekly) + bump checkout/setup-node to current majors, SHA-pinned | Security +4 | S |
| B2 | 9 | docs/ci | Declare the Node floor in README; add that version to the CI matrix | Docs +1, CI +1 | S |
| B2 | 10 | repo | Dogfood: `adapters/ai-dev-kit.json` + self-install so kit sessions run the kit's skills/hooks | Public +3 | S |
| B2 | 11 | governance | CONTRIBUTING.md + SECURITY.md + repo topics + CI badge | Public +4, Security +2, Docs/CI +2 | S |
| B3 | 12 | hooks | Handlers tolerate malformed/empty stdin (exit 0 silent) + garbage-stdin smoke case | Hooks +1 | S |
| B3 | 13 | installer | Reject unknown flags; add `--help` | Installer +3 | S |
| B3 | 14 | hooks/installer | Exec-form hook entries: ownership marker keys on `args`, then flip hooks.json (harness expands vars in exec form) | Hooks +1, Installer +1 | M |
| B3 | 15 | hooks | context-guard precision: boundary-anchored contextDir match; case-insensitive instruction-file match | Hooks +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — existing roadmap row, opens on consumer demand | Public +1 | M |

## Considered and excluded

- **CoC, issue/PR templates, FUNDING** — governance weight beyond a
  personal-scale kit; CONTRIBUTING + SECURITY (B2-11) cover the adoption path.
  Revisit when external contributors arrive.
- **Stop-hook checkpoint nag · tidy hook · calendar doc-audit nudge** — standing
  reviewed-and-rejected automations (manifest records them); re-affirmed.
- **A kit STATUS.md** — README + CHANGELOG carry status at this scale; the new
  BACKLOG.md + archive complete the doc set without another surface.
- **TypeScript handlers / any build step** — zero-dependency purity is the
  feature.
- **In-CI live-session hook test** (real harness driving handlers) — no headless
  contract to drive; piped-event tests are the honest proxy.
- **PowerShell-only (no Git Bash) CI leg** — 0.7.2's quoting analysis covers it
  analytically; a rare consumer shape doesn't earn a matrix leg yet.
- **Link checker in CI · troubleshooting doc · lifecycle-skill fixture trials ·
  worked adoption example** — each noted above; cost outweighs breadth today.
- **MultiEdit matcher coverage** — current harness folds multi-edits under
  `Edit`; no evidence of a gap.

## Verdict

The kit is what it claims to be: every executable claim reproduced on first try,
the public surface is alert-clean, and the doc corpus is unusually honest
(rejections recorded, limits named, trial mends changelogged). The lost points
concentrate in *enforcement* — claims that are true but ungated (idempotency,
version stamps, schema shape) and one proven hook bug in the cwd class the kit
already knew about. B1 is one short session: five S/M rows, three of which are
CI gates that make today's honesty self-maintaining.
