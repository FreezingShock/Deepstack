import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bayGroups,pileEdges,ladderSide,floorIdOf,BAY_MODES} from '../src/ui/shelfBays.js';
import {shelfPlan,collapseDupes} from '../src/ui/bookMenus.js';
import {filterShelf,SORTS} from '../src/core/shelf.js';
import {FLOORS,floorStartFt} from '../src/core/floors.js';
import {TIERS,dailyNumber} from '../src/core/index.js';

const ctx={TIERS,FLOORS,floorStartFt,dailyNumber};
const day=(d,h=9)=>new Date(2026,10,d,h).getTime();
const mk=(w,tier,o={})=>({w,tier,score:50,t:day(3),mode:'daily',ft:100,...o});
const items=bs=>bs.map((b,i)=>({b,i,n:1}));

test('bays by rarity: rarest first, with the rarity line',()=>{
 const g=bayGroups(items([mk('a',1),mk('b',4),mk('c',1)]),'tier',ctx);
 assert.deepEqual(g.map(x=>[x.label,x.items.length]),[[TIERS[4].name,1],[TIERS[1].name,2]]);
});
test('bays by floor: descent order, earlier finds with no floor live in the attic, not in a bay',()=>{
 const g=bayGroups(items([mk('a',1,{fl:3}),mk('b',1),mk('c',1,{fl:0})]),'floor',ctx);
 assert.deepEqual(g.map(x=>x.label),[FLOORS[0].name,FLOORS[3].name]);
 assert.equal(floorIdOf({}),-1);
});
test('bays by set: set order, strangers are loose volumes',()=>{
 const g=bayGroups(items([mk('Tempest',2),mk('zzz',2),mk('ephemeral',2)]),'set',ctx);
 assert.deepEqual(g.map(x=>x.label),['Tides of Time','Weather Almanac','Loose volumes']);
});
test('bays by Daily date: newest first, numbered, undated last',()=>{
 const g=bayGroups(items([mk('a',1,{t:day(3)}),mk('b',1,{t:day(5)}),{w:'old',tier:1,score:1}]),'day',ctx);
 assert.equal(g[0].label,'No. '+dailyNumber('2026-11-05'));assert.equal(g[1].label,'No. '+dailyNumber('2026-11-03'));assert.equal(g[2].label,'Earlier');
});
test('together is one bay; every mode is listed',()=>{
 assert.equal(bayGroups(items([mk('a',1)]),'none',ctx).length,1);
 assert.equal(BAY_MODES.length,5);
});
test('new sort modes',()=>{
 const sh=[mk('ab',1,{ft:10}),mk('abcdef',1,{ft:300}),mk('abc',1,{ft:50})];
 assert.deepEqual(filterShelf(sh,{sort:'deep'}).map(x=>x.b.w),['abcdef','abc','ab']);
 assert.deepEqual(filterShelf(sh,{sort:'long'}).map(x=>x.b.w),['abcdef','abc','ab']);
 assert.ok(SORTS.deep&&SORTS.long);
});
test('piles and ladders',()=>{
 assert.deepEqual([1,2,9].map(pileEdges),[0,1,3]);
 assert.equal(ladderSide('x',1),'');assert.ok(['l','r'].includes(ladderSide('x',3)));
});
test('a 200-book shelf plans and groups under 16 ms; 14-letter titles survive',()=>{
 const bs=Array.from({length:200},(_,i)=>mk(i%5?'word'+i:'incomprehensible',i%7,{t:day(1+i%20),fl:i%6}));
 const t0=performance.now();
 const list=collapseDupes(filterShelf(bs,{sort:'new'}));
 const g=bayGroups(list,'floor',ctx);const pages=shelfPlan(g);
 const ms=performance.now()-t0;
 assert.ok(ms<16,'took '+ms);
 assert.equal(pages.flat().flatMap(s=>s.shelves).flat().length,list.length);
 assert.ok(pages.flat().every(s=>typeof s.count==='number'&&s.label));
});
