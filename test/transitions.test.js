import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OUT_MS,reducedMotion} from '../src/ui/transitions.js';
test('exit duration is short and reduced motion is safe without a DOM',()=>{
 assert.ok(OUT_MS>0&&OUT_MS<=400);
 assert.equal(reducedMotion(),false);
});
