# Design TUI screens and flows (greenfield)

Use the `tui-screen-flow-spec` skill for this feature: **[INSERT FEATURE BRIEF]**.

1. Read `SKILL.md` and `references/elicitation.md`. Resolve the Git repository root (or ask for it before writing files).
2. **Present an initial provisional plan (v0) before asking me design questions**: scope, likely screens, entry/exit and navigation, key interactions, states/IO and terminal-size assumptions. Identify undecided choices rather than making up product rules.
3. **Interview me in focused rounds.** After each reply show a **revised plan (v1, v2, …)** and the changes from the previous version. Ask only remaining material questions (including new gaps introduced by my feedback). Use structured questions when the host supports them; never assume I approved defaults.
4. Show the consolidated plan and ask me to **approve or request changes**. Iterate again if I change it. **Do not scaffold or write artifacts until I explicitly say proceed and all blockers are resolved/delegated.**
5. After approval, choose a stable feature slug. Scaffold with `node <skill-root>/scripts/tui.mjs scaffold --repo-root <repo-root> --feature <slug> --mode greenfield`.
6. Replace every placeholder and generate structured screen trees, event-driven state machines, and UI/state/events/commands/data/validation contracts. Synchronize Markdown and JSON; log plan iterations, answers, assumptions, and approval in `DECISIONS.md`.
7. Run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict`, fix errors, and confirm `contracts-viewer.html` renders.
8. Report actual generated files, decisions and validation result; do not claim that any TUI application was implemented.

All generated files MUST be inside `<repo-root>/docs/plans/generated/tui/<slug>/`.
