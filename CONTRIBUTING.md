# Contributing

Small, focused PRs are welcome. The repo values zero-dependency code (pure
Node ≥ 22, no npm packages) and token-lean docs.

## Ground rules

- **Edit kit source, never installed copies.** Skills live in `skills/`, hook
  handlers in `hooks/`. `.claude/` here is the kit's own dogfood install —
  regenerate it with
  `node install.mjs --adapter adapters/ai-dev-kit.json --hooks` instead of
  editing it (CI's self-install check catches drift either way).
- **Skill bodies stay generic.** Project facts belong in an adapter
  (`adapters/*.json`, schema: `adapters/project.schema.json`), never hardcoded
  in a skill.
- **Behavior change ⇒ version bump.** Bump `VERSION`, `manifest.json` (kit
  version plus any touched skill's version), the `CHANGELOG.md` top entry, and
  both deck stamps together — CI's version gate fails when the five sites
  disagree.
- **A test that claims to catch a bug** should be shown failing against the
  pre-fix code (note it in the PR description).

## Before you push

The full suite, from the repo root (pure Node, nothing to install):

```bash
node install.mjs --adapter adapters/next-web-boilerplate.json --dest /tmp/kit-scratch --hooks
node install.mjs --adapter adapters/next-web-boilerplate.json --dest /tmp/kit-scratch --hooks   # must print "0 file(s) written"
node install.mjs --check --dest /tmp/kit-scratch
node .github/smoke-hooks.mjs
node .github/smoke-installer.mjs
node .github/check-version.mjs
node install.mjs --check
```

CI runs the same suite on ubuntu + windows × Node 22 + 24; the block above
also runs unchanged from PowerShell (Node resolves `/tmp/kit-scratch` against
the drive root).

Hand-testing a handler? Don't pipe JSON into it from PowerShell 5.1 — the pipe
BOM-prefixes stdin, `JSON.parse` fails, and stdin tolerance turns that into a
silent exit 0 (a false "silent" verdict). Use the smoke suite, or pipe from
bash / `node -e`, which write clean stdin.
