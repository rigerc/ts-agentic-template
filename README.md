# ts-agentic-template

A minimal, strict TypeScript starter for coding agents. The tooling is **npm +
Vite+**, with vendored [anti-slop](https://github.com/dmmulroy/anti-slop)
rules enabled inside Oxlint. One short `AGENTS.md` documents exact project
commands; there are no custom agent skills or secondary lint/test systems.

## Requirements

- Node.js 24.11+ (see `.nvmrc`)
- npm 11.10+ (npm 11.16 is selected in `package.json`)

Vite+ is pinned to **1.5.0**, with its matching Vite core and Vitest **5.1.0**
versions set by the official `vp migrate` command. Its bundled Oxlint powers
linting and type checking; tests import from `vite-plus/test`. There are
no separate ESLint, Prettier, or Oxlint dependencies. The migration retains
Vitest 5.1.0 as a direct development dependency to align the coverage provider.
TypeScript 5.9.3 remains for declaration generation during `vp pack`.

The normal npm dependency-release age requirement is still **30 days**.
Because Vite+ 1.5.0 was published on November 4, 2026, `.npmrc` explicitly
exempts only the upgraded Vite+/Vitest toolchain packages from that window.
Review and remove those exclusions when the pinned releases qualify.

## Getting started

```sh
npm ci --ignore-scripts
npm run hooks:install   # optional: install Vite+ staged-file pre-commit hook
npm run check
npm run build
```

The committed `package-lock.json` makes clean installs reproducible.
Use `npm install --ignore-scripts` only when changing dependencies. The pre-commit
hook is optional and must be enabled once per clone because install scripts
are disabled.

## Commands

| Command                 | Action                                                                  |
| ----------------------- | ----------------------------------------------------------------------- |
| `npm run check`         | Vite+ format/lint/type checks, coverage-gated tests, and AGENTS.md lint |
| `npm run fix`           | Fix lint and format via `vp check --fix`                                |
| `npm run lint`          | Oxlint, including anti-slop and type-aware lint                         |
| `npm run lint:agents`   | `agents-md-lint@1.0.1` checks AGENTS.md in strict mode                  |
| `npm run format`        | Oxfmt                                                                   |
| `npm test`              | Run unit tests                                                          |
| `npm run test:watch`    | Watch unit tests                                                        |
| `npm run test:coverage` | Run tests with the 80% coverage floor                                   |
| `npm run build`         | `vp pack`: ESM in `dist/`, sourcemap and declarations                   |
| `npm run hooks:install` | Enable the Vite+ Git hook dispatcher                                    |
| `npm run audit`         | npm vulnerability audit at moderate severity                            |

Vite+ configuration lives in **`vite.config.ts`**: lint, format, test,
packaging, and staged checks. TypeScript strictness remains in `tsconfig.json`.
The only repository-owned hook is `.vite-hooks/pre-commit`, which invokes
`vp staged`; the generated `.vite-hooks/_` dispatcher is ignored by Git.

## Continuous integration

The [GitHub Actions CI workflow](.github/workflows/ci.yml) runs on pull
requests and pushes to `main`. Its path filters skip unrelated work:

- TypeScript source, build configuration, and lockfile changes run
  **Oxlint + anti-slop**, type checks, coverage-gated Vitest tests, and
  the Vite+ build.
- Markdown, JSON, JavaScript, TypeScript, and YAML changes run **Oxfmt**.
- `AGENTS.md` and relevant source/config changes run strict **agents-md-lint**.
- Dependency changes trigger **npm audit**; pull requests also run GitHub
  **Dependency Review**, blocking newly introduced high-severity advisories.
- Changes to workflows or Dependabot configuration trigger **actionlint**
  and **zizmor** (medium-severity, medium-confidence threshold).

A weekly scheduled run refreshes the npm advisory report and workflow security
scans. Known vulnerabilities reported by `npm audit` are non-blocking until
the existing advisory backlog is resolved; new high-severity dependency
vulnerabilities remain a blocking PR check. A stable **CI result** job fails
if any applicable required check fails, even when other jobs were skipped.

CI uses Node.js from `.nvmrc`, npm 11.16.0, and
`npm ci --ignore-scripts` against the committed lockfile where appropriate.
`.github/dependabot.yml` checks npm packages and GitHub Actions weekly, with a
30-day version-update cooldown. CodeQL is not configured.

## Source

- `src/index.ts` — entry point and example dependency injection
- `src/env.ts` and `src/env.utils.ts` — validated environment via Zod
- `src/logger.ts` — structured logging via Pino
- `*.test.ts` — colocated unit tests

Extend `src/env.ts` and `sample.env` together; change `src/index.ts`
to build your application.

## Anti-slop

Generic anti-slop rules are vendored under `tools/oxlint/anti-slop/`, with
upstream attribution and third-party notices in `UPSTREAM.md`. This is
upstream lint code, not a custom agent skill or instruction set. The unused
Effect rules are not included. The vendored plugin imports Oxlint's authoring
API from `vite-plus/lint/plugins`, so no second Oxlint installation is needed.

## Supply-chain settings

`.npmrc` disables dependency lifecycle scripts, requires registry releases
to be at least 30 days old, and disallows non-registry dependency sources.
These settings do not provide publisher trust-downgrade detection or the
per-advisory exclusions of pnpm. Review dependency upgrades and the generated
npm lockfile accordingly.

The npm lockfile is generated by npm 11.16.0 on GitHub Actions.
The Vite+ 1.5.0 upgrade was produced by the official target-version migrator,
not by manually mixing its bundled Vite and Vitest versions.
