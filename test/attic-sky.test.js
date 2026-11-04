import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bandAt,seasonAt,weatherAt,skyAt,precipAt} from '../src/world/sky.js';

test('each hour falls in one band',()=>{
 const want={0:'night',4:'night',5:'dawn',7:'dawn',8:'day',12:'day',16:'day',17:'dusk',19:'dusk',20:'night',23:'night'};
 for(const h in want)assert.equal(bandAt(+h),want[h],'hour '+h);
});
test('seasons follow the calendar month',()=>{
 assert.deepEqual([0,2,5,8,11].map(seasonAt),['winter','spring','summer','autumn','winter']);
});
test('weather is stable for a day and snow only falls in winter',()=>{
 const a=new Date(2026,0,10,8),b=new Date(2026,0,10,22);
 assert.equal(weatherAt(a),weatherAt(b));
 const seen=new Set();
 for(let m=0;m<12;m++)for(let d=1;d<=28;d++)seen.add(seasonAt(m)+':'+weatherAt(new Date(2026,m,d)));
 assert.ok(seen.has('winter:snow'));
 for(const k of seen){if(k.endsWith(':snow'))assert.ok(k.startsWith('winter'));if(k.endsWith(':rain'))assert.ok(!k.startsWith('winter'));}
 assert.ok([...seen].some(k=>k.endsWith(':clear')));
});
test('skyAt pins tint per band and dims at night',()=>{
 const d=h=>skyAt(new Date(2026,6,1,h));
 assert.equal(d(12).band,'day');assert.equal(d(2).band,'night');
 assert.ok(d(2).glow<d(12).glow);
 assert.notDeepEqual(d(6).tint,d(18).tint);
});
test('precipitation stays inside the window and moves with time',()=>{
 for(const kind of ['rain','snow'])for(const p of precipAt(kind,20,3.3)){assert.ok(p.x>=0&&p.x<1&&p.y>=0&&p.y<1);}
 assert.notDeepEqual(precipAt('rain',5,1),precipAt('rain',5,1.5));
});
