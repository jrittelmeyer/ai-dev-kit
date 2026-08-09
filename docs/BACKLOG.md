# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Every row enters plan → sign-off → build.

Source: [PROJECT_AUDIT_2026-08-09-post-B3](archive/PROJECT_AUDIT_2026-08-09-post-B3.md)
(aggregate 96.9/100, re-scored after B1–B3 shipped as 0.9.0 → 0.11.0; baseline
[PROJECT_AUDIT_2026-08-09](archive/PROJECT_AUDIT_2026-08-09.md), 90.4/100).

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 17 | hooks/verify | Fresh-session live-fire check: one matching event in a new kit session must show exec-form hook injection; record verified-where. Silent again ⇒ harness investigation item (kit code exonerated by smoke) | Hooks +2 | S |
| B3 | 18 | testing | Close the two baseline-named smoke gaps: dep-check `npm install <pkg>` variant; live-verify `git -c k=v commit` | Testing +2 | S |
| B3 | 19 | installer/adapter | Warn-only adapter re-validation on `--check` (schema advisory, exit code unchanged — user-owned config stays unpoliced) | Adapter +2 | S |
| B3 | 20 | docs/security | Consumer trust note for `--hooks` in README/SECURITY: what installing hooks executes in your sessions (advise-only, pure Node, no network, drift-guarded) | Security +1, Docs +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand (gate re-confirmed shut 2026-08-09: zero issues/PRs) | Public +1 | M |

Watch (externally gated, re-check each audit): harness-side git-root resolution
for `CLAUDE_PROJECT_DIR` when sessions launch in a subdirectory (kit-side share
closed by B1-1). Re-checked 2026-08-09: docs define the placeholder only as
"Project root," subdirectory behavior unspecified, no related changelog entry —
gate not lifted.
