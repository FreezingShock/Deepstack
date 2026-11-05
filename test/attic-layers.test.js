import {test} from 'node:test';
import assert from 'node:assert/strict';
import {layoutPiles,planSections,sectionY,ROWS} from '../src/world/atticRoom.js';
import {atticTidy,atticSections} from '../src/core/attic.js';

const mk=(n,recent=0,t0=Date.UTC(2026,8,1))=>Array.from({length:n},(_,i)=>({b:{w:'w'+i,tier:1,t:t0-i*864e5*(i<recent?0:12)},i,recent:i<recent}));
test('the same word is shown once, with a tally, newest first',()=>{
 const items=[{b:{w:'Cabaret'},i:5,recent:true},{b:{w:'graveyard'},i:4,recent:true},{b:{w:'cabaret'},i:3},{b:{w:'Cabaret'},i:1},{b:{w:'moon'},i:0}];
 const t=atticTidy(items);
 assert.deepEqual(t.map(x=>[x.b.w,x.n,x.i]),[['Cabaret',3,5],['graveyard',1,4],['moon',1,0]]);
});
test('sections: recent guesses first, then one per month found, newest month first',()=>{
 const items=[{b:{w:'a',t:Date.UTC(2026,9,3)},i:0,recent:true},{b:{w:'b',t:Date.UTC(2026,7,3)},i:1},{b:{w:'c',t:Date.UTC(2026,8,3)},i:2},{b:{w:'d'},i:3}];
 const s=atticSections(items);
 assert.deepEqual(s.map(x=>x.key),['recent','2026-09','2026-08','none']);
 assert.equal(s[3].title,'Undated finds');
});
test('a crowded section continues into the next; every book is placed once or counted hidden',()=>{
 const items=mk(120,120);
 const {sections,hidden}=planSections(items,1280,{max:20});
 const ids=sections.flatMap(s=>s.L.piles.flatMap(p=>p.items.map(x=>x.i)));
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(ids.length+hidden,120);
 assert.ok(sections.every(s=>s.L.piles.every(p=>p.row<ROWS)));
 assert.ok(sections.some(s=>s.cont));
 const few=planSections(mk(3,3),1280);assert.equal(few.sections.length,1);assert.equal(few.hidden,0);
 assert.equal(planSections(mk(500),375,{max:3}).sections.length,3);
});
test('sections stack upward: scrolling up carries the next section down onto the screen',()=>{
 assert.equal(sectionY(0,0,100,400),100);
 assert.equal(sectionY(1,0,100,400),-300);
 assert.equal(sectionY(1,400,100,400),100);
});
