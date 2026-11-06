import test from 'node:test';
import assert from 'node:assert/strict';
import {ascendMs,travelMs} from '../src/ui/camMotion.js';
test('return home is under 1.2s and faster than a descent',()=>{
  for(const d of [0,5,50,300]){assert.ok(ascendMs(d)<=1200);assert.ok(ascendMs(d)<=travelMs(d));}
  assert.equal(ascendMs(10,true),200);
});
