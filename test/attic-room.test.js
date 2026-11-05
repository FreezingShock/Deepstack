import {test} from 'node:test';
import assert from 'node:assert/strict';
import {layoutPiles} from '../src/world/atticRoom.js';

const mk=(n,recent=0)=>Array.from({length:n},(_,i)=>({b:{w:'w'+i,tier:1},i,recent:i<recent}));
test('piles sit in at most three rows and never overlap within a row; the rest is returned in order',()=>{
 for(const W of [375,1280]){
  const L=layoutPiles(mk(60),W);
  assert.ok(L.piles.every(p=>p.row>=0&&p.row<3));
  for(let r=0;r<3;r++){const xs=L.piles.filter(p=>p.row===r).map(p=>p.x).sort((a,b)=>a-b);
   for(let k=1;k<xs.length;k++)assert.ok(xs[k]-xs[k-1]>=L.pileW-1e-6);
   for(const x of xs)assert.ok(x-L.pileW/2>=-1&&x+L.pileW/2<=W+1);}
  assert.equal(L.piles.reduce((n,p)=>n+p.items.length,0)+L.rest.length,60);
 }
 assert.equal(layoutPiles([],1280).piles.length,0);
});

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
