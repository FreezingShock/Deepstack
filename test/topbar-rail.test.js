import {test} from 'node:test';
import assert from 'node:assert/strict';
import {railValues} from '../src/ui/topbarRailCore.js';

test('rail shows a live streak and the deepest ft', () => {
 assert.deepEqual(railValues({streak:{last:'2026-11-06',n:4},bestDepth:252.4},'2026-11-06'),{streak:4,deepest:252});
});
test('a lapsed streak reads 0 and a missing save is safe', () => {
 assert.equal(railValues({streak:{last:'2026-11-01',n:4}},'2026-11-06').streak,0);
 assert.deepEqual(railValues({},'2026-11-06'),{streak:0,deepest:0});
 assert.deepEqual(railValues(null,'2026-11-06'),{streak:0,deepest:0});
});
