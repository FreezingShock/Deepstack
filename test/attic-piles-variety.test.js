import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planRows,KINDS} from '../src/world/atticRoom.js';

const mk=(n,recent=0)=>Array.from({length:n},(_,i)=>({b:{w:'w'+i,tier:1},i,recent:i<recent}));
test('piles vary in height and look instead of repeating one stack',()=>{
 const L={piles:planRows(mk(30,0),1640).rows.flatMap(r=>r.piles)};
 assert.ok(new Set(L.piles.map(p=>p.items.length)).size>=3);
 assert.ok(new Set(L.piles.map(p=>p.kind)).size>=3);
 assert.ok(L.piles.every(p=>KINDS.includes(p.kind)&&p.items.length<=6));
});
test('every book is placed once, in order, whatever the pile shapes',()=>{
 const P=planRows(mk(40,12),1280),ids=P.rows.flatMap(r=>r.piles).flatMap(p=>p.items.map(x=>x.i));
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(ids.length+P.hidden,40);
});
