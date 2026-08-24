# Security policy

## Supported versions

The latest release (highest `v*` tag) is supported. The kit is static skill
files plus a zero-dependency Node installer — no server, no network code, no
package dependency surface; hook handlers are advise-only stdin→stdout
scripts that never block the agent.

## What `--hooks` executes in your sessions

`install.mjs --hooks` wires five hook entries into `.claude/settings.json`;
matching events then run the kit's handlers out of
`.claude/hooks/ai-dev-kit/`. Their contract, auditable in under 80 lines each
(kit source `hooks/`): **advise-only** — they emit an `additionalContext`
reminder or exit 0 silently, never block (exit 2 is never used), spawn no
processes, make no network calls, and read nothing beyond the event on stdin
plus `.claude/ai-dev-kit.config.json`. Pure Node stdlib, zero dependencies,
a 10-second timeout in the wiring, malformed events exit 0. `install.mjs
--check` drift-guards the installed copies byte-for-byte against kit source,
so a tampered or stale handler surfaces as DRIFT.

## Reporting a vulnerability

Use GitHub private vulnerability reporting:
<https://github.com/jrittelmeyer/ai-dev-kit/security/advisories/new> — include
repro steps. Expect an acknowledgment within a week; fixes ship as a normal
versioned release with a CHANGELOG entry.
