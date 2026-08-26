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
- **Never rename a skill directory** without a migration plan — stale-prune only
  covers manifest-listed names; a silent rename orphans consumers' installed
  copies forever.
- **Gate before commit:** run the adapter `gate` array
  (`adapters/ai-dev-kit.json`) and keep skill bodies generic — project facts go
  in an adapter or project memory, never hardcoded in a skill.
- **A release commit is self-contained:** the version bump, self-install
  (`node install.mjs --adapter adapters/ai-dev-kit.json --hooks`), and any
  fixture/doc updates it requires land in **one** commit — never split across
  a sequence. v0.23.0 was tagged on a red sha because the self-install and a
  fixture fix landed in separate follow-up commits; `README.md`'s pre-tag
  `check-release-ready.mjs` gate only checks the sha you point it at, so a
  split release can still tag green on an intermediate broken commit if you
  point it at the wrong one.

Pointers: `README.md` (status doc · install · release ritual) ·
`CONTRIBUTING.md` (local suite · ground rules) · `docs/PLAYBOOK.md` (the
why-layer) · `manifest.json` (machine index: versions · pipeline · hook
registry · decision log) · `docs/BACKLOG.md` (pending work).
