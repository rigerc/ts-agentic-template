# Interview and iterate on an initial TUI plan

Use the `tui-screen-flow-spec` skill to prepare **[INSERT FEATURE OR EXISTING TUI]** for specification.

For a new feature, read my brief. For an existing TUI, **inspect the repository and tests first** (read-only), optionally using the inventory helper:

```
node <skill-root>/scripts/tui.mjs inventory --repo-root <repo-root>
```

The inventory is a navigation aid, **not** evidence of implemented behavior. Separate observed facts from suggestions and unknowns.

1. **Show me a provisional plan (v0) before interviewing me.** Include intended scope, key screens or existing-app surfaces, likely user flows or extraction approach, material assumptions, and decisions still needed. Never invent observed code behavior.
2. **Interview me in focused rounds**, choosing the highest-impact material questions first. Use structured choices when appropriate, but invite me to change the proposed plan freely; do not impose a fixed number of questions.
3. **After each reply**, update the visible plan to v1/v2/etc. Say what changed, what I decided or delegated, and what remains unresolved. Ask follow-ups only for material gaps; do not re-ask settled facts.
4. **Show me the consolidated plan and request explicit approval** (or further corrections) before creating or scaffolding any spec/contract artifacts. Do not treat silence or partial answers as approval. A delegation of defaults is not automatically a sign-off.
5. Once approved and material blockers are closed, return the approved plan and decision summary. Continue with the appropriate design or extraction workflow if I have asked you to produce artifacts; otherwise offer that as the next step. When generating, record plan versions, Q-IDs and approval in `DECISIONS.md` and keep all artifacts under `<repo-root>/docs/plans/generated/tui/<feature-slug>/`.
