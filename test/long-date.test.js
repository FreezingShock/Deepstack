// The Card and the Daily ledger print dates in one form: "Monday, 6 November 2026".
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {longDate} from '../src/core/dates.js';

test('longDate writes the weekday, day, month and year in the ledger form', () => {
  assert.equal(longDate('2026-11-06'), 'Friday, 6 November 2026');
  assert.equal(longDate('2026-01-01'), 'Thursday, 1 January 2026');
});
