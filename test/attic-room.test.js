import {test} from 'node:test';
import assert from 'node:assert/strict';
import {layoutPiles} from '../src/world/atticRoom.js';

const mk=(n,recent=0)=>Array.from({length:n},(_,i)=>({b:{w:'w'+i,tier:1},i,recent:i<recent}));
test('piles keep recent guesses apart from earlier finds, recent first',()=>{
 const L=layoutPiles(mk(10,6),1280);
 assert.equal(L.piles[0].group,'recent');
 assert.ok(L.piles.some(p=>p.group==='earlier'));
 for(const p of L.piles)assert.ok(p.items.every(x=>!!x.recent===(p.group==='recent')));
 assert.equal(L.piles.reduce((n,p)=>n+p.items.length,0)+L.hidden,10);
});
test('piles sit in at most three rows and never overlap within a row',()=>{
 for(const W of [375,1280]){
  const L=layoutPiles(mk(60),W);
  assert.ok(L.piles.every(p=>p.row>=0&&p.row<3));
  for(let r=0;r<3;r++){const xs=L.piles.filter(p=>p.row===r).map(p=>p.x).sort((a,b)=>a-b);
   for(let k=1;k<xs.length;k++)assert.ok(xs[k]-xs[k-1]>=L.pileW-1e-6);
   for(const x of xs)assert.ok(x-L.pileW/2>=-1&&x+L.pileW/2<=W+1);}
 }
});
test('books past the room capacity are counted, not drawn',()=>{
 const L=layoutPiles(mk(300),375);
 assert.ok(L.hidden>0);
 assert.equal(layoutPiles([],1280).piles.length,0);
});
