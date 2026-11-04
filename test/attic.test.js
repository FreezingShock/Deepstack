import test from 'node:test';
import assert from 'node:assert/strict';
import {backfillFloors,atticItems,atticCrates,hasFloor,recentItems,atticAll} from '../src/core/attic.js';
import {floorAtFt} from '../src/core/floors.js';

const T=Date.UTC(2026,10,3,12);
const mk=(w,ft,t)=>({w,ft,t,tier:1,score:40,mode:'daily'});
const day=(books)=>({books,depth:books.reduce((a,b)=>a+b.ft,0)});

test('backfill infers the floor from the depth a Daily run had reached',()=>{
 const a=mk('alpha',120,T),b=mk('beta',200,T+1),c=mk('gamma',90,T+2);
 const S={shelf:[{...a},{...b},{...c}],daily:{'2026-11-03':day([a,b,c])}};
 assert.equal(backfillFloors(S),3);
 assert.deepEqual(S.shelf.map(x=>x.fl),[floorAtFt(0).id,floorAtFt(120).id,floorAtFt(320).id]);
 assert.ok(S.shelf.every(x=>x.fli===1));
 assert.equal(atticItems(S.shelf).length,0);
});
test('backfill never overwrites a recorded floor and is idempotent',()=>{
 const a=mk('alpha',300,T),b=mk('beta',10,T+1);
 const S={shelf:[{...a,fl:0},{...b}],daily:{d:day([a,b])}};
 assert.equal(backfillFloors(S),1);
 assert.equal(S.shelf[0].fl,0);assert.equal(S.shelf[0].fli,undefined);
 assert.equal(S.shelf[1].fl,floorAtFt(300).id);
 assert.equal(backfillFloors(S),0);
});
test('books with no Daily record stay for the attic; bad or missing data is tolerated',()=>{
 const S={shelf:[{w:'old',tier:0,score:5,t:T,mode:'unlimited'},{w:'undated',tier:0,score:5}],daily:{x:{books:[{w:'old',t:T}]},y:null,z:{practice:true,books:[]}}};
 assert.equal(backfillFloors(S),0);
 assert.equal(atticItems(S.shelf).length,2);
 assert.equal(backfillFloors({}),0);assert.equal(backfillFloors({shelf:[],daily:{}}),0);
 assert.equal(hasFloor({fl:0}),true);assert.equal(hasFloor({fl:-1}),false);assert.equal(hasFloor({}),false);
});
test('attic lists newest first and crates group by month, unmarked last',()=>{
 const shelf=[{w:'a',t:Date.UTC(2026,9,5)},{w:'b',t:Date.UTC(2026,10,5)},{w:'c'},{w:'d',t:Date.UTC(2026,10,9)}];
 const items=atticItems(shelf);
 assert.deepEqual(items.map(x=>x.b.w),['d','b','a','c']);
 const crates=atticCrates(items);
 assert.deepEqual(crates.map(c=>c.key),['2026-11','2026-10','none']);
 assert.equal(crates[2].label,'Unmarked');
 assert.equal(atticCrates(items,{perCrate:1}).length,4);
});
test('attic holds recent guesses first (newest first), then floorless finds, never twice',()=>{
 const shelf=[{w:'old',t:1},{w:'a',fl:0,t:2},{w:'b',fl:1,t:3},{w:'c',fl:1,t:4}];
 assert.deepEqual(recentItems(shelf,2).map(x=>x.b.w),['c','b']);
 const all=atticAll(shelf,2);
 assert.deepEqual(all.map(x=>x.b.w),['c','b','old']);
 assert.equal(all.filter(x=>x.recent).length,2);
 assert.equal(atticAll(shelf,12).length,4);
 assert.deepEqual(atticAll([]),[]);
});
