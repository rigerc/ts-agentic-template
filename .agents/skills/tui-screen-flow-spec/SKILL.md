---
name: tui-screen-flow-spec
description: Design or document framework-agnostic terminal user interfaces (TUIs). Generate source-backed UI, state, event, command, data, and validation contracts from existing applications, or plan new TUI screens with full state-machine flows. Present a provisional plan first, interview the user in iterative rounds, obtain plan approval before generating, then validate contracts and create a standalone interactive HTML contract explorer. Store design artifacts under docs/plans/generated/tui at the repository root. Use for TUI design, audits, reverse-engineering, contract extraction, and handoffs.
compatibility: Agent Skills agent with filesystem access; Node.js 18+ to generate HTML and orchestrate workflows; Python 3.9+ to validate. No third-party dependencies.
metadata:
  version: "1.5.0"
  output-version: "1.0.0"
---

# TUI screen and flow specification

Produce *design specifications and implementation contracts*, **not application code**. Support two modes: **greenfield design** (from a feature brief) and **existing-application contract extraction** (from source code and tests). Work with humans and AI agents. Be independent of Ratatui, Bubble Tea, Textual, Ink, and other specific frameworks.

## Hard requirements

1. **Plan → interview → iterate → approve:** for greenfield, read the brief; for existing applications, **inspect the repository first** and distinguish observed behavior from missing or contradictory behavior. **Before asking design questions**, present a concise, clearly provisional initial plan **in the conversation**, including scope, proposed screens/flows (or extraction scope for existing apps), known constraints, assumptions, and open decisions. Then interview the user with focused, material questions; incorporate each round of feedback into a **revised plan**, explicitly showing what changed, and ask follow-ups until blockers are answered or delegated. Never treat the first plan as approved or silently invent rules. Prefer the host's native structured-question/AskTool capability when available; otherwise ask in chat. See [elicitation](references/elicitation.md).
2. **Approval and blocker gate:** before writing or scaffolding generated spec/contract artifacts, show the consolidated plan and request **explicit user approval to proceed** (e.g. “approved”, “proceed”, or equivalent). Approval does not excuse unanswered material semantics: resolve them, obtain explicit delegation, or reduce scope first. If the user changes the plan, revise it and interview again; do not treat silence or a partial answer as approval. Record plan iterations, decisions, delegation, and approval in `DECISIONS.md` after generation begins. If the user explicitly asks to skip the interview, honor that only to the extent material decisions are specified or delegated; still summarize the proposed plan and request a go-ahead before generating.
3. **No unresolved blockers:** never mark a feature `ready` while a decision that changes a screen, state, transition, contract, or validation rule is unresolved. If answers remain outstanding, continue asking; do not pretend the artifacts are complete. Nonblocking delegated choices must be documented as assumptions.
4. **Fixed artifact location:** write *every generated design artifact* beneath `<repo-root>/docs/plans/generated/tui/<feature-slug>/`. Do not write design output in a skill directory, `src/`, ad hoc `plans/`, or a second output path. The skill's bundled templates and scripts are *installation assets*, not generated artifacts. Use a stable lowercase kebab-case slug.
5. **Resolve the repository root:** prefer `git rev-parse --show-toplevel`. If Git is unavailable, use an explicitly identified repo root; never assume the current directory is the root. If root is unknown, ask for it before writing. Ensure the resolved output path stays inside the root and under the fixed output directory.
6. **Authoritative machine-readable files:** `contracts.json` is always canonical; in full mode `screens.json` and `machine.json` are also canonical. In existing-app mode `evidence.json` is canonical for provenance and uncertainty. Markdown describes the same facts and cannot redefine them. Use UTF-8, stable IDs, deterministic ordering, and schema version `1.0.0`.
7. **Do not invent implemented behavior:** for existing apps, never label a contract as observed without a file-and-line source. Record confirmed, inferred and proposed behavior distinctly. Unverified material behavior keeps status `draft`; ask the user to resolve gaps. Never execute untrusted repo scripts, tests, build steps, or the application without the user’s permission. Read-only inspection is the default.
8. **Automate the handoff:** after authoring, run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <feature-slug> --strict` to validate with Python and generate `contracts-viewer.html`. Fix validation errors; rerun. If Node is unavailable, use the Python validator directly, perform the [manual checklist](references/contracts.md), and clearly explain that the HTML viewer was not generated. Do not claim passing validation unless actually run.
9. **Interactive viewer is mandatory when Node is available:** produce a single self-contained offline HTML explorer of screens, state transitions, UI/state/event/command/data/validation contracts, and evidence, under the same fixed feature folder. The viewer is documentation, not an executable TUI or evidence of runtime verification. See [visualization and automation](references/visualization.md).
10. **Stand-alone package:** treat the folder containing this `SKILL.md` as the skill root regardless of install path. Read the [README](README.md) for CLI usage; optional agent-specific prompts are bundled in `.agents/prompts/` and can be installed into the user's repository using `node <skill-root>/scripts/tui.mjs install --repo-root <repo-root>`.

## Choose a workflow

- **New application / feature brief** → follow **Greenfield workflow** below; `source_mode: "brief"`, `artifact_scope: "full"`.
- **Existing repository / document current implementation / generate contracts from code** → follow [Existing-application workflow](references/existing-app.md). Default to `source_mode: "existing-app"`, `artifact_scope: "contracts-only"`; use `"full"` only when the user requests screen trees and complete state-machine reconstruction too.
- **Hybrid: existing app + proposed feature** → first document observed existing contracts separately. New functionality is *proposed*, not observed. Put the change design in a different feature folder (greenfield full mode) and explicitly reference the existing contract baseline. Never merge proposals into an existing-app `ready` baseline.

## Greenfield workflow

1. **Read the brief.** Identify target users, tasks, application purpose, constraints, known facts, and material unknowns.
2. **Present initial plan (v0) before interviewing.** In the conversation, propose scope, screen catalog, entry/exit paths, major interactions, state/IO boundaries, terminal constraints, and intended output. Label guesses and alternatives as **provisional**, not decided; do not generate files yet.
3. **Interview and iteratively revise.** Apply [elicitation](references/elicitation.md). Ask a small coherent batch of the highest-impact questions **after** showing v0. After every response, summarize decisions, update the visible plan to v1/v2/etc., identify changes and remaining blockers, and continue until resolved or delegated. Invite correction of the plan itself, not just answers to preselected questions.
4. **Get plan sign-off.** Present the consolidated plan and ask for an explicit **approve/proceed** decision. If the user requests changes, return to step 3. Record the interview rounds, plan revisions, final approval, and delegated assumptions in `DECISIONS.md` when writing begins. Do not use silence or unrelated answers as consent.
5. **Detail the approved interface.** Derive screen layout trees, focus order, keybindings, loading/empty/error variants, and terminal behavior from the approved plan. Use container/tree nodes, not ASCII art as authoritative representation.
6. **Model behavior first.** Define finite states and their screens; enumerate events, guarded transitions, optional commands, and terminal states. All nonterminal states need a route forward. Model Back/Escape, cancel, input errors, async success/failure, and retries where applicable.
7. **Define complete contracts.** Define UI component props and emitted events; state fields and invariants; events and payloads; commands and outcomes; data models and data sources; validation predicates and error messages. See [contracts](references/contracts.md).
8. **Write one feature folder.** Only after plan approval and the blocker gate, optionally run `node <skill-root>/scripts/tui.mjs scaffold --repo-root <repo-root> --feature <slug> --mode greenfield`, then fill every placeholder from the templates. Produce this baseline:
   - `SPEC.md` — purpose, actors, screen catalog, layout rules, a11y/terminal constraints, acceptance criteria
   - `FLOWS.md` — scenarios, state/transition table, error/edge-case paths
   - `CONTRACTS.md` — human-readable UI/state/event/command/data/validation API
   - `DECISIONS.md` — question/answer log, delegated assumptions, rationale, outstanding questions (normally none)
   - `manifest.json` — metadata, entry screen, required files, decision status
   - `screens.json` — hierarchical screen and component layout trees
   - `machine.json` — states, guards, transitions
   - `contracts.json` — complete implementation contracts
   - `validation-report.json` — generated by the validator
   - `contracts-viewer.html` — interactive offline visualization generated by Node.js
9. **Cross-check, build, and validate.** Match all IDs across files; verify reachable states, valid event references, unique keybindings and IDs, bindings to declared data sources, and validation targets. Run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict`. Resolve errors before status `ready` and inspect the generated viewer for coverage.
10. **Handoff.** Give the exact repo-relative artifact folder and `contracts-viewer.html`, open decisions (if any), validation status, and a summary of screens and flows. Do not claim to have implemented the UI.

