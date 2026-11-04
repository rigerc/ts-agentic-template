# ts-agentic-template

A starting point for a TypeScript project that will be worked on with coding
agents. It carries the dev tooling, the lint/check pipeline, and the agent
rules and skills — and almost no application code.

## What's in it

### Dev tooling

| Tool                      | Role                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| **TypeScript**            | `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `verbatimModuleSyntax`, ES2022 |
| **Vitest**                | `*.test.ts` beside the code; coverage thresholds; `*.integration.test.ts` held back                   |
| **Stryker**               | mutation testing — asks whether a test would have _failed_, not just whether it ran the line          |
| **@vitest/eslint-plugin** | lints the tests themselves: no assertion, focused, disabled, conditional `expect`                     |
| **ESLint**                | typescript-eslint `strict-type-checked`, sonarjs, unicorn, perfectionist, n, promise + caps           |
| **Prettier**              | formatting, checked by the gate; `eslint-config-prettier` keeps the two from fighting                 |
| **anti-slop**             | vendored Oxlint plugin; rejects low-evidence TypeScript patterns alongside ESLint                     |
| **knip**                  | unused files, exports and dependencies — in both default and production mode                          |
| **jscpd**                 | copy-paste detection at a 0% threshold                                                                |
| **dependency-cruiser**    | circular imports, orphans, and your module boundaries                                                 |
| **zod**                   | `src/env.ts` — the environment, parsed and validated at boot                                          |
| **pino**                  | `src/logger.ts` — structured logs; `no-console` is a lint error                                       |
| **commitlint**            | Conventional Commits, on `commit-msg`                                                                 |
| **husky**                 | `pre-commit` runs `npm run check`; `pre-push` runs the slow half                                      |
| **gitleaks**              | secret scan over the whole history, pinned and checksum-verified, on `pre-push`                       |
| **npm audit**             | vulnerability scan on `pre-push`; failures require triage, not blanket ignores                        |
| **npm**                   | npm 11.16+ with a 30-day release-age gate and lifecycle scripts disabled in `.npmrc`                  |

### Agent setup

```
AGENTS.md               # cross-tool entry point; a pointer, guarded by a test
agent_rules/            # the rules — the one real copy
├── 01-overview.md          what this project is (fill in)
├── 02-coding-guidelines.md house style + the npm run check rule
├── 03-code-walkthrough.md  the map agents navigate by
└── 04-committing.md        commit message conventions

.claude/rules  -> agent_rules   # symlinks, so every assistant reads one file
.clinerules    -> agent_rules
.kilocode/rules-> agent_rules

