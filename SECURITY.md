# Security policy

## Supported versions

The latest release (highest `v*` tag) is supported. The kit is static skill
files plus a zero-dependency Node installer — no server, no network code, no
package dependency surface; hook handlers are advise-only stdin→stdout
scripts that never block the agent.

## Reporting a vulnerability

Use GitHub private vulnerability reporting:
<https://github.com/jrittelmeyer/ai-dev-kit/security/advisories/new> — include
repro steps. Expect an acknowledgment within a week; fixes ship as a normal
versioned release with a CHANGELOG entry.
