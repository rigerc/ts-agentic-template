# Offline contract viewer and automation

`node scripts/generate-html.mjs --repo-root <root> --feature <slug>` reads `manifest.json` and `contracts.json` (required), plus optional `screens.json`, `machine.json`, `evidence.json`, and `validation-report.json`. It produces `contracts-viewer.html` in that feature's fixed output directory.

`node scripts/tui.mjs build --repo-root <root> --feature <slug>` first runs the bundled Python validator with `--write-report`, then renders the viewer. It renders draft/invalid artifacts too, for inspection; add `--strict` for CI enforcement. `--all` iterates feature folders; `watch --all` checks canonical JSON for changes roughly once per second, rerunning validation and rendering. No application source is executed by these tools.

Interactive viewer areas: overview, screens with expandable nested layouts/focus/keybindings, flows with clickable state graph/transition details, UI components, state fields/invariants, events, commands, data, validation rules, source evidence. Search filters by content, references link among categories, theme toggle, copy JSON, and export embedded JSON. Viewer HTML is static and fully self-contained (no CDNs, fonts or network fetches).

The viewer is **documentation**, not an executable TUI prototype or simulator. Source evidence includes paths/line numbers but cannot fetch application source. Missing optional screen/flow files are supported in contracts-only mode. JSON string payloads are script-safe escaped and rendered via text nodes; never change implementation to insert raw source strings into `innerHTML`.

Scaffolding is a **draft automation only**: first present a provisional plan in conversation, interview and revise it with the user, and obtain explicit plan approval and resolution/delegation of material questions **before** creating feature output files. `scaffold` does not extract contracts or answer open questions and must not be treated as design completion. The agent must replace placeholders, maintain `manifest.files`, synchronize Markdown, and respect readiness/provenance requirements. The generator adds the output HTML to `manifest.files` if absent.

Output path is rigidly fixed under `<repo-root>/docs/plans/generated/tui/<slug>/`. The CLI accepts only a basename for the HTML output, never an arbitrary path. This prevents easy accidental output outside the repository's generated design tree.


## Termcn-backed component schemas and semantic mockups

For full-mode features, import optional termcn registry item schemas using `node scripts/tui.mjs termcn-import ...`, then run `node scripts/tui.mjs build ...` to emit a complete state storyboard and per-state SVG/TXT terminal mockups. Files `design.json` and `scenarios.json` are optional and do not change canonical behavior. Imported schema callback props are metadata only; complex TypeScript must be reported as unresolved. The mockup renderer is an approximation, never a live Ink/OpenTUI capture. Consult README for CLI usage, fixture format, and limitations.


### Flexible mockup configuration (1.5.0)

For additional layouts and comparisons, set `design.json.schema_version` to `1.1.0` and add `preview.viewports`, `preview.layouts`, `preview.styles`, and/or `preview.outputs`. Add `scenarios.json.schema_version: "1.1.0"` and `variants`/`stateVariants` for named sample scenarios. Nodes are targeted by `<screen-id>/<node-id>` and all presentation overrides are validated against canonical IDs; this must never rewrite canonical behavior. `mockup --viewport NAME[,NAME] --scenario NAME[,NAME] --outputs txt,svg,ansi,html` narrows the matrix. A named-viewport matrix is rendered automatically if configured and no explicit `--cols` or `--rows` override was passed. Built-in semantic component adapters and a user-extensible adapter registry are available; the shared terminal-cell canvas is used for flexible TXT, ANSI, SVG, and HTML previews. The original line renderer remains in place for legacy designs so v1.4 text output stays byte-for-byte compatible. See README's configuration examples and `assets/templates/*flex.example.json`.
