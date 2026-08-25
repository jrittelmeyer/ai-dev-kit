# Optional asset — contrarian (plan-gate dissent)

A standing-authorized devil's-advocate subagent plus an `ExitPlanMode` nudge
that reminds the main agent to run it before plan sign-off. Consumer-proven in
next-web-boilerplate and civicmatch before landing here.

**Not installed by `install.mjs`** — these files are templates you copy once
and then own (edit freely; `--check` never sees them):

1. Copy `contrarian.md` → `<project>/.claude/agents/contrarian.md`.
2. Copy `contrarian-nudge.mjs` → `<project>/.claude/hooks/contrarian-nudge.mjs`
   — the repo-owned hooks dir, **not** `.claude/hooks/ai-dev-kit/` (the
   installer prunes that dir and strips settings entries carrying its path).
3. Wire the nudge in `<project>/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/contrarian-nudge.mjs"],
            "timeout": 10,
            "statusMessage": "contrarian nudge"
          }
        ]
      }
    ]
  }
}
```

4. Optionally add a `contrarian` policy section to the project's CLAUDE.md —
   always/skip trigger lists tuned to the repo (e.g. "template-surface changes
   are an ALWAYS trigger"). The nudge defers to that policy when present.

Anti-anchoring protocol (from the consumer originals): hand contrarian the
plan **file**, never your summary of it; require at least one finding it
verified itself; hand over before the outcome log exists so it critiques the
plan, not the result.
