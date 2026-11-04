---
name: add-dependency
description: Adds an npm dependency to this project the way its rules require — resolve the real repository, check the star count, pick a version old enough to install, and install with scripts off. Use whenever a package is about to be added, swapped, or upgraded across a major version, including a pinned third-party binary.
---

Adding a dependency here is a procedure, not a judgement call. Work through it
in order. Stop at the first step that fails and report, rather than working
around it.

## 1. Resolve the real repository

The npm name is not the repository name, and a scoped name says nothing about
who maintains it.

```bash
npm view <package> repository.url
```

## 2. Read the star count

```bash
gh api repos/{owner}/{repo} --jq .stargazers_count
```

**The bar is 2,000 stars.** Two things clear it without meeting it:

- the package is maintained under the `eslint-community` organisation;
- the package is first-party to a project that clears the bar on its own — an
  official plugin counts as the project it plugs into.

If it clears the bar, continue. If it does not:

- **Stop.** Do not install it.
- Report the package, its repository, and the star count to the user.
- Ask for explicit permission.
- If granted, add a row to _Recorded exceptions to the star threshold_ in
  `agent_rules/02-coding-guidelines.md`. An exception nobody wrote down is
  indistinguishable from the rule not being followed.

Third-party binaries are dependencies too, even though they never appear in
`package.json`. The same check applies to the tool's repository — and once it
passes, pin the version and verify a checksum on download.
`scripts/installGitleaks.sh` is the pattern to copy. Never fetch `latest`, and
never pipe a download into a shell.

## 3. Pick a version that will actually install

`min-release-age=30` in `.npmrc` refuses releases less than 30 days old.
It constrains dependency resolution (including transitives). Review the
publish dates, and choose the newest version that satisfies the policy:

```bash
npm view <package> time --json
npm config get min-release-age
```

## 4. Install with scripts off

```bash
npm install --ignore-scripts <package>       # runtime
npm install -D --ignore-scripts <package>    # dev
```

Keep `package-lock.json` with the manifest; npm 11.16+ enforces the
repository's `min-release-age` policy. npm also reads `ignore-scripts=true`
from `.npmrc`. If a dependency genuinely needs its install step, review it
first and explicitly run `npm rebuild <package> --ignore-scripts=false`.

npm does not implement pnpm's publisher-trust downgrade or exotic-transitive
guards. Review newly introduced resolution URLs in the lockfile rather than
assuming those controls survived the migration.

## 5. Confirm nothing else moved

```bash
npm run check
```

`knip` is the one to watch: a dependency used only in a JSDoc type or a config
file still has to be listed, and one nothing imports has to be removed.

## 6. Say what changed and why

In the commit message or the summary, name the package, what it replaced or
added, and the star count if it was an exception. The next person reading the
lockfile diff should not have to reconstruct the reasoning.
