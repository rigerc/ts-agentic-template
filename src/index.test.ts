import { describe, expect, it } from 'vite-plus/test';

import { greet } from './index';

describe('greet', () => {
  it('addresses the name it is given', () => {
    expect(greet('world')).toBe('Hello, world!');
  });
});
