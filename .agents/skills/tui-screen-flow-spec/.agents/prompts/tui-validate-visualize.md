# Validate and visualize generated TUI contracts

Use `tui-screen-flow-spec` for **[INSERT FEATURE SLUG OR ALL]**.

Read the canonical contracts and manifest, then run:

```
node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict
```

For all features, substitute `--all` for `--feature <slug>`. For automatic live regeneration while editing canonical JSON, use:

```
node <skill-root>/scripts/tui.mjs watch --repo-root <repo-root> --all
```

Review the validator's error/warning report, source provenance and drift status, HTML viewer's screen trees, state graph and contract links. If content requires product decisions or ambiguities, **present a proposed change plan**, interview the user, visibly revise it based on feedback, and obtain approval before editing semantic contracts. Never change behavior speculatively. Correct stale IDs and Markdown/JSON mismatches only when evidence supports them. Return feature-relative output paths, readiness, errors/warnings, and location of `contracts-viewer.html`. No outputs outside `docs/plans/generated/tui/`.
