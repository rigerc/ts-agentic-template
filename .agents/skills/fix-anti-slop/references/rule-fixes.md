# Rule-by-rule anti-slop remediation

Match the **exact diagnostic code** and inspect surrounding types, call sites, tests, and runtime support. Examples are patterns, **not** AST-safe automatic replacements. This list follows the upstream README on 2026-10-26; a vendored rule may have local changes.

## Generic rules

| Diagnostic | What to change | Guard against |
|---|---|---|
| `anti-slop/no-array-filter-map` | Fuse adjacent eager `filter().map()` or `map().filter()` only when equivalent. Prefer iterator helpers if supported; otherwise use a single pass (`for...of`, `flatMap` where semantics match, or a new local result array). | Do not swap order, discard callback indexes/`thisArg`, alter sparse-array behavior, change truthiness filters, or require unsupported iterator helpers. No upstream autofix. |
| `anti-slop/no-reduce-accumulator-copy` | Replace accumulator copying (`Object.assign({}, acc, ...)`, `acc.concat`, `acc.slice`, etc.) with writes to an accumulator **owned by this reduction**, or choose a clear loop with fresh mutable output. | Never mutate shared/frozen/externally owned input or copy of input data. Multiple aliases and persistent data structures require review. |
| `oxc/no-accumulating-spread` | Avoid `{ ...acc, ... }` or `[...acc, item]` on each reduction step; use a fresh locally owned map/array, `push`, or property assignment. | Don't mutate a caller-owned collection. Preserve duplicates, keys, and order. |
| `anti-slop/no-chained-type-assertions` | Replace `x as unknown as T` or successive assertions with actual validation, correctly typed generics, a type guard, or a narrower API. | A one-step `as T` is not proof; don't just collapse a double cast without checking soundness. Chains solely using `as const` may be fine. |
| `anti-slop/no-conditional-empty-object-spread` | Construct optional fields using branches with *omitted* properties, or build an appropriately typed object and conditionally assign a field. | `field: undefined` is not always equivalent to omitted `field`; preserve key order, side effects, and `exactOptionalPropertyTypes`. No upstream autofix. |
| `anti-slop/no-known-value-widening` | Preserve inferred literal/specific types; use `satisfies` instead of a broad assignment annotation; parse unknown values only where they enter. | Do not use `unknown`/`object` as a temporary escape hatch. Local calls to type predicates with already-known arguments may also be reported. |
| `anti-slop/no-module-mocking` | Replace `vi.mock`, `jest.mock`, `doMock`, `unstable_mockModule` with real dependency injection: pass a typed dependency/service, adapter or test layer; test observable behavior. | Module mocking removal must not silently convert tests into production integrations or weaken test coverage. |
| `anti-slop/no-object-parameters` | Give function inputs a domain interface/type, a constrained generic with relevant fields, or a suitable discriminated union. | `object`-containing unions and transparent aliases also trigger; avoid arbitrary `Record<string, any>`. |
| `anti-slop/no-reflect-apply` | Call a properly typed function directly, use `.call`/`.apply` only if needed and type-safe, or redesign the invocation API. | Preserve `this` binding, array-like arguments, exceptions, and dynamic dispatch. |
| `anti-slop/no-reflect-get` | Access known keys with typed `obj[key]` / `obj.name`; narrow dynamic keys or parse external input first. | Getter and prototype behavior matter; indexing an untrusted key needs validation. |
| `anti-slop/no-runtime-typeof` | Parse or validate external input at the trust boundary using the project's existing schema/decoder; propagate a typed result. If the vendored rule *already* allows `allowInTypeGuards`, centralize a real type predicate. | Do not invent a runtime schema dependency or change the rule option to dodge an error. `typeof x === "undefined"` existence probes are allowed upstream. |
| `anti-slop/no-shape-in-symbol-names` | Rename locally owned variables, interfaces, types, functions, etc. containing the case-insensitive substring `shape`; use a semantic domain name. | Rename imports/exports/references carefully; an externally owned static member such as `schema.shape` is permitted. |
| `anti-slop/no-unknown-parameters` | Replace untyped function input contracts with specific domain types or establish a schema/parser at an inbound boundary. | The exact subject of a type predicate and a parameter named `cause` have upstream exemptions; don't break unknown-input validation APIs without considering boundary semantics. |
| `anti-slop/no-unknown-returns` | Return a modeled union/result or generic type, or validate a truly unknown value before returning it. | Includes `Promise<unknown>`, `PromiseLike<unknown>` and aliases. Do not lie about the returned value with casts. |
| `anti-slop/no-unknown-type-aliases` | Replace `type Value = unknown` / transparent aliases with a real domain union or eliminate an unnecessary alias. | External data may genuinely be unknown at runtime; parse before promising a concrete type. |
| `anti-slop/no-unsafe-dictionary-type` | Model known keys with an interface or `Record<K, V>` where `K` is finite and `V` has real types; use schema validation for untrusted dynamic keys/values. | `Record<string, unknown>` and structurally similar broad values are disallowed; constrained generics (`T extends Record<string, unknown>`) have a documented allowance. |
| `anti-slop/no-widen-then-assert` | Keep known values typed through local variables and helper APIs; remove widening stages and the subsequent narrowing cast. | A cast after lossy serialization, I/O, or external reads needs fresh validation rather than type propagation. |
| `anti-slop/require-readable-spacing` | Run `oxlint --fix` on affected files, format with project formatter, lint again. | Spacing-only autofix; keep leading comments with declarations and overload groups together. |
| `anti-slop/require-safety-comment-for-type-assertion` | Prefer eliminate the assertion. If unavoidable and justified, add nearby `// SAFETY: <specific invariant and evidence>` or another *already configured* marker. | `as const` need not be documented; a generic or fabricated safety claim does not establish truth. |

