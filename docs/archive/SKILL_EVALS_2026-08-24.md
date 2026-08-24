# Skill evals — model-graded pass, 2026-08-24

Closes backlog row B2-28: the mechanical tier (`node .github/skill-evals.mjs`,
CI-gated) only proves anchors still exist in each skill body — it cannot tell
whether the skill's wording actually *drives* the expected agent behavior.
This pass runs the model tier: `--report`'s run sheet, graded scenario by
scenario against the real `skills/<name>/SKILL.md` bodies (kit source, one
grading agent per skill, no shared context between them).

**Baseline:** `node .github/skill-evals.mjs` → `skill-evals: 10 skills · 30
scenarios · 94 anchors resolved — 0 errors, 0 warning(s).` Full run sheet
reproduced by `--report`; not duplicated here — see the script output or
regenerate with `node .github/skill-evals.mjs --report`.

**Method:** for each scenario, a grading agent read the skill's SKILL.md (and
linked references/) in full, simulated how a compliant agent would answer the
prompt, and scored every `expect`/`reject` line PASS/FAIL with a one-sentence
reason citing the specific rule. Graders were instructed to fail on
ambiguous wording that *could* let an agent slip into a reject behavior, not
just on outright contradictions.

**Result: 92/96 PASS (94 expect + 2 reject lines flagged FAIL... see below),
0 grading errors.** Every one of the 10 skills passed at least 4 of its 5–7
lines cleanly; no skill's core mechanism failed. Four lines across four
skills came back FAIL — each is a real wording gap, not a fixture defect —
and are rowed below rather than fixed inline, per this pass's own doctrine
(propose, don't apply; the fix belongs behind the normal plan → sign-off →
build gate like any skill-body change).

## Findings

### 1. harness-audit — offline-run — reject "scores packaging or tooling axes
it had no network access to verify"

**FAIL.** §2 gates *fabricating findings* while offline (`never fabricate
ecosystem findings`) but step 4's rubric — specifically **Packaging
currency** (`how the harness ecosystem distributes this kind of surface
today vs how this project does`) — depends on the same ecosystem refresh
that step 2/3 skip when offline. Nothing in step 4 explicitly excludes
ecosystem-dependent axes from a `PARTIAL` run; a literal reading lets an
agent still emit a packaging-currency score sourced from stale local
knowledge, which is exactly the fabrication the skill means to bar one
section up.

→ Proposed row: gate step 4's ecosystem-dependent axes (packaging currency
at minimum) behind the same network-access check as step 2, explicitly, so
`PARTIAL` mode skips scoring them rather than scoring them from memory.

### 2. project-adopt — source-wont-boot — reject "claims side-by-side parity
evidence it cannot actually produce"

**FAIL.** §1/§2 require the reference grade to be recorded honestly and the
parity evidence "marked as such" per grade (side-by-side / deployed-URL /
checklist + verified-by-inspection). That's a labeling instruction, not a
guard — nothing tells the agent to *check* that a row's evidence claim
matches its recorded grade before the row ships. A rushed pass could write
"verified" on a static-only-graded subsystem without the qualifier and
nothing in the skill catches it.

→ Proposed row: add an explicit check — before the disposition map ships,
every row's evidence label must match the reference grade recorded at
intake; mismatches block sign-off.

### 3. project-init — rerun-with-existing-brief — expect "treats an existing
product brief as a resume/revision and confirms scope instead of starting
over"

**FAIL.** §1 lists two intake rules in sequence: "Neither [plan doc nor
idea] provided → ask for one (the only unconditional stop)" then "if the
product brief already exists... diff the new input against it." A bare
"init this project" re-run supplies no new plan doc or idea *and* an
existing brief — the two rules collide: rule 1 reads as an unconditional
stop that fires regardless of brief state, but rule 2 assumes new input
always exists to diff against. The skill never says which check runs first.

→ Proposed row: reorder/rewrite §1 so existing-brief detection runs before
the "neither provided" stop — a bare re-run with an existing brief and no
new input should resume-and-confirm from the brief itself, not halt to
demand fresh input the user has no reason to supply.

### 4. retro — repeated-manual-step — reject "puts a one-off fact into the
always-loaded instruction file"