.claude/settings.json   # a read-only-command allowlist, to cut permission prompts
.claude/hooks/
└── format-edited-file.sh   # PostToolUse: eslint --fix + prettier, per edit
.claude/skills/
├── code-audit/         # structural audit: naming, placement, cohesion
├── add-dependency/     # the star check, the maturity window, scripts off
└── write-tests/        # house test conventions, and surviving mutation
```

Edit `agent_rules/` only. The three rule paths are symlinks to it.

`AGENTS.md` is the exception: a file cannot symlink to a directory, so it is a
hand-written pointer at `agent_rules/`. `src/driftGuard.test.ts` asserts it
still names every rule file and no others.

**The edit-time hook is the highest-leverage piece here.** `npm run check` reports
mechanical problems only once a task is finished, by which point the fix is a
diff across many files competing for attention with real findings. Fixing
formatting and autofixable lint at the moment of the edit keeps `npm run check`'s
output about things that need judgement.

## Getting started

```bash
npm install --ignore-scripts  # generates package-lock.json; commit it
npm run hooks:install        # --ignore-scripts skips prepare
npm run check
```

`npm run hooks:install` is a separate step on purpose. Husky normally installs
itself from the `prepare` lifecycle script, and `--ignore-scripts` — which is the right way
to install — skips `prepare` along with everything else. Without that second
line the `pre-commit` and `commit-msg` hooks are present as files but never
run, and `git config core.hooksPath` is unset. That is the symptom to check for
if a commit sails through with a failing `npm run check`.

Then:

1. Set `name` in `package.json`.
2. Fill in `agent_rules/01-overview.md` — what this project is.
3. Keep `agent_rules/03-code-walkthrough.md` current as the code appears.
4. Add your module boundaries to Section 2 of `.dependency-cruiser.cjs`.
5. Put your real variables in `src/env.ts` and `sample.env`.
6. Replace `src/index.ts`.

## Commands

| Command                         | What it does                                                                |
| ------------------------------- | --------------------------------------------------------------------------- |
| `npm run check`                 | the gate — typecheck, format, lint, knip, jscpd, depcruise, test            |
| `npm run fix`                   | ESLint and Oxlint autofix + Prettier write. Run this before reading errors. |
| `npm run typecheck`             | `tsc --noEmit`                                                              |
| `npm run lint`                  | ESLint and vendored anti-slop Oxlint rules                                  |
| `npm run format`                | Prettier, writes                                                            |
| `npm run test` / `test:watch`   | Vitest                                                                      |
| `npm run test:coverage`         | Vitest with thresholds enforced                                             |
| `npm run test:mutation`         | Stryker — mutation score, gated by `stryker.conf.mjs`                       |
| `npm run build`                 | emits `dist/` with declarations                                             |
| `npm run check:vulnerabilities` | `npm audit` with moderate-or-higher advisories treated as failures          |
| `npm run scan:secrets`          | gitleaks over the whole git history                                         |
| `npm run hooks:install`         | installs the husky git hooks (needed after a fresh clone)                   |
| `npm run tools:install`         | downloads the pinned gitleaks binary into `.tools/`                         |

### The gate is two git hooks

There is no CI. The whole gate is local:

| Hook         | Runs                                                          |
| ------------ | ------------------------------------------------------------- |
| `commit-msg` | commitlint                                                    |
| `pre-commit` | `npm run check` — the entire thing, not a staged-files subset |
| `pre-push`   | secret scan, dependency audit, build, mutation tests          |

**Both hooks are bypassable.** `git commit --no-verify` and
`git push --no-verify` walk straight past them, and nothing downstream will
notice. This is a gate you choose to keep, not one imposed on you — worth
knowing before trusting a green branch you did not watch go green.

After installing with lifecycle scripts disabled, initialize the hooks and
pinned gitleaks binary explicitly:

```bash
npm run hooks:install
npm run tools:install
```

`npm run test:mutation` is deliberately **not** in `npm run check` — a mutation run
scales with suite size in a way a commit gate cannot absorb. `pre-push` is
where it runs.

### Verifying the verification

Three of the guards here exist for the failure mode specific to agentic coding:
output that looks verified without being verified.

- **Mutation testing** answers the question coverage cannot. Coverage says the
  line ran. Stryker changes the line and checks whether anything fails. A
  surviving mutant is a missing assertion.
- **The vitest ESLint plugin** catches the tests that pass by construction — no
  assertion at all, `it.only` parking the rest of the suite, an `expect` behind
  an `if` that the fixture never takes. None of that shows up in a test run.
- **`src/driftGuard.test.ts`** turns the "change these two together" rules into
  assertions: `src/env.ts` against `sample.env`, `src/` against the walkthrough's
  module map, the agent-rule mirrors against `agent_rules/`. Those rules are
  prose, and prose fails silently.

## Every opinionated choice in here

None of this is a default. Each line is a position someone took, and each one
can be reversed — see _Removing what you don't want_.

### Package management

- **Use npm 11.16+**, not pnpm or yarn. After the first registry-backed
  install, commit the generated `package-lock.json`.
- **Installs disable lifecycle scripts** through `.npmrc` (`ignore-scripts=true`).
  The explicit `npm run hooks:install` command installs Husky after a clone.
- **New package versions must be at least 30 days old**, enforced through
  npm's `min-release-age=30`; check `npm config get min-release-age` to verify.
- **New dependencies need ≥2,000 GitHub stars**, or `eslint-community` /
  first-party approval. Record exceptions in `agent_rules/02-coding-guidelines.md`.
- **Third-party binaries must be pinned and checksum-verified**, as
  `scripts/installGitleaks.sh` demonstrates.
- **Audit failures require review.** npm does not support pnpm's per-GHSA
  audit-ignore list; do not lower the audit severity to hide advisories.

### Types

- **`strict`, and then some**: `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`,
  `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`.
- **`noUncheckedIndexedAccess` is the highest-value one.** `arr[0]` is
  `T | undefined`, and since non-null assertions are a lint error, the fix has
  to be a real guard rather than an assertion.
- **`verbatimModuleSyntax`** makes `import { type Foo }` a compile requirement
  rather than a lint preference, so `tsc` alone catches it.
- **`noUncheckedSideEffectImports`** so a typo'd `import './setup'` fails at
  compile time instead of on the machine that runs it.
- **`moduleDetection: "force"`** — every file is a module, whether or not it
  happens to export anything today.
- **No `any`, no non-null assertions, no unsafe member access.** All errors.
- **Discriminated unions over bags of optional fields**, and a `switch` over a
  union must be exhaustive. Adding a variant should break the build everywhere.

### Lint and format

- **Prettier owns formatting; ESLint never does.** 100 columns. There is
  deliberately no `max-len` — `eslint-config-prettier` would disable it, so
  adding one back produces dead config that reads as enforced.
- **typescript-eslint `strict-type-checked` + `stylistic-type-checked`**, plus
  sonarjs, unicorn, perfectionist, n and promise.
- **Perfectionist sorts imports, exports and type members — not objects.**
  Object-literal and class-member order is usually meaningful; sorting it fights
  the author.
- **The caps are the wall, not the target**: 120 lines per function, 500 per
  file, complexity 10, depth 3, 5 params, 70 statements.
- **`console` is an error.** `logger` is the way out.
- **`process.env` is an error everywhere except `src/env.ts`**, the file whose
  whole job is to parse it.
- **Deferrals carry a date.** `// TODO [2026-12-01]: ...`. `sonarjs/todo-tag` is
  off on purpose — it bans the marker outright, leaving no form of the comment
  that passes, so the only ways through are deleting the note or disabling a
  rule.
