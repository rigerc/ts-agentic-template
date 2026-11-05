# fix-anti-slop (agent skill)

A standalone, portable Agent Skills directory for **remediating** warnings and errors from [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop). This complements upstream's `install-anti-slop` skill; it does **not** vendor or install the plugin.

## Install

Copy the entire `fix-anti-slop/` directory into the skills directory used by your coding agent. Examples:

- Claude Code (project scope): `.claude/skills/fix-anti-slop/`
- Codex (repository scope): `.agents/skills/fix-anti-slop/`

The `SKILL.md` frontmatter follows the Agent Skills format. Restart/reload your agent if it does not discover newly copied skills immediately.

## Use

In a repository with anti-slop already configured, ask your agent:

> Use fix-anti-slop to fix all anti-slop warnings and errors. Keep rules enabled, preserve behavior, run typecheck/tests, and report anything unresolved.

The skill makes the agent discover your real lint/configuration and source files; this downloaded folder does not itself lint or modify a project. To configure anti-slop first, use `npx skills add dmmulroy/anti-slop --skill install-anti-slop` per upstream documentation.

## Optional diagnostics tool

Oxlint has `--format=agent` for direct agent-friendly output and `--format=json` for grouping/comparisons. From the **target repo**, for example:

```bash
pnpm exec oxlint --format=json src > /tmp/anti-slop-before.json
python3 /path/to/fix-anti-slop/scripts/triage.py /tmp/anti-slop-before.json
```

Nonzero lint status with valid JSON is normal. Do not treat failed configuration or malformed output as success. To compare after fixing:

```bash
python3 /path/to/fix-anti-slop/scripts/triage.py /tmp/anti-slop-after.json --baseline /tmp/anti-slop-before.json
```

Use `--include-all` to print **other** Oxlint rules too. The helper requires Python 3.9+ (standard library only) and never executes lint or changes code.

## Contents

- `SKILL.md`: trigger and safe agent workflow.
- `references/rule-fixes.md`: fix strategies and warnings for all documented generic, companion, and optional Effect rules.
- `references/examples.md`: semantic before/after examples.
- `scripts/triage.py`: Oxlint JSON grouping and baseline comparison.
- `tests/test_triage.py`: parser and comparison tests.

## Provenance

Written as an independent remediation skill using upstream's public README and the Oxlint CLI/output format docs as source references. It is **not** an official anti-slop skill and has no bundled copy of upstream source code.
