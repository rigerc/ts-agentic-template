# anti-slop provenance

- **Upstream:** https://github.com/dmmulroy/anti-slop
- **Imported source commit:** [13909c9e07590f5a85d93c62712259fe14a883f7](https://github.com/dmmulroy/anti-slop/commit/13909c9e07590f5a85d93c62712259fe14a883f7)
- **Scope:** upstream generic `src/index.ts`, `src/rules/`, `src/shared/` and
  `src/vendor/` (without tests or unused Effect-specific rules)
- **Local adaptation:** `index.ts` imports `eslintCompatPlugin` from
  `vite-plus/lint/plugins`, which matches the Oxlint version bundled by Vite+,
  instead of importing a separate `@oxlint/plugins` package
- **License:** upstream MIT `LICENSE`; vendored ESLint Stylistic MIT
  `vendor/eslint-stylistic/LICENSE` and original `UPSTREAM.md`
- **Configuration:** `vite.config.ts`, `lint.jsPlugins` and generic rules

For updates, compare changes against the pinned upstream commit and preserve
the plugin import adaptation and license notices.
