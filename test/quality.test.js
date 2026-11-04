import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createQuality,createFrameWatch,detectTier,TIERS,QUALITY_KEY,sanitizePref,stepDown} from '../src/ui/quality.js';

const store=()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=v;},m};};
const doc=()=>({documentElement:{dataset:{}}});

test('tiers only get cheaper',()=>{
 const [h,m,l]=['high','medium','low'].map(k=>TIERS[k]);
 for(const k of ['dprMax','particles','particleCap','dust']){assert.ok(h[k]>m[k]&&m[k]>l[k],k);}
 assert.equal(h.frameMs,0);assert.ok(l.frameMs>0);assert.equal(l.ambient,false);
});
test('detectTier reads device hints',()=>{
 assert.equal(detectTier({}),'high');
 assert.equal(detectTier({deviceMemory:8,hardwareConcurrency:8}),'high');
 assert.equal(detectTier({deviceMemory:4,hardwareConcurrency:4}),'medium');
 assert.equal(detectTier({deviceMemory:2,hardwareConcurrency:8}),'low');
 assert.equal(detectTier({hardwareConcurrency:2}),'low');
 assert.equal(detectTier({saveData:true,deviceMemory:16}),'low');
});
test('pref is sanitised, persisted and sets the html attribute',()=>{
 const st=store(),d=doc(),q=createQuality({storage:st,env:{},doc:d});
 assert.equal(q.pref(),'auto');assert.equal(d.documentElement.dataset.quality,'high');
 q.setPref('low');assert.equal(q.tier(),'low');assert.equal(d.documentElement.dataset.quality,'low');
 assert.equal(JSON.parse(st.m[QUALITY_KEY]).pref,'low');
 assert.equal(createQuality({storage:st,env:{}}).tier(),'low');
 q.setPref('bogus');assert.equal(q.pref(),'auto');assert.equal(sanitizePref(7),'auto');
 st.m[QUALITY_KEY]='{bad';assert.equal(createQuality({storage:st,env:{}}).pref(),'auto');
});
test('scale keeps at least one particle and respects the tier',()=>{
 const q=createQuality({storage:store(),env:{}});
 assert.equal(q.scale(10),10);assert.equal(q.scale(0),0);
 q.setPref('low');assert.equal(q.scale(10),3);assert.equal(q.scale(1),1);
});
test('subscribers hear tier changes once',()=>{
 const q=createQuality({storage:store(),env:{}});let seen=[];q.subscribe(p=>seen.push(p.name));
 q.setPref('medium');q.setPref('medium');q.setPref('low');
 assert.deepEqual(seen,['medium','low']);
});
const run=(q,ms,frames)=>{let t=0;for(let i=0;i<frames;i++){t+=ms;q.sample(t);}};
test('auto steps down on slow frames, at most twice, and never on a manual pref',()=>{
 const q=createQuality({storage:store(),env:{},watch:createFrameWatch({n:10,skip:2})});
 run(q,16,40);assert.equal(q.tier(),'high');
 run(q,50,40);assert.equal(q.tier(),'low'); // two steps: high -> medium -> low
 const m=createQuality({storage:store(),env:{},watch:createFrameWatch({n:10,skip:2})});
 m.setPref('high');run(m,60,60);assert.equal(m.tier(),'high');
});
test('stalls from hidden tabs are not a signal',()=>{
 const w=createFrameWatch({n:5,skip:0});let t=0,r;
 for(let i=0;i<20;i++){t+=1000;r=w.feed(t);assert.ok(r===null);}
});
test('stepDown stops at low',()=>{assert.equal(stepDown('high'),'medium');assert.equal(stepDown('low'),'low');});
