# ai-dev-kit — agent onboarding

Rules an agent must hold that the tree doesn't self-evidence; everything else is
pointed at, not restated here.

- **Source vs install:** edit `skills/` and `hooks/`, never the `.claude/`
  copies — the tracked `.claude/` is the kit's own dogfood install. After any
  behavior change, re-run
  `node install.mjs --adapter adapters/ai-dev-kit.json --hooks` (add `--global`
  when a dual-home skill changed) or CI's root `--check` fails.
- **Behavior change ⇒ version bump:** the kit version plus each touched skill's
  version in `manifest.json`, `VERSION`, the `CHANGELOG.md` top entry, both
  deck stamps, and `.claude-plugin/plugin.json` move together — CI gates the
  six sites.
- **Program discipline:** forward-only banded backlog (`docs/BACKLOG.md`); every
  row goes plan → explicit sign-off → build; a test that claims to catch a bug
  is shown failing first; CHANGELOG entries end with a Verification paragraph.
- **Hooks advise by default:** an advisory handler exits 0 and injects context;
  the agent decides. Blocking (exit 2) exists only in the enforcement handlers,
  each inert without its adapter `enforcement` key. Exec-form wiring
  (`command: "node"` + one anchored `args` entry) is a smoke-enforced invariant.
- **Zero dependencies:** pure Node ≥ 22 — no package.json, no npm packages, no
  shell-specific scripts.
- **Never rename a skill directory** without a migration plan — stale-prune
  covers manifest-listed names only; a silent rename orphans every consumer's
  installed copy.
- **Gate before commit:** run the adapter `gate` array
  (`adapters/ai-dev-kit.json`) and keep skill bodies generic — project facts go
  in an adapter or project memory, never hardcoded in a skill.
- **A release commit is self-contained:** version bump, self-install, and
  fixture/doc updates land in **one** commit — the pre-tag gate checks only
  the sha it is pointed at (why: `README.md` → Rules → Versioning).
- **One release commit per push,** and let CI go green on it before the
  next — `release.yml` tags against `VERSION` as of the pushed sha, so a
  second bump in the same push silently skips the first release.

Pointers: `README.md` (status doc · install · release ritual) ·
`CONTRIBUTING.md` (local suite · ground rules) · `docs/PLAYBOOK.md` (the
why-layer) · `manifest.json` (machine index: versions · pipeline · hook
registry · decision log) · `docs/BACKLOG.md` (pending work).
