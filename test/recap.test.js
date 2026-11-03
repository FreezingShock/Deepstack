import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeRun,setsTouched} from '../src/core/recap.js';

const b=(w,tier,score,o={})=>({w,tier,score,answer:'x',ft:8,...o});
test('summarizeRun totals combo, hints, skips and best book',()=>{
  const d={setBonus:150,books:[b('a',3,50,{combo:{n:2,mult:1.25,ft:2},hints:1}),b('b',4,70,{combo:{n:3,mult:1.5,ft:5}}),{w:'c',tier:0,score:0,answer:'',ft:0}]};
  const r=summarizeRun(d);
  assert.equal(r.answered,2);assert.equal(r.skipped,1);assert.equal(r.bestCombo,3);assert.equal(r.comboFt,7);
  assert.equal(r.hints,1);assert.equal(r.top.w,'b');assert.equal(r.setFt,150);assert.deepEqual(r.tiers.slice(3,5),[1,1]);
});
test('summarizeRun tolerates empty/old records',()=>{
  assert.equal(summarizeRun({}).total,0);assert.equal(summarizeRun(undefined).top,null);
});
test('setsTouched matches by word',()=>{
  const st=[{words:['frost','drizzle']},{words:['meadow']}];
  assert.equal(setsTouched([b('Frost',1,20)],st).length,1);
});