## Existing-application mode: additional requirements

1. Resolve the real project root. Optionally run `node <skill-root>/scripts/tui.mjs inventory --repo-root <repo-root>` to get read-only candidate source locations, **not evidence**. Inspect actual app entry points, routing, widgets/layouts, handlers, key mappings, state stores, IO boundaries, data schemas, validation, and tests. Use the [inspection checklist](references/existing-app.md); do not assume a framework. Never write generated artifacts into the existing application source tree.
2. **After inspection, before interviewing**, present a provisional, evidence-grounded extraction plan in the conversation: surfaces to cover, whether contracts-only or full, known source evidence and gaps, and what will **not** be claimed as observed. Then interview the user about material ambiguities source and tests cannot resolve (scope, current vs proposed behavior, dynamic/plugin surfaces, feature boundary, observational gaps); revise and show the extraction plan after each round. Obtain explicit approval of the consolidated scope before creating artifacts. Log questions, revisions, and approval in `DECISIONS.md`. Never ask users to re-confirm source-established facts.
3. For **contracts-only**, generate `CONTRACTS.md`, `DECISIONS.md`, `EVIDENCE.md`, `manifest.json`, `contracts.json`, `evidence.json`, and `validation-report.json` and `contracts-viewer.html` inside the fixed feature folder. Do not fabricate `screens.json` or `machine.json` merely to satisfy an output checklist. Use stable contract IDs mapped to real observed screen/component/handler surfaces (document normalization when source has no ID); no layout tree/state graph is required.
4. For **full reconstruction**, generate the regular full-mode baseline **plus** `EVIDENCE.md` and `evidence.json`. Derive trees and transitions from existing behavior; label inferred elements and keep status `draft` until verified.
5. Every material contract entity needs a claim in `evidence.json` (`observed`, `user-confirmed`, `inferred`, or `proposed`). `observed` claims require exact repository-relative source paths and line ranges, at least one code/test/config source (documentation alone is not proof), and, for a `ready` baseline, a `sha256` per source so drift is detectable; `user-confirmed` claims must cite `Q-<number>` entries that exist in `DECISIONS.md`. In full reconstruction, screens, machine states and transitions are also backed by claims (`screens.<id>`, `machine.states.<id>`, `machine.transitions.<id>`). `inferred` or `proposed` claims cannot appear in a `ready` existing-app baseline. If file digest is provided, validation detects drift.
6. Never substitute intended architecture, README assertions, or hypothetical behavior for implementation evidence. Treat comments/docs as supporting context, not proof of runtime behavior. For dynamic behavior not inspectable statically, flag uncertainty, ask questions, or request permission to run the app or tests.
7. Rerun validation and refresh the HTML viewer after code changes. Changed or missing provenance files invalidate a `ready` baseline; update citations and contracts, do not silently re-interpret behavior.

