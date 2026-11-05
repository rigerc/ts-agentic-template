# Extract contracts from an existing TUI

Use the `tui-screen-flow-spec` skill to describe **observed current implementation behavior** of **[INSERT APP/SURFACE]**.

1. Identify repository root. Optionally run `node <skill-root>/scripts/tui.mjs inventory --repo-root <repo-root>` for read-only candidate source locations (not implementation evidence). Inspect application code **read-only**: entrypoints, rendering, views, focus and shortcuts, handlers, state, IO, data, validation and tests. Never run untrusted project code without my permission.
2. Build an evidence inventory with repository-relative paths and precise line ranges. Separate observed code from test assertions, documentation, inferences, and proposals.
3. **Show me an initial evidence-grounded extraction plan (v0) before asking questions**: current surfaces, proposed boundary, contracts-only scope, known gaps and provenance coverage. Avoid inventing implementation behavior.
4. **Interview me** about material unresolved decisions after inspection. Revise and re-display the extraction plan after every answer, noting what changed, and ask follow-ups until blockers are resolved/delegated. Do not re-ask facts already established by source.
5. Ask me for **explicit approval** of the consolidated extraction plan; if I request a change, repeat the interview/revision loop. Do not create output files beforehand.
6. Create `contracts-only` via `node <skill-root>/scripts/tui.mjs scaffold --repo-root <repo-root> --feature <slug> --mode existing` only after approval.
7. Author UI/state/events/commands/data/validation `contracts.json`, human contract documentation, `evidence.json`, `EVIDENCE.md`, and a `DECISIONS.md` log of interview rounds and approval. Ensure evidence covers each material entity; mark inferred/proposed behavior and readiness appropriately.
8. Run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict`. Inspect any drift or missing provenance errors; repair them or leave draft with explicitly noted open questions.

Do not generate screen trees or state machines unless I request full reconstruction. Store artifacts ONLY under `<repo-root>/docs/plans/generated/tui/<slug>/`.
