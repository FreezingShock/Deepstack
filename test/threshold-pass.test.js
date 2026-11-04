import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PASS,doors,dipOffset,tripWeight,passCam,swingAngle,createPass} from '../src/ui/thresholdPass.js';
import {createSting,STINGS} from '../src/sound/thresholdSting.js';
import {FLOORS} from '../src/core/floors.js';

const RH=150,H=800;
test('every floor with a door gets a threshold, the Stacks do not',()=>{
  const d=doors(RH,H);assert.equal(d.length,FLOORS.length-1);assert.ok(d.every(x=>x.row>0));
});
test('trip ends are never moved, reduced motion never moves the camera',()=>{
  assert.equal(tripWeight(0),0);assert.equal(tripWeight(1),0);assert.equal(tripWeight(.5),1);
  const door=doors(RH,H)[0].cam;
  assert.equal(passCam(door,0,RH,H,false),door);
  assert.equal(passCam(door,1,RH,H,false),door);
  assert.equal(passCam(door,.5,RH,H,true),door);
});
test('travel is slowed at the threshold and monotonic through it',()=>{
  const door=doors(RH,H)[1].cam;let prev=-Infinity,minStep=Infinity;
  for(let c=door-RH*4;c<=door+RH*4;c+=2){const w=passCam(c,.5,RH,H,false);assert.ok(w>prev);minStep=Math.min(minStep,w-prev);prev=w;}
  const step=(c)=>passCam(c+1,.5,RH,H,false)-passCam(c,.5,RH,H,false);
  assert.ok(Math.abs(step(door)-(1-PASS.dip))<.02);
  assert.ok(Math.abs(step(door-RH*8)-1)<1e-6);
  assert.equal(dipOffset(door,RH,H),0);
});
test('sign swing dies away and flips with direction',()=>{
  assert.equal(swingAngle(0),0);assert.equal(swingAngle(PASS.swingMs+1),0);
  const a=swingAngle(280),b=swingAngle(280,-1);assert.ok(a>0&&b===-a);assert.ok(Math.abs(a)<=PASS.swing);
});
test('crossing a door line starts a swing, once',()=>{
  const p=createPass(),d=doors(RH,H)[0];
  assert.deepEqual(p.track(d.cam-20,0,RH,H,false),[]);
  assert.deepEqual(p.track(d.cam+20,16,RH,H,false),[d.key]);
  assert.deepEqual(p.track(d.cam+40,32,RH,H,false),[]);
  assert.notEqual(p.angle(d.row,200),0);assert.equal(p.angle(d.row,PASS.swingMs+500),0);
});
test('no swing in reduced motion or after a jump',()=>{
  const p=createPass(),d=doors(RH,H)[0];
  p.track(d.cam-20,0,RH,H,true);assert.deepEqual(p.track(d.cam+20,16,RH,H,true),[]);
  const q=createPass();q.track(0,0,RH,H,false);assert.deepEqual(q.track(d.cam+RH*20,16,RH,H,false),[]);
});
test('sting is quiet when sound is off and rate limited',()=>{
  let n=0,t=0;const ctx={currentTime:0,createBufferSource:()=>({connect(){},start(){},stop(){}}),createBiquadFilter:()=>({frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}}, connect(){}}),
    createGain:()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}),createOscillator:()=>({frequency:{},connect(){},start(){},stop(){}})};
  let on=false;const s=createSting({ctx:()=>ctx,on:()=>on,out:()=>n++,noiseBuf:()=>null},()=>t);
  assert.equal(s.play('vault'),false);on=true;
  assert.equal(s.play('vault'),true);t=500;assert.equal(s.play('vault'),false);t=2000;assert.equal(s.play('abyss'),true);
  assert.equal(s.play('nope'),false);assert.ok(Object.keys(STINGS).length===FLOORS.length-1);
});
