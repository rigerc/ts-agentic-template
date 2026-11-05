---
name: fix-anti-slop
description: Diagnose and fix anti-slop Oxlint warnings and errors in TypeScript/JavaScript repositories, including optional Effect rules and oxc/no-accumulating-spread. Use when lint reports anti-slop violations, after installing or updating anti-slop, or when asked to make anti-slop checks pass without suppressing rules or weakening types.
compatibility: Requires access to the target repository and its existing lint/test tooling; Python 3.9+ is optional for diagnostic summarization.
metadata:
  version: "1.0.0"
  source: "https://github.com/dmmulroy/anti-slop"
---

# Fix anti-slop warnings and errors

Make the smallest evidence-preserving source changes needed to clear **actual** `anti-slop/*`, optional `anti-slop-effect/*`, and related `oxc/no-accumulating-spread` diagnostics. **This is a remediation skill, not an installer.** For installation, configuration, or upstream vendored-rule updates, use the upstream `install-anti-slop` skill instead.

## 1. Establish the repository and baseline

1. Read `AGENTS.md`/other repository instructions, relevant source and tests, `package.json`, package-manager lockfile, lint configuration (`oxlint.config.*`, `.oxlintrc.*`, or `vite.config.*`), and `git status --short`. Respect pre-existing changes; do not reset or overwrite them.
2. Confirm the rule names and actual plugin path in `jsPlugins`. Do not assume all rules are enabled, that the plugin lives in `tools/oxlint/anti-slop`, or that Effect rules are enabled. If anti-slop is not configured, do **not** pretend a clean run proves remediation; report this fact and hand off to the upstream install skill when installation is in scope.
3. Identify the project's authoritative lint, formatter, typecheck and test commands. For a plain Oxlint setup, collect machine-readable findings with the installed binary, for example:

   ```bash
   pnpm exec oxlint --format=json src > /tmp/anti-slop-before.json
   python3 <skill-directory>/scripts/triage.py /tmp/anti-slop-before.json
   ```

   Replace `pnpm exec` and `src` with the project's package manager and actual scope. Oxlint exits nonzero for findings; continue **only if** it produced valid JSON. Do not add `--quiet`, exclude files, or lower severity just to hide warnings. For a concise alternative, use `--format=agent` (supported by recent Oxlint). When the repo uses Vite+, run its configured `vp lint`/`vp check`; do not assume a standalone Oxlint invocation loads Vite+'s embedded lint configuration.
4. Separate actionable source findings from setup failures (missing plugin, incompatible `oxlint` / `@oxlint/plugins`, parse failures, missing files). Fix setup failures transparently and only within the user's scope; do not count a failed checker as a clean result.
5. Group by rule and file. Use `scripts/triage.py` only with actual Oxlint `--format=json` output. It summarizes relevant errors **and** warnings; with `--baseline` it reports increases/decreases by rule, including moved-line-resistant per-file/message matching. The script reads reports; it never changes source.

## 2. Apply low-risk automatic fixes first

- If `anti-slop/require-readable-spacing` is reported, run the project's equivalent of `oxlint --fix` **on the smallest applicable source scope**, then run the established formatter, then lint again. The spacing rule is documented as autofixable; do not assume the semantic anti-slop rules are.
- `--fix` may also change files for other enabled lint rules. Inspect `git diff` immediately, revert only changes introduced by this run that are unrelated to the task (without discarding pre-existing edits), and check readability/documentation attachment. Do **not** use `--fix-suggestions` or `--fix-dangerously` by default.
- After formatting, check once more that a subsequent lint-fix/format pass introduces no changes. Avoid formatter/linter oscillation.

## 3. Fix semantic diagnostics in small, testable batches

Read [rule-by-rule remediation](references/rule-fixes.md) and use the matching exact diagnostic code, **not** a generic search-and-replace. For especially tricky transformations, consult [worked examples and semantic traps](references/examples.md).

Prioritize: (a) files already in scope; (b) local, semantics-preserving cleanup; (c) API/boundary changes that require tests or coordinated edits. When a diagnostic is rooted in an API contract, update its call sites and tests rather than merely making the local syntax pass.

**Non-negotiable constraints:**

- Preserve public behavior, error handling, object property presence, async behavior, evaluation order, callback index semantics, and supported runtimes.
- Do not substitute `any`, `unknown`, `object`, broad dictionaries, double casts, non-null assertions, or an invented `// SAFETY:` sentence for real type evidence. Prefer inferred types, `satisfies`, explicit domain types, discriminated unions, typed functions, real schema parsing **at genuine trust boundaries**, or dependency injection.
- Do not disable rules, add `oxlint-disable` comments, remove tests, broaden ignores, or modify the vendored rule implementation as a shortcut. If the repo's intentionally chosen policy is genuinely inappropriate, **report** the tradeoff and request a policy decision instead of silently overriding it.
- Do not introduce dependencies, raise runtime requirements, or change public architecture without appropriate justification and validation. In particular, iterator helper `.values().filter().map().toArray()` requires a supporting runtime or polyfill; TypeScript types alone do not make it available.
- Type assertions sometimes represent a legitimate invariant. First look for an assertion-free representation. If an assertion is truly needed, add a nearby, specific `SAFETY: ...` comment describing the *proven* invariant; a plausible-sounding but unverified comment is not a fix.
- The rules use same-file AST/lexical evidence, not a whole-program TypeScript typechecker. Respect cross-file contracts when deciding on a rewrite.

For Effect findings, consult the dedicated section in `references/rule-fixes.md`; enable no new Effect rules on an unrelated project. Make idiomatic tagged errors, layers, and matching work with the Effect APIs **already used and installed** in that codebase.

## 4. Iterate and verify

1. Re-run the same lint command and scope after each coherent batch; save JSON output as `/tmp/anti-slop-after.json` for direct comparison when available:

   ```bash
   python3 <skill-directory>/scripts/triage.py /tmp/anti-slop-after.json --baseline /tmp/anti-slop-before.json
   ```

2. Run targeted tests for touched modules and the repository's typecheck. Then run its full lint/test suite or `vp check` as appropriate. Re-check the rule's behavior in both positive and negative test cases when branch behavior, schema parsing, reduction, object omission, or tagged errors change.
3. Look for regressions in all lint rules, not only anti-slop. If the before/after results differ because the lint scope/config changed, re-establish a comparable baseline. Do not claim that a report containing zero findings proves the rules ran—verify plugin registration and the files checked.
4. Inspect `git diff --check`, `git diff`, `git status --short`. Ensure fixes do not absorb unrelated work. Confirm a second fix/format pass is stable.

## 5. Report the result precisely

State files changed; counts of anti-slop **errors and warnings** before/after; specific rules resolved; typecheck/test/full-check outcomes (passed, failed, not run); and any remaining violations with file, line, exact rule and reason they require a decision. Distinguish lint-rule findings from checker/configuration errors. Never claim that a non-run test passed or that a suppressed warning was fixed.

## References

- [Rule-specific fixes for every upstream rule](references/rule-fixes.md)
- [Before/after examples and semantic pitfalls](references/examples.md)
- Upstream rules, behavior, supported options: https://github.com/dmmulroy/anti-slop#rules
- Existing installation/update skill: https://github.com/dmmulroy/anti-slop/tree/main/skills/install-anti-slop
- Oxlint CLI/output formats: https://oxc.rs/docs/guide/usage/linter/cli and https://oxc.rs/docs/guide/usage/linter/output-formats
