# Examples and semantic traps

These are illustrative rewrites requiring application-specific review. They are not automatically applied by the bundled script.

## Array filter/map: one pass without new runtime requirements

```ts
// Before: filter + map eagerly allocate intermediate arrays.
const names = users.filter((user) => user.active).map((user) => user.name);

// After: for...of retains filter-before-map semantics for ordinary dense arrays.
const names: string[] = [];
for (const user of users) {
  if (user.active) names.push(user.name);
}
```

If callback parameters use array indexes, the source may be sparse, or either method has an explicit `thisArg`, do not assume this loop is equivalent. If the runtime *actually* implements iterator helpers, `users.values().filter(...).map(...).toArray()` is another upstream-endorsed option.

## Reducer accumulation: mutate only local output

```ts
// Before: quadratic repeated copying.
const byId = items.reduce((acc, item) => ({ ...acc, [item.id]: item }), {} as Record<string, Item>);

// After: clearly owned local object; property writes do not copy the accumulator.
const byId: Record<string, Item> = {};
for (const item of items) byId[item.id] = item;
```

Confirm the chosen record type is appropriate; if item identifiers are finite, use a more precise domain type. If user-controlled keys may include `__proto__`, consider `new Map<string, Item>()` or `Object.create(null)` with proper typing and downstream compatibility.

## Optional-property presence must stay optional

```ts
// Before: `{}` branch triggers no-conditional-empty-object-spread.
const request = {
  method: "GET",
  ...(timeout !== undefined ? { timeout } : {}),
};

// After: omission semantics preserved without a conditional empty spread.
const request = timeout !== undefined
  ? { method: "GET", timeout }
  : { method: "GET" };
```

Avoid `{ timeout: timeout === undefined ? undefined : timeout }`: `'timeout' in request` and `Object.keys(request)` behave differently.

## Keep known evidence, don't launder it

```ts
// Before: concrete handlers lose known keys.
const handlers: Record<string, Handler> = { start: startHandler };

// After: check compatibility without erasing the inferred literal keys.
const handlers = { start: startHandler } satisfies Record<string, Handler>;
```

```ts
// Before: known value widened, then reasserted.
const stored: unknown = loadedUser;
const user = stored as User;

// After: carry proven type forward.
const user = loadedUser;
```

For real external inputs, decode first using an existing appropriate validator instead of asserting their type.

## Type assertions: evidence first

```ts
// Avoid: value as unknown as User;  // changes syntax without validation.

// Better at an external boundary, if the project uses Zod:
const user = UserSchema.parse(value);

// If a branded value was genuinely checked by validateUserId:
// SAFETY: validateUserId(value) succeeded; it rejects nonconforming IDs.
const id = value as UserId;
```

A comment is meaningful only when the preceding control flow genuinely proves its claim. Do not insert a `SAFETY` marker solely to silence lint.

## Module mocking: inject a capability instead

```ts
interface UserStore {
  get(id: string): Promise<User | undefined>;
}

async function loadName(store: UserStore, id: string) {
  return (await store.get(id))?.name;
}

// Test with a typed in-memory fake rather than vi.mock('./user-store').
const fakeStore: UserStore = {
  async get(id) { return id === "123" ? { id, name: "Ada" } : undefined; },
};
```

Adapt domain interfaces and factories to the real project and avoid production service calls in isolated tests.

## Avoid shallow typeof rewrites

```ts
// Fragile: unknown data narrowed ad hoc throughout business logic.
if (typeof payload.name === "string") useName(payload.name);

// Better: parse at the boundary with an *existing* schema/decoder.
const request = RequestSchema.parse(payload);
useName(request.name);
```

The `no-runtime-typeof` rule has a documented `allowInTypeGuards` option, but modifying lint policy is **not** part of remediation unless explicitly requested.

## Effect matching

```ts
// Before: repeated comparisons of a tagged field.
const label = kind === "a" ? "A" : kind === "b" ? "B" : "Other";

// After (with an appropriate Effect/Match import):
const label = Match.value(kind).pipe(
  Match.when("a", () => "A"),
  Match.when("b", () => "B"),
  Match.orElse(() => "Other"),
);
```

For Effect tagged error handling, prefer `Effect.catchTag("NotFound", ...)` over a manual `_tag` branch inside a broad catch, checking error channel types and behavior.
