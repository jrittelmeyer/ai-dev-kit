# Consumer permissions guidance

The kit deliberately ships **no permissions** — an installer silently merging
allow-rules into a project's `settings.json` would be a security decision made
on the user's behalf, which breaks the same trust contract that keeps hooks
advisory (see [SECURITY.md](../SECURITY.md)). This page is the copy-paste
starter instead; paste what fits into the project's `.claude/settings.json`
(shared) or `.claude/settings.local.json` (per-machine), and let the harness's
permission prompts add the rest organically.

## Doctrine

- **Least privilege, then convenience.** Start narrow; widen a rule only
  after the prompt for it has become routine. Broad write/exec grants
  (`Bash(*)`, unscoped `rm`) stay out of shared settings entirely.
- **Reads are cheap, writes are scoped, destructive is prompted.** Read-only
  inspection commands belong in the allowlist; anything that mutates state
  beyond the worktree earns a prompt.
- **Shared vs local:** rules every collaborator wants (the gate, the test
  runner, `git status`-class reads) go in tracked `settings.json`;
  machine-specific paths and one-offs go in `settings.local.json` — and prune
  it occasionally: dead entries accrete fast.
- **Review what accretes.** A permissions list is config drift like any
  other; sweep it at audit time (harness-audit scores it).

## Starter allowlist (adapt commands to the project)

```json
{
  "permissions": {
    "allow": [
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push)",
      "Bash(node install.mjs --check*)",
      "Bash(npm run lint*)",
      "Bash(npm run test*)",
      "Bash(npm run build*)"
    ]
  }
}
```

Swap the three script rules for the project's real gate commands (the adapter
`gate` array is the source of truth — e.g. `cargo fmt --check`,
`godot --headless --check-only`, `pytest`). Add the forge CLI's read-only
verbs (`gh pr list`, `gh run view *`) when CI-watching is routine.

## What NOT to allowlist

- Package installs (`npm add`, `cargo add`, `pip install`) — the prompt is
  the moment dep-check runs.
- Force pushes, history rewrites, `rm -rf`, database-destructive commands —
  the prompt is the safety net.
- Anything carrying secrets in argv (tokens, connection strings) — restate
  via env or config instead.
