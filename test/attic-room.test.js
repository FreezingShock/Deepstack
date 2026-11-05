import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planRows} from '../src/world/atticRoom.js';

const mk=(n,recent=0)=>Array.from({length:n},(_,i)=>({b:{w:'w'+i,tier:1},i,recent:i<recent}));
import {bookAge} from '../src/world/atticRoom.js';
test('older books age more: by time, and by rank so the oldest are always the dustiest',()=>{
 const now=Date.now();
 assert.equal(bookAge({t:now},0,10,now),0);
 assert.equal(bookAge({t:now-30*864e5},0,10,now),1);
 assert.ok(bookAge({},9,10,now)>bookAge({},2,10,now));
 assert.ok(bookAge({},9,10,now)<=1);
 assert.equal(bookAge(null,0,1,now),0);
});

import {swayAngle as _sw,lanternPos as _lp,propUnit} from '../src/world/atticProps.js';
test('lantern sways, and holds still for reduced motion or low quality',()=>{
 assert.equal(_sw(3,{RM:true}),0);assert.equal(_sw(3,{glow:false}),0);
 assert.ok(Math.abs(_sw(1.4))>0&&Math.abs(_sw(1.4))<.12);
 const p=_lp(1000,0,800,.38,0);assert.equal(p.x,p.px);assert.ok(p.y>p.py);
 assert.ok(propUnit(375)<propUnit(1280));
});
