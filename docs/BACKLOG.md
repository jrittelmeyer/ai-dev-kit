# ai-dev-kit backlog

Forward-only and banded: **B1** do-next → **B4** pivot-only. Rows carry no
shipped-item history (the CHANGELOG owns that) and no duplicated detail — the
*why* and the named deductions behind every row live in the originating audit
report. Completing B1–B3 recovers the aggregate to ~100 as scored.

Source: [PROJECT_AUDIT_2026-08-09](archive/PROJECT_AUDIT_2026-08-09.md)
(aggregate 90.4/100). Every row still enters plan → sign-off → build.

| Band | # | Area | Item | Lifts | Effort |
|------|---|------|------|-------|--------|
| B1 | 1 | hooks | Anchor context-guard's adapter-config read on `CLAUDE_PROJECT_DIR`; add config-override smoke case | Hooks +5, CI +1 | S |
| B1 | 2 | ci | Version-consistency gate: VERSION == manifest == CHANGELOG top == deck stamps | CI +3, Versioning +3, Docs +1 | S |
| B1 | 3 | installer | Zero-dep adapter schema validation at install + reference adapter validated in CI; restore deck's "schema-validated" | Adapter +5, Installer +2, CI +1 | M |
| B1 | 4 | ci | Assert install idempotency for real ("0 file(s) written" on run 2) | CI +2, Installer +1 | S |
| B1 | 5 | release | Tag releases (backfill 0.8.0) + GitHub Releases from changelog | Versioning +3, Public +1 | S |
| B2 | 6 | ci | Settings-merge regression tests from pre-populated settings.json | CI +3, Installer +3 | M |
| B2 | 7 | installer | Stale-leftover detection/prune in kit-owned dirs | Installer +4 | M |
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
