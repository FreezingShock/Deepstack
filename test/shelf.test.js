import test from 'node:test';
import assert from 'node:assert/strict';
import {filterShelf,groupShelf,EXTRA_FILTERS} from '../src/core/shelf.js';
const shelf=[
  {w:'zephyr',tier:1,score:40,t:new Date(2026,0,1,5+3).getTime()},
  {w:'apogee',tier:3,score:80,t:new Date(2026,0,1,9+3).getTime(),fav:true},
  {w:'quixotic',tier:3,score:75,t:new Date(2026,0,2,9+3).getTime()},
];
test('filters by tier and text, sorts',()=>{
  assert.deepEqual(filterShelf(shelf,{tier:3}).map(x=>x.b.w),['quixotic','apogee']);
  assert.deepEqual(filterShelf(shelf,{q:'ZEP'}).map(x=>x.b.w),['zephyr']);
  assert.deepEqual(filterShelf(shelf,{sort:'az'}).map(x=>x.b.w),['apogee','quixotic','zephyr']);
});
test('favourites filter',()=>{assert.deepEqual(filterShelf(shelf,{fav:true}).map(x=>x.b.w),['apogee']);});
test('extra filters are pluggable',()=>{
  EXTRA_FILTERS.long=x=>x.b.w.length>6;
  assert.deepEqual(filterShelf(shelf,{long:true}).map(x=>x.b.w),['quixotic']);
  delete EXTRA_FILTERS.long;
});
test('groups by day and tier',()=>{
  const items=filterShelf(shelf,{});
  const d=groupShelf(items,'day');assert.deepEqual(d.map(g=>[g.key,g.items.length]),[['2026-01-02',1],['2026-01-01',2]]);
  const t=groupShelf(items,'tier',['a','b','c','Folio']);assert.equal(t[0].label,'Folio');
  assert.equal(groupShelf(items,'none').length,1);
});
