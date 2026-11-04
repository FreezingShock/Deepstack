import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../src/core/index.js';

// Two modules once both exported `dayKey`; `export *` silently dropped both. Keep the barrel names unique.
test('core barrel exposes distinct day-key helpers', () => {
  assert.equal(typeof core.dayKey, 'function');
  assert.equal(typeof core.bookDayKey, 'function');
  assert.equal(core.dayKey(Date.UTC(2026, 10, 4, 5)), '2026-11-04');
  assert.equal(core.bookDayKey({t: Date.UTC(2026, 10, 4, 5)}), '2026-11-04');
  assert.equal(core.bookDayKey({}), '');
});