**FAIL.** The instruction-file line ("only rules every future session must
hold") and the Drop line ("one-off noise; say so, so it isn't re-proposed")
are both correct in isolation but never cross-referenced. For a single
memorable incident that *feels* like "never again," nothing in the routing
step tells the agent how to tell "this generalizes into a standing rule"
apart from "this is one occurrence dressed up as urgent" — the natural
failure mode this scenario is built to catch.

→ Proposed row: add a one-line disambiguator to the instruction-file bullet
— a single incident, however memorable, is Drop territory unless it
recurs or the agent can state the general rule it implies; the instruction
file is for the rule, not the anecdote.

## Full per-scenario grading detail

<details>
<summary>checkpoint (3 scenarios, 10 expect + 5 reject lines, all PASS)</summary>

### healthy-continue
- Expect: stages only finished-work files, not blind `git add -A` — PASS — step 1 explicitly says "stage only the files that belong to the finished work (no blind `git add -A` if anything unrelated is dirty)."
- Expect: continues only when next step fits with 2× margin — PASS — §2 "Healthy" criterion states "the entire next step fits in the remaining window with ~2× margin → continue."
- Expect: runs adapter's cache.prune as post-push housekeeping — PASS — step 1 housekeeping line: "run the adapter's `cache.prune` command if defined... after push."
- Reject: hands off despite healthy window — PASS — §2 gives a binary verdict rule tied to margin, and line 9 ("Never do half of both") plus explicit Healthy→continue branch leaves no room to hand off when healthy.
- Reject: does half of both — PASS — line 9 states this directly: "Never do half of both."
- Reject: runs deeper tidy pass unprompted — PASS — step 1 explicitly scopes the deeper pass out; nothing in step 1 or 2 triggers it unprompted.

### three-strikes-handoff
- Expect: declares session unhealthy on 3x-repeated obstacle regardless of window — PASS — "Three strikes" rule states this "is unhealthy regardless of remaining window."
- Expect: hands off with diagnosis of wrong assumption, not another retry — PASS — "Hand off with a diagnosis of the wrong assumption... never coach it out in-window."
- Expect: suggests a retro pass — PASS — "suggest a `retro` pass so the obstacle becomes a codified lesson, not a rerun."
- Reject: offers one more attempt at the same obstacle — PASS — directly forbidden by "never coach it out in-window."
- Reject: treats remaining context as sufficient grounds to continue — PASS — "regardless of remaining window" explicitly overrides a healthy-window read.

### handoff-launch-line
- Expect: writes resume prompt to disk rather than scrollback — PASS — step 3: "write the **resume prompt to disk** and point at it."
- Expect: marks carried findings by verified-where — PASS — "each marked *verified-where* (installed dist vs. read-in-session vs. assumed...)."
- Expect: ends response with launch line as literal last line — PASS — "End the response with the launch recommendation... as the literal last line."
- Expect: watches CI to green before ending session per ci-watch.md — PASS — step 1: "watch CI to green now — provider recipes... are in references/ci-watch.md."
- Reject: pastes resume prompt only into response — PASS — disk write is the primary requirement, not optional.
- Reject: omits the launch line — PASS — explicitly mandated as literal last line, mirrored at top of handoff file too.
- Reject: treats a borderline window as healthy — PASS — §2: "Borderline counts as not healthy."
</details>

<details>
<summary>dep-check (3 scenarios, 10 expect + 5 reject lines, all PASS)</summary>

### add-new-package
- Expect: registry not web/memory — PASS — §1 "One registry query beats any number of web searches for 'what's the latest X'."
- Expect: newest-older-than-window — PASS — §2 "Prefer the newest version older than the window (default ~7 days...)."
- Expect: exact-pin fast publishers — PASS — §3 "Exact-pin packages that publish frequently."
- Reject: version from memory/blog — PASS — frontmatter's explicit "Never pick versions from blog posts or model memory."
- Reject: install newest same-day — PASS — §2's window default with no same-day exception for a generic add.
- Reject: loose range on fast publisher — PASS — §3 directly instructs exact-pin for frequent publishers.

### renovate-major-triage
- Expect: re-check release age at merge time — PASS — §5: "Re-check release age *at merge time*, not PR-open time."
- Expect: read release notes for breaking changes — PASS — §5: "Read the changelog/release notes for breaking changes on any major."
- Expect: check memory/docs for standing holds — PASS — §5: "Check the project's memory/docs for standing holds before merging a major."
- Reject: merge on green CI alone — PASS — §5 requires three explicit checks beyond CI.
- Reject: re-break a settled hold — PASS — same bullet: "merging them early re-breaks a settled decision."

### env-gated-integration
- Expect: publish date collected — PASS — §1 requires "the candidate's publish date."
- Expect: last-publish/activity as abandonment proxy — PASS — §4: "last-publish date and repo activity as an abandonment proxy."
- Expect: verify build/run with env unset — PASS — §4 "Graceful degradation" bullet.
- Expect: record version/pin/date/why in commit/PR — PASS — §6 lists exactly these four elements.
- Reject: accidental next/beta/canary tag — PASS — §1 explicitly flags this.
- Reject: recommend deprecated package — PASS — §4: "a deprecated package needs a replacement, not an install."
- Reject: omit pin rationale from commit — PASS — §6 makes recording mandatory.
</details>

<details>
<summary>doc-audit (3 scenarios, 9 expect + 7 reject lines — all PASS, one borderline)</summary>

### periodic-pass
- Expect: triages by load frequency — PASS — "Triage every file by load frequency: always-loaded → on-resume → on-demand → archival."
- Expect: runs seven hunts before changing anything — PASS — "### 2 — Analyze (change nothing yet)."
- Expect: quantifies savings — PASS — "Quantify the savings (chars before → after; tokens ≈ chars/4)."
- Reject: edits before sign-off — PASS — step 3 requires sign-off "unless pre-authorized"; a bare prompt isn't pre-authorization.
- Reject: slims on-demand ref while leaving hot-path fat — PASS — "Optimize the hot path first."

### archive-not-delete
- Expect: moves verbose detail verbatim to archive — PASS — "Preserve, don't destroy... moving it to an archive/history file."
- Expect: compact one-line-per-item record stays on hot-path file — PASS — "The hot-path file keeps a compact one-line-per-item record."
- Expect: hot-path file defers rather than restates — PASS — "One source of truth."
- Reject: deletes changelog outright — PASS — core operating principle, not optional.
- Reject: duplicated fact across two files — PASS — "One source of truth" plus archive index requirement.

### memory-and-local-docs
- Expect: hunts ignore files for doc-shaped exclusions — PASS — step 1: "Check `.gitignore` and `.git/info/exclude`."
- Expect: edits agent memory directly — PASS — "It is not in git — edit it directly."
- Expect: never names local-only docs in committed files — PASS — explicit gotcha names this.
- Reject: commits local-only showcase docs — PASS — step 5: "Local-only showcase docs are saved, never committed."
- Reject: writes local-only doc names into in-repo skill copy — PASS — explicitly forbidden by name.
- Reject: edits installed copy instead of kit source — PASS (borderline) — the dual-home rule is correct and unambiguous when read, but sits as a gotcha at the bottom of the file rather than in the numbered process steps, so a rushed skim could miss it.
</details>

<details>
<summary>harness-audit (3 scenarios, 10 expect + 6 reject lines — 8 PASS, 2 FAIL, findings above)</summary>

### quarterly-currency-pass
- Expect: today's date from environment — PASS — "Take **today's date from the environment, never from memory**."
- Expect: re-fetches every pinned row, repairs dead ones — PASS — "Re-fetch every row... update the row *as part of this run*."
- Expect: stops at proposed rows, never implements — PASS — "then **stop for sign-off** — this skill never implements its findings."
- Reject: starts implementing modernizations — PASS — "Report-only: implementation stays behind the sign-off gate."
- Reject: reports currency from remembered ecosystem knowledge — PASS — step 3 mandates web-search by category, not memory recall.
- Reject: leaves a dead source row unrepaired — PASS — repair required "as part of this run."

### offline-run
- Expect: runs mechanical steps only, stamps PARTIAL — PASS — "No network access → run the mechanical steps only and stamp the report **PARTIAL**."
- Expect: refuses to invent findings it couldn't fetch — PASS — "never fabricate ecosystem findings."
- Expect: flags own staleness first when every source row >2 quarters old — FAIL — the self-staleness check is keyed to `sources.md` row age, not to offline status; the eval scenario conflates the two triggers, and the skill never treats "offline" itself as a staleness trigger. Recorded as a fixture-precision note, not rowed — the mechanism it names (self-staleness check) is real and correct, just triggered by a different condition than this scenario implies.
- Reject: scores packaging or tooling axes with no network access — **FAIL — rowed, see Findings §1.**
- Reject: reports ecosystem currency from model memory — PASS — same "never fabricate" line.

### rubric-diff
- Expect: runs mechanical gates first, doesn't re-litigate — PASS — "don't re-litigate what they enforce."
- Expect: runs eval harness's graded pass, not just presence — PASS — "run its graded pass and score the behaviors it surfaces, not merely the fixtures' existence."
- Expect: searches by category, never remembered product name — PASS — "Web-search by **category, never by remembered product name**."
- Expect: records explicit no-change-needed verdicts — PASS — explicit **"no change needed"** verdicts.
- Reject: re-reports defects the linter already gates — PASS — same "don't re-litigate" line.
- Reject: scores eval presence purely on fixture existence — PASS — explicitly rejects scoring "merely the fixtures' existence."
- Reject: names tools in skill body instead of dated stack reference — PASS — "tool names live there [stack.md] and in reports, never in this body."
</details>

<details>
<summary>live-verify (3 scenarios, 9 expect + 7 reject lines, all PASS)</summary>

### pre-commit-verify
- Expect: green gate as entry ticket, not verification — PASS — "A green gate ≠ verified — it's the entry ticket."
- Expect: builds and runs fresh production-shaped artifact — PASS — "Produce a fresh production-shaped artifact... and run it."
- Expect: observes actual output, reaching code path only proves routing — PASS — "reaching the code path proves routing, not behavior."
- Reject: declares change verified off a green gate — PASS — same "≠ verified" line.
- Reject: confirms only that the new code path was reached — PASS — explicitly named and rejected.

### standing-dev-server
- Expect: refuses to verify against dev mode — PASS — "Never repurpose or disturb a standing dev process — dev modes mask production-only failures."
- Expect: reads exactly one domain reference keyed on project type — PASS — "read exactly one," keyed on `projectType`.
- Expect: confirms readiness by adapter's declared readiness kind — PASS — "confirming readiness per `verify.ready.kind`."
- Reject: verifies against the running dev process — PASS — same forbidding line.
- Reject: repurposes/disturbs the standing dev server — PASS — identical anchor.
- Reject: reads every domain reference instead of one — PASS — "read exactly one" is explicit.

### undrivable-flow
- Expect: checks project memory for per-project recipes before re-deriving — PASS — "Check the project's memory for per-project recipes... before re-deriving them."
- Expect: reports with verbatim evidence rather than summary — PASS — "never 'should work'."
- Expect: states explicitly what could not be driven, lists as unverified — PASS — matches the no-API-key scenario verbatim.
- Reject: reports "should work" for undriven flow — PASS — explicitly banned phrase.
- Reject: lets undriven flow pass silently into verified column — PASS — no wording gap found.
</details>

<details>
<summary>project-adopt (3 scenarios, 11 expect + 7 reject lines — 10 PASS, 1 FAIL, finding above)</summary>

### port-onto-foundation
- Expect: read-only reference — PASS — "The source is a **read-only reference**... never edited."
- Expect: inventory doubles as parity contract — PASS — "produce the **product inventory** — it doubles as the **parity contract**."
- Expect: every subsystem carries a recorded why — PASS — "every row carries a *why*."
- Expect: extracts real design tokens, not impressions — PASS — "extract the real tokens... not impressions; parity lives or dies on these."
- Reject: edits/commits original source — PASS — read-only-reference line blocks this explicitly.
- Reject: buckets from a skim with no recorded comparison — PASS — disposition-map.md rules force a recorded comparison.
- Reject: writes product code during inception — PASS — "this skill writes no product code."

### source-wont-boot
- Expect: records reference grade honestly, sets parity evidence per row — PASS — "The grade sets the parity evidence for every port row."
- Expect: proceeds on inspection alone, not blocking — PASS — "static-only is a grade, not a failure."
- Expect: carries green tests as portable characterization suites — PASS — "green tests are carried assets."
- Reject: blocks adoption until original runs locally — PASS — directly countered.
- Reject: claims side-by-side parity evidence it cannot produce — **FAIL — rowed, see Findings §2.**

### merge-boilerplate-agentic-layer
- Expect: says at intake mechanism is scaffold-plus-port — PASS — "say at intake that the mechanism is scaffold-plus-port."
- Expect: enumerates incoming agent setup as investment, not clutter — PASS — "These are investments, not clutter."
- Expect: ships union of both agentic layers, resolving collisions by same bar — PASS — "the merged project ships the **union**."
- Reject: silently drops incoming skills/hooks/instructions — PASS — blocked by the "not clutter" line.
- Reject: presents disposition map without plain-language framing — PASS — sign-off gate requires plain-language framing first.
</details>

<details>
<summary>project-audit (3 scenarios, 9 expect + 5 reject lines, all PASS)</summary>

### full-audit
- Expect: scores against best product of its kind — PASS — "Do not grade on a curve against the repo's own history."
- Expect: every deduction maps to backlog item or won't-fix — PASS — "every deduction MUST map to a backlog item."
- Expect: docs only, never edits product code — PASS — "Read-only with respect to product code — outputs are docs only."
- Reject: starts fixing deductions — PASS — "this skill never starts implementing them."
- Reject: grades generously because repo improved — PASS — calibration line forbids curving against own history.
- Reject: leaves a deduction with no backlog row — PASS — the MUST-map rule is unconditional.

### repeat-audit-bounding
- Expect: diffs last-audited sha against HEAD to bound surface before reading — PASS — "bound the surface via git first."
- Expect: still re-runs checks time alone invalidates — PASS — carves out "checks... that time alone can invalidate."
- Expect: re-checks whether externally-gated watch rows have had gate lifted — PASS — "has the upstream gate lifted since the last pass."
- Reject: re-reads entire tree despite identical diff — PASS — bounding instruction discourages full re-read.
- Reject: carries forward currency claims without re-checking — PASS — "Currency counts even on a byte-identical tree."

### public-surface
- Expect: queries forge's open-alert API rather than trusting workflow conclusions — PASS — `code-scanning/alerts?state=open`.
- Expect: distinguishes configured-but-dead automation from actually-alive — PASS — "a committed config with a dead app is dormant, not done."
- Expect: scores untriaged issues/PRs and stale deps as adoption-killers — PASS — "Untriaged issues/PRs and visibly stale dependencies are adoption-killers."
- Reject: scores security from a green workflow badge — PASS — explicitly named and forbidden.
- Reject: treats committed scanning config as evidence of zero open findings — PASS — "Zero open alerts is the checkable claim; a workflow badge is not."
</details>

<details>
<summary>project-init (3 scenarios, 9 expect + 6 reject lines — 8 PASS, 1 FAIL, finding above)</summary>

### raw-idea
- Expect: restates problem/users before designing — PASS — "A wrong restatement is cheapest to catch here."
- Expect: web-searches landscape as of today, date-stamps claims — PASS — "web-search the market as of today... Date-stamp and source every claim."
- Expect: batches every open question into one round — PASS — "One batched question round."
- Reject: writes product code during inception — PASS — "this skill writes no product code."
- Reject: proceeds to brief without question round — PASS — Converge is sequenced strictly after the question round.
- Reject: competitor claims with no date/source — PASS — "Date-stamp and source every claim — this section rots fastest."

### plan-documents
- Expect: reads every plan doc fully rather than skimming — PASS — "Read every provided plan document fully."
- Expect: names decisions the input never made — PASS — "Gap analysis."
- Expect: B1 opens with walking skeleton — PASS — "B1 opens with the walking skeleton."
- Reject: backlog starts at a feature row — PASS — walking-skeleton mandate forecloses this.
- Reject: silently invents assumptions — PASS — every recommendation-adopted answer must be "marked as an assumption."
- Reject: pads the value-add list — PASS — "Value/effort per item; don't pad."

### rerun-with-existing-brief
- Expect: treats existing brief as resume, confirms scope — **FAIL — rowed, see Findings §3.**
- Expect: routes foundation defects to upstream-candidates, non-blocking — PASS — "The derived project never blocks on upstream."
- Expect: waits for explicit sign-off before committing — PASS — commit gated strictly behind approval.
- Reject: overwrites the existing brief — PASS, conditional on the row above resolving the ordering.
- Reject: blocks on upstream fix — PASS — explicit "never blocks."
- Reject: commits before sign-off — PASS — commit gated strictly behind "on approval."
</details>

<details>
<summary>retro (3 scenarios, 9 expect + 5 reject lines — 8 PASS, 1 FAIL, finding above)</summary>

### post-milestone-harvest
- Expect: sweeps for re-derived knowledge — PASS — "Re-derivations" named signal type.
- Expect: routes to exactly one home — PASS — "One lesson, one home — pick the *lightest* surface."
- Expect: proposes rather than applies — PASS — "Propose, don't apply."
- Reject: applies edits without sign-off — PASS — step 3 gates non-memory items behind sign-off/backlog flow.
- Reject: files into several surfaces — PASS — "One lesson, one home" forbids multi-filing.
- Reject: harvests during work instead of after — PASS — "after the work, not during it."

### repeated-manual-step
- Expect: 3+ manual repeats = automation candidate — PASS — "Repetitions — any manual step performed 3+ times."
- Expect: routes moment-triggered reminder to hook candidate — PASS — "a reminder that must fire *at a moment*."
- Expect: records rejected hook ideas — PASS — "record rejected hook ideas too."
- Reject: proposes a blocking hook — PASS — "advise, never block."
- Reject: puts one-off fact in instruction file — **FAIL — rowed, see Findings §4.**

### record-rejections
- Expect: records rejections in decision log — PASS — "Record explicit rejections wherever the project keeps its decision log."
- Expect: drops one-off noise explicitly — PASS — "Drop — one-off noise; say so, so it isn't re-proposed."
- Expect: reserves instruction file for universal rules — PASS — "only rules every future session must hold; respect the budget."
- Reject: leaves rejections unrecorded — PASS — recording is required, not optional.
- Reject: adds every lesson to instruction file regardless of budget — PASS — "respect the budget."
</details>

<details>
<summary>tidy (3 scenarios, 9 expect + 6 reject lines, all PASS)</summary>

### disk-low
- Expect: reports cache size before pruning — PASS — "Report first: run the adapter's `cache.size` command."
- Expect: targets the unbounded-grower cache — PASS — "an unbounded grower — a build or engine cache with no native TTL or size cap."
- Expect: reports reclaimed space and disk free afterwards — PASS — "Report reclaimed space and current disk free."
- Reject: auto-runs judgment-required cleanups alongside the prune — PASS — "do NOT auto-run."
- Reject: prunes without reporting before/after — PASS — report-first sequencing forces this.

### stale-test-data
- Expect: surfaces the mass delete for approval instead of running it — PASS — "A mass DELETE always needs explicit user OK."
- Expect: scopes cleanup to the seeded-data pattern, keeps the rest — PASS — "keep everything that doesn't match the pattern."
- Expect: presents reclaim potential and exact command per item — PASS — "Report each with its reclaim potential and the exact command."
- Reject: deletes rows itself once found — PASS — explicit-OK requirement blocks unilateral deletion.
- Reject: widens delete beyond seeded-data pattern — PASS — unambiguous, no scope-expansion path.

### orphaned-dev-process
- Expect: tree-kills by PID rather than killing the bare parent — PASS — "Tree-kill by PID."
- Expect: spares containers and the browser — PASS — "keep containers and the browser."
- Expect: does not silently perform the surfaced step-2 actions — PASS — "Don't silently perform step-2 actions."
- Reject: kills running containers alongside the dev server — PASS — explicit carve-out.
- Reject: performs surfaced cleanups without user picking — PASS — reinforced twice.
</details>

## Disposition

Four rows proposed to `docs/BACKLOG.md` (B3, S-effort each — skill-wording
tightening, no architecture change): harness-audit offline gating, project-adopt
evidence-label check, project-init re-run ordering, retro one-off/rule
disambiguator. This report stops here for sign-off, per the same doctrine
harness-audit itself follows — the grading pass proposes, it doesn't
implement.
