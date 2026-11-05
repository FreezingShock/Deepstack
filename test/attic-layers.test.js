import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planRows,rowScale,floorGeom,DMAX,FARS} from '../src/world/atticRoom.js';
import {atticTidy,atticSections} from '../src/core/attic.js';

const mk=(n,recent=0,t0=Date.UTC(2026,8,1))=>Array.from({length:n},(_,i)=>({b:{w:'w'+i,tier:1,t:t0-i*864e5*(i<recent?0:12)},i,recent:i<recent}));
test('the same word is shown once, with a tally, newest first',()=>{
 const items=[{b:{w:'Cabaret'},i:5,recent:true},{b:{w:'graveyard'},i:4,recent:true},{b:{w:'cabaret'},i:3},{b:{w:'Cabaret'},i:1},{b:{w:'moon'},i:0}];
 const t=atticTidy(items);
 assert.deepEqual(t.map(x=>[x.b.w,x.n,x.i]),[['Cabaret',3,5],['graveyard',1,4],['moon',1,0]]);
});
test('sections: recent guesses first, then one per month found, newest month first',()=>{
 const items=[{b:{w:'a',t:Date.UTC(2026,9,3)},i:0,recent:true},{b:{w:'b',t:Date.UTC(2026,7,3)},i:1},{b:{w:'c',t:Date.UTC(2026,8,3)},i:2},{b:{w:'d'},i:3}];
 assert.deepEqual(atticSections(items).map(x=>x.key),['recent','2026-09','2026-08','none']);
});
test('rows: each section opens with its sign; every book is placed once or counted hidden; rows never overflow the width',()=>{
 for(const W of[375,1280,1640]){
  const items=mk(120,40),{rows,hidden,pileW,fit}=planRows(items,W,{maxRows:200});
  const ids=rows.flatMap(r=>r.piles.flatMap(p=>p.items.map(x=>x.i)));
  assert.equal(new Set(ids).size,ids.length);assert.equal(ids.length+hidden,120);
  for(const r of rows){assert.ok(r.piles.length<=fit);for(const p of r.piles)assert.ok(p.x-pileW/2>=-1&&p.x+pileW/2<=W+1);}
  const secs=new Set(rows.map(r=>r.sec));
  for(const s of secs)assert.equal(rows.filter(r=>r.sec===s&&r.sign).length,1);
  assert.ok(rows.filter(r=>r.sign).every(r=>rows.indexOf(r)===rows.findIndex(q=>q.sec===r.sec)));
 }
 assert.equal(planRows([],1280).rows.length,0);
 const capped=planRows(mk(500,0),375,{maxRows:6});assert.equal(capped.rows.length,6);assert.ok(capped.hidden>0);
});
test('rows shrink with distance, pass the camera at the front, and the floor ends at the back wall',()=>{
 assert.equal(rowScale(0),1);assert.ok(rowScale(3)<rowScale(1));assert.ok(rowScale(-1)>1);
 assert.ok(Math.abs(rowScale(DMAX)-FARS)<1e-9);
 const g=floorGeom(1280,800);assert.ok(g.rowY(0)>g.rowY(1)&&g.rowY(1)>g.rowY(DMAX)&&g.rowY(-1)>g.rowY(0));
});
