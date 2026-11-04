import {test} from 'node:test';
import assert from 'node:assert/strict';
import {travelEase,travelMs,TRAVEL_MIN_MS,TRAVEL_MAX_MS,RM_MS} from '../src/ui/camMotion.js';

test('travelEase hits endpoints and is monotonic',()=>{
  assert.equal(travelEase(0),0);assert.equal(travelEase(1),1);
  let p=0;for(let i=1;i<=200;i++){const v=travelEase(i/200);assert.ok(v>=p);p=v;}
});
test('travelEase accelerates in, cruises, eases out',()=>{
  const v=u=>(travelEase(u+.001)-travelEase(u))/.001;
  assert.ok(v(.02)<v(.2)&&v(.2)<v(.4)+1e-6);
  assert.ok(Math.abs(v(.4)-v(.5))<1e-3);
  assert.ok(v(.98)<v(.7));
});
test('travelMs is clamped and reduced motion is short',()=>{
  assert.equal(travelMs(0),TRAVEL_MIN_MS);
  assert.ok(travelMs(5)>=TRAVEL_MIN_MS);
  assert.equal(travelMs(100000),TRAVEL_MAX_MS);
  assert.ok(travelMs(1008)<=TRAVEL_MAX_MS);
  assert.equal(travelMs(500,true),RM_MS);
});
