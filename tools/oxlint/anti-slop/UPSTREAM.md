# anti-slop source provenance

- **Upstream repository:** https://github.com/dmmulroy/anti-slop
- **Commit:** [13909c9e07590f5a85d93c62712259fe14a883f7](https://github.com/dmmulroy/anti-slop/commit/13909c9e07590f5a85d93c62712259fe14a883f7)
- **Source:** the upstream `src/` tree at that commit, excluding `*.test.ts`, copied into this directory.
- **License:** upstream MIT license, at `LICENSE`; vendored ESLint Stylistic code retains its own MIT `vendor/eslint-stylistic/LICENSE` and `UPSTREAM.md`.
- **Installed entry point:** `tools/oxlint/anti-slop/index.ts`; registered in `oxlint.config.ts`.
- **Intentional decisions:** generic rules enabled as errors. Effect rules are copied
  for traceability but not enabled: the template has no direct `effect`
  dependency. ESLint remains the primary type-aware linter.

To update: inspect upstream changes relative to this commit, reconcile any
local customizations, and update this record to the **actual** copied source
revision. Never replace the directory with unreviewed upstream code.
