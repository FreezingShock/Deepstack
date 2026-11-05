import {test} from 'node:test';
import assert from 'node:assert/strict';
import {layoutPiles,layerView,MAX_LAYERS,ROWS} from '../src/world/atticRoom.js';
import {atticTidy} from '../src/core/attic.js';

const mk=(n,recent=0)=>Array.from({length:n},(_,i)=>({b:{w:'w'+i,tier:1},i,recent:i<recent}));
test('the same word is shown once, with a tally, newest first',()=>{
 const items=[{b:{w:'Cabaret'},i:5,recent:true},{b:{w:'graveyard'},i:4,recent:true},{b:{w:'cabaret'},i:3},{b:{w:'Cabaret'},i:1},{b:{w:'moon'},i:0}];
 const t=atticTidy(items);
 assert.deepEqual(t.map(x=>[x.b.w,x.n,x.i]),[['Cabaret',3,5],['graveyard',1,4],['moon',1,0]]);
 assert.equal(items.length,5);
});
test('recent guesses and earlier finds never share a row, and extra rows spill into rooms further back',()=>{
 const L=layoutPiles(mk(80,12),1280);
 const rows=new Map();for(const p of L.piles){const k=p.layer*ROWS+p.row;rows.set(k,(rows.get(k)||new Set()).add(p.group));}
 for(const g of rows.values())assert.equal(g.size,1);
 assert.ok(L.layers>1&&L.layers<=MAX_LAYERS);
 assert.equal(L.piles.flatMap(p=>p.items).length+L.hidden,80);
 assert.equal(layoutPiles(mk(3),1280).layers,1);
});
test('rooms farther back are smaller and dimmer; the one you passed fades out',()=>{
 const a=layerView(1,0),b=layerView(2,0);
 assert.ok(b.scale<a.scale&&a.scale<1&&b.dark>a.dark);
 assert.equal(layerView(0,0).alpha,1);assert.equal(layerView(1,1).scale,1);
 assert.equal(layerView(0,1).alpha,0);assert.ok(layerView(0,.6).alpha<1);
});
