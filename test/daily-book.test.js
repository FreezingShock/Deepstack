import test from 'node:test';
import assert from 'node:assert/strict';
import {DAILY_EPOCH,dailyNumber,dailyKeyOf,dailyKeys,dailyWords} from '../src/core/daily.js';
import {dailyEntries,dailyLeaves,dayLeaves,longDate} from '../src/ui/dailyBook.js';
import {toSpreads} from '../src/ui/bookpages.js';

test('Daily No. 1 is 3 November 2026 and today (4 Nov) is No. 2',()=>{
 assert.equal(DAILY_EPOCH,'2026-11-03');
 assert.equal(dailyNumber('2026-11-03'),1);
 assert.equal(dailyNumber('2026-11-04'),2);
 assert.equal(dailyKeyOf(2),'2026-11-04');
 assert.deepEqual(dailyKeys('2026-11-05'),['2026-11-03','2026-11-04','2026-11-05']);
 assert.deepEqual(dailyKeys('2026-01-01'),['2026-01-01']);
});
const wordsFor=d=>Array.from({length:7},(_,i)=>({w:'w'+i+d.slice(-2),pos:'noun',def:'def '+i}));
const rec={depth:300,avg:55,best:3,books:Array.from({length:7},(_,i)=>({w:'p'+i,pos:'noun',def:'pdef'+i,score:50+i,tier:2,answer:i===6?'':'my answer '+i}))};

test('today unplayed is sealed: none of its words or definitions appear',()=>{
 const S={daily:{}};
 const e=dailyEntries(S,'2026-11-04',wordsFor);
 assert.equal(e[0].key,'2026-11-04');assert.equal(e[0].words,null);
 const html=dayLeaves(e[0]).join('');
 assert.ok(!/w0|def 0/.test(html));assert.match(html,/sealed/);
 /* yesterday unplayed shows its words */
 assert.ok(dayLeaves(e[1]).join('').includes('w004'.replace('w004','w003')));
});
test('a played day lists its words, definitions and results; skipped words say so',()=>{
 const S={daily:{'2026-11-04':rec}};
 const e=dailyEntries(S,'2026-11-04',wordsFor)[0];
 const [l,r]=dayLeaves(e);
 assert.ok(l.includes('p0')&&l.includes('pdef6'));
 assert.ok(r.includes('my answer 0')&&r.includes('skipped')&&r.includes('300'));
});
test('book has a cover, contents and one spread per day, with days starting on a left page',()=>{
 const S={daily:{'2026-11-04':rec}};
 for(const today of ['2026-11-04','2026-11-20','2027-02-01']){
  const {entries,start,leaves}=dailyLeaves(S,today,{wordsFor});
  assert.equal(leaves.length,start*2+entries.length*2);
  const sp=toSpreads(leaves);
  assert.equal(sp.length,start+entries.length);
  assert.ok(sp[0].l.includes('Daily No. '+entries[0].no)&&sp[0].l.includes(longDate(today)));
  assert.ok(sp[start].l.includes('No. '+entries[0].no));
 }
});
test('contents links point at the right spread',()=>{
 const {start,leaves}=dailyLeaves({daily:{}},'2026-11-06',{wordsFor});
 const toc=leaves.slice(1,start*2).join('');
 assert.ok(toc.includes(`data-spread="${start}"`));
});
test('real word pool: a given day always yields the same seven words',()=>{
 assert.deepEqual(dailyWords('2026-11-03',7).map(w=>w.w),dailyWords('2026-11-03',7).map(w=>w.w));
});
test('contents split across pages repeat the month heading',()=>{
 const {leaves}=dailyLeaves({daily:{}},'2026-12-20',{wordsFor});
 const toc=leaves.filter(l=>l.includes('dly-toc'));
 assert.ok(toc.length>=3);assert.ok(toc.some(l=>l.includes('· cont.')));
});