- **No `eslint-disable` to silence a finding.** Fix it, or change the rule
  deliberately and say why.
- **`--max-warnings=0`.** A warning is a failure; the severity only changes the
  wording.

### Tests

- **Unit tests sit beside the code** as `*.test.ts`, and must be hermetic.
- **Integration tests are a separate suite**, `*.integration.test.ts`, excluded
  from the default run.
- **Coverage has a floor and it is a ratchet.** It only goes up. Deleting or
  skipping a test to reach it fails the gate instead.
- **Mutation testing is a gate too.** Coverage says the line ran; Stryker
  changes the line and asks whether anything would have failed.
- **The tests themselves are linted.** No-assertion tests, `it.only`, `it.skip`,
  an `expect` behind an `if`, duplicate titles — all errors, because none of
  them show up in a test run.
- **An unkillable mutant is a design signal**, not a threshold to lower:
  extract the logic to `*.utils.ts` and test it directly. That is why
  `src/env.utils.ts` exists.

### Structure

- **Pure helpers live in `<name>.utils.ts`** beside their consumer.
- **Dependencies are parameters.** `run(log, name)` takes its logger; only
  `main()` reaches for the module-level singleton.
- **Configuration is parsed once, at boot**, by zod in `src/env.ts`. A bad
  variable fails there, naming itself, rather than mid-request.
- **Logs are newline-delimited JSON in production.** `pino-pretty` is a
  devDependency and must never be reachable on the production path.

### Documentation and agents

- **`agent_rules/` is the one real copy.** `.claude/rules`, `.clinerules` and
  `.kilocode/rules` are symlinks to it; `AGENTS.md` is a pointer at it. Never
  edit a mirror.
- **The walkthrough is enforced, not aspirational.** A file under `src/` that is
  missing from its module map fails a test.