## Output conventions

- Generate a subfolder per feature. Never dump unrelated screens directly into `docs/plans/generated/tui/`.
- For each screen, describe the intent and semantic layout tree. Node `kind` names are framework-neutral (`container`, `text`, `list`, `table`, `input`, `button`, `status`, `dialog`, etc.). Keep keyboard/focus semantics explicit.
- Reference **events** by stable IDs such as `task.open` and **states** by IDs such as `list.ready`, not prose labels. Commands are effect boundaries. Transitions are the sole authority for state change/navigation.
- All UI events must have an event contract; in **full mode**, each emitted event must have at least one applicable state transition. In contracts-only mode, document its actual handler instead of inventing a state transition. Commands must document inputs, outcomes, and side effects. Validation errors must have user-facing text.
- Describe default layout behavior for terminal widths/sizes supplied in the brief; ask if behavior at narrow widths materially affects the product. Never invent pixel dimensions or framework widgets.
- If a user changes a brief or previously approved design, return to the plan → interview → revision → approval loop for the affected scope. Once approved, update JSON, Markdown, and the decision/plan-review log together; rerun validation and regenerate HTML. Preserve existing stable IDs when semantics are unchanged.
- Use JSON for machine-readable output; YAML is not required. Do not include example comments or placeholders in final JSON files.

## References and tools

- [Clarification policy and question bank](references/elicitation.md)
- [Existing-app inspection, evidence, and contract extraction](references/existing-app.md)
- [Artifact shapes, contract definitions, and validation checklist](references/contracts.md)
- [Authoring and revision playbook](references/workflow.md)
- [Copyable templates](assets/templates/)
- [JSON Schema documentation](assets/schemas/)
- [Interactive viewer and automation workflow](references/visualization.md)
- [Standalone CLI](scripts/tui.mjs), [read-only source inventory](scripts/inventory.mjs), and [HTML generator](scripts/generate-html.mjs)
- [Validation command](scripts/validate.py)
- [Ready-to-use agent workflow prompts](.agents/prompts/)
- [Complete examples](examples/) for full-mode and contracts-only deliverables.


## Optional termcn schemas and flexible state mockups (1.5.0)

Full-mode features can import shadcn-compatible **termcn Ink/OpenTUI registry items** into `components.catalog.json` and conservative `components.schemas/*.schema.json`. Use `node scripts/tui.mjs termcn-import --repo-root <root> --feature <slug> --registry <local-registry-index-or-https://termcn.dev/r/registry.json> --components ink/text-input,...`. Remote imports are explicitly opt-in and never execute retrieved code. Unresolved inherited/nonserializable TypeScript types must be surfaced, not fabricated; callbacks are metadata rather than JSON values.

`node scripts/tui.mjs build --repo-root <root> --feature <slug>` additionally generates `storyboard.html`, `mockups/index.json`, and a `.txt`/`.svg` per machine state when full screen/machine definitions exist. `node scripts/tui.mjs mockup ...` can run just the mockup step. Optional `design.json` maps semantic kinds to imported registry components and supplies theme tokens and per-node props. Optional `scenarios.json` supplies fixture values, overrides and focus for sample screens. Version 1.1 of the optional visual configuration adds `design.preview` (named viewports, container layouts, widget styles, export formats) and named `scenarios.variants`/`stateVariants`; canonical screens, machine, and contracts remain at schema 1.0. See `assets/templates/*flex.example.json`. Their schema files live under `assets/schemas/`.

**Important:** generated previews are deterministic semantic illustrations, not faithful running termcn components. They may not match real application execution. Do not infer events, modify guards, or execute application code while generating them. A new user-requested interaction requires canonical spec review and approval. Prefer a pinned upstream registry mirror for production schema generation. Reference `README.md` for complete command examples.
