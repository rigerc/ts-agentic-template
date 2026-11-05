import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  fmt: {
    singleQuote: true,
    semi: true,
    printWidth: 100,
    tabWidth: 2,
    trailingComma: 'es5',
    ignorePatterns: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.vite-hooks/**',
      '.agents/**',
      'tools/oxlint/anti-slop/**',
      'package-lock.json',
      'LICENSE',
    ],
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    ignorePatterns: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.vite-hooks/**',
      '.agents/**',
      'tools/oxlint/anti-slop/**',
    ],
    jsPlugins: [{ name: 'anti-slop', specifier: './tools/oxlint/anti-slop/index.ts' }],
    rules: {
      'oxc/no-accumulating-spread': 'error',
      'anti-slop/no-array-filter-map': 'error',
      'anti-slop/no-reduce-accumulator-copy': 'error',
      'anti-slop/no-chained-type-assertions': 'error',
      'anti-slop/no-conditional-empty-object-spread': 'error',
      'anti-slop/no-known-value-widening': 'error',
      'anti-slop/no-module-mocking': 'error',
      'anti-slop/no-object-parameters': 'error',
      'anti-slop/no-reflect-apply': 'error',
      'anti-slop/no-reflect-get': 'error',
      'anti-slop/no-runtime-typeof': 'error',
      'anti-slop/no-shape-in-symbol-names': 'error',
      'anti-slop/no-unknown-parameters': 'error',
      'anti-slop/no-unknown-returns': 'error',
      'anti-slop/no-unknown-type-aliases': 'error',
      'anti-slop/no-unsafe-dictionary-type': 'error',
      'anti-slop/no-widen-then-assert': 'error',
      'anti-slop/require-readable-spacing': 'error',
      'anti-slop/require-safety-comment-for-type-assertion': 'error',
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__fixtures__/**', 'src/index.ts', 'src/logger.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  pack: {
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['esm'],
    dts: true,
    sourcemap: true,
  },
  staged: {
    '*.{ts,tsx,js,mjs,cjs,json,md,yml,yaml}': 'vp check --fix',
  },
});
