# TypeScript template

## Setup

Use Node.js 24.11+ and npm 11.16.0. The repository uses Vite+ and does
not require project-specific agent skills.

```sh
npm install --ignore-scripts
```

## Testing

Run all local verification before opening a pull request:

```sh
npm run check
npm run build
```

`npm run check` covers formatting, lint, type checks, the 80% coverage floor,
and this file's own `agents-md-lint` validation.

## Project structure

- `src/` contains application code and colocated tests.
- `vite.config.ts` configures Vite+, including the vendored anti-slop plugin.
- `tsconfig.json` defines strict compiler options.
- `sample.env` documents environment variables used by the Zod parser.

## Code style

Follow the existing TypeScript style. Let `npm run fix` apply supported
formatting and lint fixes; let `npm run check` verify the result.

## Git workflow

Keep changes scoped to the requested task. CI runs the same check and build
commands on pull requests to `main`.

## Boundaries

- Always use the project's npm scripts for verification.
- Ask first before adding deployment or publication automation.
- Never commit credentials, local environment files, or generated build output.
