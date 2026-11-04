import test from 'node:test';
import assert from 'node:assert/strict';
import {monthGrid,shiftMonth,monthTitle,dayState,weekStrip,calendarLeaf,monthOf} from '../src/ui/dailyCalendar.js';
import {dailyLeaves} from '../src/ui/dailyBook.js';
import {toSpreads} from '../src/ui/bookpages.js';

const wordsFor=d=>Array.from({length:7},(_,i)=>({w:'w'+i,pos:'noun',def:'d'+i}));
const rec={depth:300,avg:55,best:3,books:[{w:'a',pos:'noun',def:'x',score:55,tier:3,answer:'hi'}]};

test('month grid starts on the right weekday and covers the month in whole weeks',()=>{
 const g=monthGrid('2026-11'); // 1 Nov 2026 is a Sunday
 assert.equal(g[0][0],'2026-11-01');assert.equal(g.flat().filter(Boolean).length,30);
 assert.ok(g.every(w=>w.length===7));
 const f=monthGrid('2028-02');assert.equal(f.flat().filter(Boolean).length,29); // leap year
 assert.equal(monthGrid('2026-12')[0].findIndex(Boolean),2); // 1 Dec 2026 is a Tuesday
});
test('month paging crosses year boundaries',()=>{
 assert.equal(shiftMonth('2026-12',1),'2027-01');assert.equal(shiftMonth('2027-01',-1),'2026-12');
 assert.equal(monthTitle('2026-11'),'November 2026');
});
test('UTC day-key edge: 23:59 and 00:00 UTC fall on different days, before No. 1 is not selectable',()=>{
 const S={daily:{'2026-11-04':rec}};
 assert.equal(monthOf('2026-11-30'),'2026-11');
 assert.equal(dayState(S,'2026-11-02','2026-11-04'),'none'); // before No. 1
 assert.equal(dayState(S,'2026-11-03','2026-11-04'),'missed');
 assert.equal(dayState(S,'2026-11-04','2026-11-04'),'played');
 assert.equal(dayState(S,'2026-11-05','2026-11-04'),'none'); // future
 assert.equal(dayState({daily:{}},'2026-11-04','2026-11-04'),'today');
 const w=weekStrip(S,'2026-12-01'); // week spans a month end
 assert.equal(w.length,7);assert.equal(w[0].key,'2026-11-25');assert.equal(w[6].key,'2026-12-01');
});
test('calendar leaf circles played days in tier ink, shows Daily No. links and the streak margin note',()=>{
 const S={daily:{'2026-11-04':rec}};
 const {start,leaves}=dailyLeaves(S,'2026-11-04',{wordsFor,streak:1});
 const cal=leaves[1];
 assert.match(cal,/November 2026/);assert.match(cal,/cal-d played/);assert.match(cal,/--ink-tier:/);
 assert.ok(cal.includes(`data-spread="${start}"`)); // today = newest = first day spread
 assert.ok(cal.includes(`data-spread="${start+1}"`)); // 3 Nov = No. 1
 assert.match(cal,/No\. 2, 2026-11-04/);assert.match(cal,/1 day in a row/);
 assert.ok(!/data-month="2026-10"[^>]*>/.test(cal)||/data-month="2026-10"[^>]*disabled/.test(cal)); // cannot page before the first month
});
test('book layout keeps every day on a left page with the calendar added',()=>{
 for(const today of ['2026-11-04','2026-11-20','2027-02-01']){
  const {entries,start,leaves}=dailyLeaves({daily:{}},today,{wordsFor});
  assert.equal(leaves.length,start*2+entries.length*2);
  const sp=toSpreads(leaves);assert.ok(sp[0].r.includes('cal-grid'));
  assert.ok(sp[start].l.includes('No. '+entries[0].no));
 }
});
test('paging to another month keeps the spread numbers of days',()=>{
 const {start,leaves}=dailyLeaves({daily:{}},'2026-12-10',{wordsFor,month:'2026-11'});
 assert.match(leaves[1],/November 2026/);assert.ok(leaves[1].includes(`data-spread="${start+30}"`)); // 10 Dec is No.38 (newest, spread start); 10 Nov is No.8 -> start+30
});

test('played days draw a pen ring; today gets an animated underline; reduced motion stops both',async()=>{
 const {readFileSync}=await import('node:fs');
 const js=readFileSync(new URL('../src/ui/dailyCalendar.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/ui/dailyCalendar.css',import.meta.url),'utf8');
 assert.match(js,/cal-ring/);
 assert.match(css,/@keyframes cal-ring/);assert.match(css,/@keyframes cal-underline/);
 const rm=css.slice(css.indexOf('prefers-reduced-motion'));
 assert.match(rm,/cal-ring path/);assert.match(rm,/animation:none/);
});
