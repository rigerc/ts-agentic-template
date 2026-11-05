## 1.5.0 — configurable mockup layouts, scenario matrices and output adapters

- Added a terminal-cell layout engine for nested horizontal/vertical/grid/overlay containers, configurable spacing, padding, borders, widths, alignment, wrapping and clipping warnings. Existing designs without new layout/style overrides retain the v1.4 text renderer and unchanged default TXT bytes.
- Introduced pluggable component renderers for semantic kinds and mapped termcn targets. Added checkbox, select, table and dialog previews; unknown kinds remain explicitly flagged.
- Added named viewport profiles and sample scenario variants with per-state overrides, deterministic multi-variant file names and index entries, selectable export formats including ANSI true-color terminal output.
- Storyboard now has optional viewport/scenario selectors, per-role theme colors, and safe DOM-based variant rendering.
- New optional `design.json`/`scenarios.json` schema version 1.1.0 (1.0.0 remains supported), validation, CLI flags, example configurations and regression tests. Canonical contract/screen/machine schemas remain unchanged.
- No runtime Ink/OpenTUI code is loaded or executed.

## 1.4.0 — termcn component schemas and TUI mockups

- New `termcn-import` command ingests termcn's shadcn registry item JSON, extracts serializable TypeScript `Props` into JSON Schemas, records callbacks and unresolved declarations, and writes a hashed component catalog.
- New `mockup` command generates terminal `.txt` and `.svg` previews for each state, an index, and an interactive standalone `storyboard.html` with transitions and theme controls.
- `build`/`watch` generate mockups for full-mode features; canonical HTML viewer remains available for both full and contracts-only scopes.
- Optional `design.json` and `scenarios.json`, schema templates, reference validation, and demonstrative task-tracker fixtures.
- New regression tests for schema extraction, cross-file integrity, HTML/SVG escaping, all task-tracker states and transitions, and reproducible output.
- Existing strict behavior/contract schemas remain unchanged; no termcn runtime or external npm dependencies are required for generation.

# Changelog

## 1.3.0

Plan-first interview and iteration workflow
- Greenfield: show a provisional v0 screen/flow plan **before** interviewing; ask focused questions, show a revised plan and change summary after each response, and repeat as needed.
- Existing-app: inspect source first, then present an evidence-grounded extraction plan, interview only about material gaps, revise the scope plan, and explicitly separate observed behavior from proposals.
- Require explicit final plan approval (or a clear “proceed”) **before scaffolding or generating artifacts**; no silent approval or unresolved material blockers.
- Re-enter the review loop before material changes to an existing spec; record plan versions, decisions, delegation, and approval in `DECISIONS.md`.
- Updated `SKILL.md`, elicitation/authoring/existing-app references, installable agent prompts, template, and README; contract schemas and CLI behavior are unchanged.


## 1.2.1

Validator fixes
- Keybinding duplicates no longer fold case: `g` and `G` are distinct; `Ctrl+S`/`ctrl+s` and `Shift+g`/`G` are the same binding.
- `TODO`/`TBD` placeholder detection is upper-case only, ignores code fences and spans, and is skipped for JSON (template `{{tokens}}` are still caught everywhere), so a `todo` task status or a cited `// TODO` no longer blocks `ready`.
- `user-confirmed` evidence must cite `Q-<n>` IDs that all exist in `DECISIONS.md` (previously `Q-1` matched `Q-12`). Legacy `Q1` is still read; templates and the example now use `Q-1`.
- Malformed JSON values (for example a list where an ID is expected) produce validation errors instead of a Python traceback; any unexpected exception becomes a failing report.
- `validation-report.json` is written atomically and never through a symlink; the Python validator now rejects symlinks in the feature path and symlinked input files, and `tui.mjs validate` applies the same path check as `build`.

New checks
- Nondeterministic or ambiguous transitions (same `from` + `event` with an unguarded or repeated guard) are errors.
- Warnings for declared-but-unused events, `command`/`system` events nothing handles, and node-scoped keys that shadow screen keys.
- Evidence: `observed` claims need a non-documentation source, cannot cite `docs/plans/generated/`, and need `sha256` on every source when `ready`; optional `kind` field added to the evidence schema; full-mode reconstructions need claims for `screens.*`, `machine.states.*`, `machine.transitions.*` (error when `ready`, warning when `draft`).

CLI and tooling
- Argument errors print a one-line message instead of a stack trace; free-text values beginning with `--` are accepted.
- `test` honours the `PYTHON` environment variable; removed an unused import.
- `install --minimal` omits `examples/` and `tests/`.
- `inventory` recognises more frameworks (`curses`, `tcell`, `cursive`, `FTXUI`, `notcurses`, `asciimatics`, ...), caps generic keyword scores so a framework import outranks noise, and halves the score of test files (`is_test: true`).

Docs
- Contracts reference documents key normalization, determinism rules, evidence rules and a recommended type vocabulary.

Not changed: the two validators still implement overlapping checks independently, and the JSON Schemas are documentation only (not enforced by the validator). No LICENSE file is bundled; choose one before redistributing.
