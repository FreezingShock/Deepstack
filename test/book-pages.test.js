import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chunk,toSpreads} from '../src/ui/bookpages.js';
import {shelfPages,statsLeaves} from '../src/ui/bookMenus.js';
import {FLOORS,floorStartFt} from '../src/core/floors.js';

test('chunk always returns at least one page',()=>{
 assert.deepEqual(chunk([],3),[[]]);
 assert.deepEqual(chunk([1,2,3,4,5],2),[[1,2],[3,4],[5]]);
});
test('toSpreads pairs leaves and pads an odd last page',()=>{
 assert.deepEqual(toSpreads(['a','b','c']),[{l:'a',r:'b'},{l:'c',r:''}]);
 assert.equal(toSpreads([]).length,1);
});
test('shelf pages repeat a group heading when it spills over',()=>{
 const items=Array.from({length:5},(_,i)=>({b:{w:'w'+i},i}));
 const pages=shelfPages([{label:'Codex',items}],3);
 assert.equal(pages.length,2);
 assert.equal(pages[0][0].cont,false);
 assert.equal(pages[1][0].cont,true);
 assert.equal(pages[1][0].items.length,2);
});
test('stats leaves: one empty page, several when there are runs',()=>{
 const TIERS=Array.from({length:7},(_,i)=>({id:i,name:'T'+i,spine:'#fff'}));
 assert.equal(statsLeaves({runs:0},{},{TIERS,FLOORS,floorStartFt}).length,1);
 const st={runs:2,books:14,answered:12,tiers:[1,2,3,0,0,0,0],rarest:2,best:{w:'tempest',score:80,tier:2},deepest:400,deepestDay:'2026-11-01',totalFt:800,avg:50,streak:2,bestStreak:3,recent:[{day:'2026-11-01',depth:400,avg:50,best:2}]};
 const l=statsLeaves(st,{bestFloor:1},{TIERS,FLOORS,floorStartFt});
 assert.equal(l.length,4);
 assert.match(l[3],/Undiscovered/);
});
