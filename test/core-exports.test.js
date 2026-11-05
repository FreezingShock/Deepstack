import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../src/core/index.js';

// Two modules once both exported `dayKey`; `export *` silently dropped both. Keep the barrel names unique.
test('core barrel exposes distinct day-key helpers', () => {
  assert.equal(typeof core.dayKey, 'function');
  assert.equal(typeof core.bookDayKey, 'function');
  assert.equal(core.dayKey(new Date(2026, 10, 4, 23, 30).getTime()), '2026-11-04');
  assert.equal(core.bookDayKey({t: new Date(2026, 10, 4, 12).getTime()}), '2026-11-04');
  assert.equal(core.bookDayKey({}), '');
});
