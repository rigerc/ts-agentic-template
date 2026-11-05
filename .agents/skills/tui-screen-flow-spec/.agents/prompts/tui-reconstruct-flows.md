# Reconstruct existing TUI screens and state transitions

Use `tui-screen-flow-spec` for the existing application **[INSERT APPLICATION OR FEATURE]** with mode `existing-full`.

1. Inspect code and tests read-only; trace screens, component trees, keyboard/focus behavior, event dispatch, state transitions, IO effects, failure and restart paths. Distinguish reliable code evidence from inferred state boundaries. If runtime observation is necessary, request permission rather than executing project code silently.
2. **Before interviewing me**, show a provisional evidence-grounded **v0 reconstruction plan**: inspected surfaces, proposed screen/state scope, gaps, and where behavior is inferred rather than observed.
3. Interview me about material uncertainties and scope choices. **After each response**, show a revised plan (v1, v2, …) with a concise delta and further questions if necessary. Never replace missing evidence with fabricated observations.
4. Present the consolidated plan and request my **explicit approval before scaffolding**; revise again if I ask for changes. Material blockers must be resolved, delegated or excluded before proceeding.
5. Only after approval, scaffold with `node <skill-root>/scripts/tui.mjs scaffold --repo-root <repo-root> --feature <slug> --mode existing-full`. Author `screens.json`, `machine.json`, `contracts.json` and source evidence in `evidence.json`, as well as matching Markdown specs/flows/contracts/decisions. Record plan iterations and approval in `DECISIONS.md`. Preserve stable IDs and accurately label reconstructed versus observed information. Keep inferred behavior in draft.
6. Run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict` and review the resulting `contracts-viewer.html` state diagram and screen trees. Keep all generated artifacts inside `docs/plans/generated/tui/<slug>/` at the repository root.
