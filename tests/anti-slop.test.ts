import { RuleTester } from 'vite-plus/lint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { noArrayFilterMapRule } from '../tools/oxlint/anti-slop/rules/no-array-filter-map';
import { noChainedTypeAssertionsRule } from '../tools/oxlint/anti-slop/rules/no-chained-type-assertions';
import { noConditionalEmptyObjectSpreadRule } from '../tools/oxlint/anti-slop/rules/no-conditional-empty-object-spread';
import { noKnownValueWideningRule } from '../tools/oxlint/anti-slop/rules/no-known-value-widening';
import { noModuleMockingRule } from '../tools/oxlint/anti-slop/rules/no-module-mocking';
import { noObjectParametersRule } from '../tools/oxlint/anti-slop/rules/no-object-parameters';
import { noRuntimeTypeofRule } from '../tools/oxlint/anti-slop/rules/no-runtime-typeof';
import { noUnknownParametersRule } from '../tools/oxlint/anti-slop/rules/no-unknown-parameters';
import { noUnknownReturnsRule } from '../tools/oxlint/anti-slop/rules/no-unknown-returns';
import { noUnsafeDictionaryTypeRule } from '../tools/oxlint/anti-slop/rules/no-unsafe-dictionary-type';
import { requireSafetyCommentForTypeAssertionRule } from '../tools/oxlint/anti-slop/rules/require-safety-comment-for-type-assertion';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });

// The vendored rules are ignored by application lint. These regression cases
// exercise their diagnostic behavior with the Oxlint version bundled by Vite+.
tester.run('no-array-filter-map', noArrayFilterMapRule, {
  valid: ['const values = [1, 2, 3].map((value) => value * 2);'],
  invalid: [
    {
      code: 'const values = [1, 2, 3].filter((value) => value > 1).map((value) => value * 2);',
      errors: [{ messageId: 'arrayFilterMap' }],
    },
  ],
});

tester.run('no-chained-type-assertions', noChainedTypeAssertionsRule, {
  valid: ['const value = { id: 1 } as const;'],
  invalid: [
    {
      code: 'const value = input as unknown as { id: number };',
      errors: [{ messageId: 'chained' }],
    },
  ],
});

tester.run('no-conditional-empty-object-spread', noConditionalEmptyObjectSpreadRule, {
  valid: ['const options = { timeout: 1 };'],
  invalid: [
    {
      code: 'const options = { ...(enabled ? { timeout: 1 } : {}) };',
      errors: [{ messageId: 'avoid' }],
    },
  ],
});

tester.run('no-known-value-widening', noKnownValueWideningRule, {
  valid: ['const value = { id: 1 };'],
  invalid: [
    {
      code: 'const value: unknown = { id: 1 };',
      errors: [{ messageId: 'widening' }],
    },
  ],
});

tester.run('no-module-mocking', noModuleMockingRule, {
  valid: ['const vi = { mock: (name: string) => name }; vi.mock("local");'],
  invalid: [
    {
      code: 'import { vi } from "vitest"; vi.mock("./logger");',
      errors: [{ messageId: 'moduleMock' }],
    },
  ],
});

tester.run('no-object-parameters', noObjectParametersRule, {
  valid: ['function read(input: { id: string }) { return input.id; }'],
  invalid: [
    {
      code: 'function read(input: object) { return input; }',
      errors: [{ messageId: 'objectParameter' }],
    },
  ],
});

tester.run('no-runtime-typeof', noRuntimeTypeofRule, {
  valid: ['const exists = typeof window !== "undefined";'],
  invalid: [
    {
      code: 'const isString = typeof value === "string";',
      errors: [{ messageId: 'runtimeTypeof' }],
    },
  ],
});

tester.run('no-unknown-parameters', noUnknownParametersRule, {
  valid: [
    'function isString(value: unknown): value is string { return typeof value === "string"; }',
  ],
  invalid: [
    {
      code: 'function parse(input: unknown): string { return String(input); }',
      errors: [{ messageId: 'unknownParameter' }],
    },
  ],
});

tester.run('no-unknown-returns', noUnknownReturnsRule, {
  valid: ['function load(): string { return "ok"; }'],
  invalid: [
    {
      code: 'function load(): unknown { return "ok"; }',
      errors: [{ messageId: 'unknownReturn' }],
    },
  ],
});

tester.run('no-unsafe-dictionary-type', noUnsafeDictionaryTypeRule, {
  valid: ['type Metadata = Record<string, string>;'],
  invalid: [
    {
      code: 'type Metadata = Record<string, unknown>;',
      errors: [{ messageId: 'unsafeDictionary' }],
    },
  ],
});

tester.run('require-safety-comment-for-type-assertion', requireSafetyCommentForTypeAssertionRule, {
  valid: ['// SAFETY: The ID was validated before this assertion.\nconst id = input as UserId;'],
  invalid: [
    {
      code: 'const id = input as UserId;',
      errors: [{ messageId: 'missingSafetyComment' }],
    },
  ],
});