- **Numbers quoted in the rules are checked against the configs that hold
  them**, so prose and config cannot drift apart while both read authoritative.
- **Procedures are skills, not paragraphs.** `add-dependency` and `write-tests`
  encode what would otherwise be prose an agent skims once.

### Process

- **Conventional Commits**, enforced on `commit-msg`.
- **`pre-commit` runs the entire `npm run check`**, not a staged-files subset. The
  edit-time hook is what keeps that from being slow to act on.
- **`pre-push` runs the slow half**: secret scan, dependency audit, build,
  mutation tests.
- **There is no CI, and both hooks are bypassable.** That is a deliberate trade
  for a template meant to be cloned into environments that may not have a
  runner — not an oversight. Wiring `npm run check` and the `pre-push` list into
  whatever runner you have is the one thing worth adding back.

### Deliberately not here

- **Biome / oxc** — faster, but the type-aware lint rules are the whole point.
- **lint-staged** — the gate is the whole check, not the changed files.
- **`eslint-plugin-jsdoc`** — the house comment style is prose-in-header, not
  API docs. Enforcing JSDoc syntax would fight it.
- **markdownlint, cspell, `eslint-plugin-regexp`** — all considered, all below
  the star bar, none earning an exception.
- **`publint` / `@arethetypeswrong/cli`** — add when the project publishes.

## Supply-chain guards

The npm equivalents are configured in `.npmrc` and in the documented
dependency-add procedure:

| Setting                            | Effect                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `min-release-age=30`               | npm refuses versions published within the last 30 days during resolution |
| `ignore-scripts=true`              | Dependency lifecycle scripts do not execute at install time              |
| `npm audit --audit-level=moderate` | Any moderate-or-higher advisory fails the pre-push gate                  |

npm does not have exact equivalents to pnpm's `trustPolicy: no-downgrade`,
`blockExoticSubdeps`, or `verifyDepsBeforeRun` behavior. Do not assume these
guards survive this migration; review lockfile changes, prefer registry
dependencies, and use `npm ci` after generating a valid lockfile.

The previous pnpm lockfile contained only pnpm itself, not the project
dependency tree. It therefore cannot be converted into a truthful `package-lock.json`
offline. Run `npm install --ignore-scripts` with registry access and commit the
generated `package-lock.json` before using `npm ci`.

There is no Dependabot. `npm outdated` is the manual check for updates; changes
must still clear the 30-day release-age policy.

## Removing what you don't want

Everything is independent:

- Don't want duplication checks? Drop `check:code-duplication` from `check` and
  remove `jscpd`.
- Don't want the pre-commit hook? Delete `.husky/` and the `prepare` script.
- Don't want Conventional Commits? Delete `commitlint.config.js` and
  `.husky/commit-msg`.
- Only using one assistant? Delete the other two rule symlinks.
- Finding `strict-type-checked` too noisy for your codebase? Swap it for
  `recommended-type-checked` in `eslint.config.js`.
- Mutation testing too slow once the suite grows? Drop it from `.husky/pre-push`
  and run `npm run test:mutation` on a schedule instead. Occasional runs still
  recalibrate the suite; deleting it entirely does not.
- Don't want a local secret scan? Delete `.husky/pre-push`, `scan:secrets`,
  `tools:install` and `scripts/installGitleaks.sh`.

## Add when you publish

Nothing here assumes the project ships to a registry. When it does, add
`publint` and `@arethetypeswrong/cli` to `npm run check` — they catch broken
`exports` maps and type resolution that no test exercises.

## Anti-slop provenance

The generic [anti-slop](https://github.com/dmmulroy/anti-slop) Oxlint rules
are vendored at `tools/oxlint/anti-slop/`. Their source revision and
license provenance are documented in `tools/oxlint/anti-slop/UPSTREAM.md`.
Run `npm run lint:slop` for these rules alone; `npm run lint` and
`npm run check` enforce them alongside the existing ESLint gate.
Effect-only rules are present upstream but not enabled because this template
does not depend on Effect.
