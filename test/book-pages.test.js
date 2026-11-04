import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chunk,toSpreads} from '../src/ui/bookpages.js';
import {shelfPlan,stagger,statsLeaves} from '../src/ui/bookMenus.js';
import {FLOORS,floorStartFt} from '../src/core/floors.js';

test('chunk always returns at least one page',()=>{
 assert.deepEqual(chunk([],3),[[]]);
 assert.deepEqual(chunk([1,2,3,4,5],2),[[1,2],[3,4],[5]]);
});
test('toSpreads pairs leaves and pads an odd last page',()=>{
 assert.deepEqual(toSpreads(['a','b','c']),[{l:'a',r:'b'},{l:'c',r:''}]);
 assert.equal(toSpreads([]).length,1);
});
test('shelf plan fills shelves of eight and keeps each plaque with a shelf',()=>{
 const mk=n=>Array.from({length:n},(_,i)=>({b:{w:'w'+i},i}));
 const pages=shelfPlan([{label:'Codex',items:mk(30)},{label:'Folio',items:mk(3)}]);
 const all=pages.flat();
 assert.equal(all.flatMap(s=>s.shelves).flat().length,33);
 for(const s of all){assert.ok(s.shelves.length>=1);for(const sh of s.shelves)assert.ok(sh.length<=8);}
 for(const pg of pages){const cost=pg.reduce((n,s)=>n+.35+s.shelves.length,0);assert.ok(cost<=4.05+1e-9,String(cost));}
 assert.equal(all[0].cont,false);assert.equal(pages[1][0].cont,true);
 assert.equal(shelfPlan([]).length,1);
});
test('stagger is small and stable',()=>{
 assert.equal(stagger('frost'),stagger('frost'));
 for(const w of ['a','tempest','glacier'])assert.ok(Math.abs(stagger(w))<=4);
});
test('stats leaves: one empty page, several when there are runs',()=>{
 const TIERS=Array.from({length:7},(_,i)=>({id:i,name:'T'+i,spine:'#fff'}));
 assert.equal(statsLeaves({runs:0},{},{TIERS,FLOORS,floorStartFt}).length,1);
 const st={runs:2,books:14,answered:12,tiers:[1,2,3,0,0,0,0],rarest:2,best:{w:'tempest',score:80,tier:2},deepest:400,deepestDay:'2026-11-01',totalFt:800,avg:50,streak:2,bestStreak:3,recent:[{day:'2026-11-01',depth:400,avg:50,best:2}]};
 const l=statsLeaves(st,{bestFloor:1},{TIERS,FLOORS,floorStartFt});
 assert.equal(l.length,4);
 assert.match(l[3],/Undiscovered/);
});
