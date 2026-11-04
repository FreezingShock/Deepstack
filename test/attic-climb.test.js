import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ladderGeom,climbLight} from '../src/world/atticClimb.js';

test('the ladder slides in from the left edge and is fully in by a fifth of the climb',()=>{
 for(const [W,H] of [[375,667],[1280,800]]){
  const a=ladderGeom(W,H,100,0),b=ladderGeom(W,H,100,.11),c=ladderGeom(W,H,100,.3);
  assert.equal(a.alpha,0);assert.ok(a.x<0);
  assert.ok(b.x>a.x&&b.x<c.x);assert.equal(c.alpha,1);assert.ok(c.x>=0);
 }
});
test('rungs are anchored to the hatch: they slide down the screen as the floor does, never above the rail top',()=>{
 const a=ladderGeom(1280,800,200,.5),b=ladderGeom(1280,800,260,.5);
 assert.ok(a.rungs.length>0);
 assert.equal(+(b.topY-a.topY).toFixed(3),60);
 for(const y of a.rungs)assert.ok(y>=a.topY);
});
test('the light grows monotonically from dark to full and reaches both ends exactly',()=>{
 assert.equal(climbLight(0),0);assert.equal(climbLight(1),1);
 let p=0;for(let i=1;i<=20;i++){const v=climbLight(i/20);assert.ok(v>=p);p=v;}
});