## Optional Effect rules

Only applicable where `anti-slop-effect` is actually configured. Import APIs matching the project's Effect version.

| Diagnostic | Remediation | Caveat |
|---|---|---|
| `anti-slop-effect/no-manual-effect-error-tag` | Use `Effect.catchTag`, `Effect.catchTags`, or when appropriate `Effect.catchReason` / `catchReasons` rather than manually examining `_tag` in broad catch handlers. | Preserve error coverage, fallthrough, and failure types. |
| `anti-slop-effect/no-manual-tag-comparison` | Replace direct `value._tag === "X"` / `_tag` switch with `Predicate.isTagged`, `Match`, or a tagged enum API. | Ensure exhaustiveness and equivalent branch ordering. |
| `anti-slop-effect/no-manual-tagged-construction` | Build tagged data via project Schema, tagged class/error or `Data.taggedEnum` constructors. | Match patterns in `Match.when`/`Match.not` are expressly allowed. Preserve serialization expectations. |
| `anti-slop-effect/no-service-constructor-imports` | In runtime code, consume the contextual service and import its Layer rather than relative named `make<Capability>` constructors. | Test/spec files have an upstream allowance. Package/path alias imports fall outside the rule's detection, not necessarily the architecture policy. |
| `anti-slop-effect/prefer-effect-match` | Replace repeated literal ternaries comparing the same value with `Match.value(...).pipe(Match.when(...), Match.orElse(...))`. | Keep default case, evaluation and exhaustiveness. |

## Policy and diagnostics edge cases

- The upstream rules operate on same-file ESTree and lexical scope. They do **not** prove semantic soundness; successful lint alone is insufficient.
- In a vendored copy, read the local rule implementation and tests when a diagnostic contradicts the upstream README or when local rule policy has changed.
- Do not enable `anti-slop/no-runtime-typeof`'s `allowInTypeGuards` option or change type-assertion markers without a requested, explicit team policy decision.
- When types are imported and a rule's syntactic scope is limited, use TypeScript typecheck/tests to verify the refactor rather than assuming all unsafe paths were detected.
