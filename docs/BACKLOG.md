# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Completing the remaining B2–B3 rows recovers the aggregate to ~100 as
scored (B1 shipped in 0.9.0).

Source: [PROJECT_AUDIT_2026-08-09](archive/PROJECT_AUDIT_2026-08-09.md)
(aggregate 90.4/100). Every row still enters plan → sign-off → build.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B2 | 8 | security | dependabot.yml (github-actions) + bump pinned actions to current majors | Security +4 | S |
| B2 | 9 | docs/ci | Declare Node floor in README; add floor version to CI matrix | Docs +1, CI +1 | S |
| B2 | 10 | repo | Dogfood adapter (`adapters/ai-dev-kit.json`) + self-install | Public +3 | S |
| B2 | 11 | governance | CONTRIBUTING.md + SECURITY.md + repo topics + CI badge | Public +4, Security +2, Docs/CI +2 | S |
| B3 | 12 | hooks | Handlers tolerate malformed stdin (silent exit 0) + smoke case | Hooks +1 | S |
| B3 | 13 | installer | Reject unknown flags; `--help` | Installer +3 | S |
| B3 | 14 | hooks/installer | Exec-form hook entries (marker keys on `args` first) | Hooks +1, Installer +1 | M |
| B3 | 15 | hooks | context-guard match precision (path boundary; case) | Hooks +1 | S |
| B4 | 16 | packaging | npm/`npx` packaging — opens on consumer demand | Public +1 | M |

Watch (externally gated, re-check each audit): harness-side git-root resolution
for `CLAUDE_PROJECT_DIR` when sessions launch in a subdirectory (kit-side share
closed by B1-1).
