import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isLit,profile,brazierProps} from '../src/ui/litProps.js';
import {eyeStep,pickSpot,createEyes,eyesAllowed,waitFor,FLEE_R,SPAWN_FAR} from '../src/ui/eyes.js';
import {mulberry} from '../src/app/state.js';

test('braziers always burn, only some Hollow candles do, urns never',()=>{
 assert.ok(isLit({k:'brazier',x:5}));assert.ok(!isLit({k:'urn',x:3}));
 const lit=[...Array(300).keys()].filter(i=>isLit({k:'candle',x:i*13.7})).length;
 assert.ok(lit>60&&lit<150);
 assert.ok(profile({k:'brazier'}).r>profile({k:'candle'}).r);
});
test('braziers only in the Abyss, spaced apart, deterministic',()=>{
 const a=brazierProps({motif:'abyss'},1280,mulberry(3)),b=brazierProps({motif:'abyss'},1280,mulberry(3));
 assert.deepEqual(a,b);assert.ok(a.length>=1&&a.length<=3);
 assert.equal(brazierProps({motif:'hollow'},1280,mulberry(3)).length,0);
});
const dark=()=>0,env=(o={})=>({W:1280,H:800,rects:[{x:300,y:100,w:680,h:500}],ptr:{x:-99,y:-99,on:false},lit:dark,dark:.4,rnd:mulberry(9),...o});
test('eyes open only in the dark, away from alcoves, HUD and the pointer',()=>{
 for(let i=0;i<50;i++){const p=pickSpot(mulberry(i+1),env({ptr:{x:100,y:300,on:true}}));
  if(!p)continue;
  assert.ok(p.y>=90&&p.y<=630);assert.ok(Math.hypot(p.x-100,p.y-300)>=SPAWN_FAR);
  assert.ok(!(p.x>250&&p.x<1030&&p.y>50&&p.y<650));}
 assert.equal(pickSpot(mulberry(1),env({lit:()=>1})),null);
});
test('eyes wait, open, then flee when the cursor light arrives',()=>{
 const s=createEyes(()=>0);s.t=.1;const e=env({rects:[]});
 eyeStep(s,.2,e);assert.equal(s.phase,'watch');
 for(let i=0;i<40;i++)eyeStep(s,.05,e);assert.ok(s.a>.99);
 e.ptr={x:s.x+FLEE_R-20,y:s.y,on:true};eyeStep(s,.016,e);assert.equal(s.phase,'flee');
 const x0=s.x;for(let i=0;i<30;i++)eyeStep(s,.03,e);
 assert.equal(s.phase,'wait');assert.equal(s.a,0);assert.ok(s.t>20);assert.ok(Math.abs(s.x-x0)>10);
});
test('eyes leave on their own, and when something lights them',()=>{
 const s=createEyes(()=>0);s.t=0;const e=env({rects:[]});eyeStep(s,.1,e);
 for(let i=0;i<400&&s.phase==='watch';i++)eyeStep(s,.05,e);assert.equal(s.phase,'flee');
 const s2=createEyes(()=>0);s2.t=0;eyeStep(s2,.1,e);eyeStep(s2,.1,{...e,lit:()=>1});assert.equal(s2.phase,'flee');
});
test('off in reduced motion, on Low quality and on the lit floors; rarer on top',()=>{
 assert.ok(eyesAllowed({still:false,ambient:true,dark:.4}));
 assert.ok(!eyesAllowed({still:true,ambient:true,dark:.4}));assert.ok(!eyesAllowed({still:false,ambient:false,dark:.4}));assert.ok(!eyesAllowed({still:false,ambient:true,dark:.06}));
 assert.ok(waitFor(.4,.5)<waitFor(.14,.5)&&waitFor(.14,.5)>30);
});
