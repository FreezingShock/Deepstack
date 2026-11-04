import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dailyRiddleWords,recordRiddleDay,riddleDay,riddleDayStreak,riddleDayShare} from '../src/core/riddleDaily.js';
import {dailyWords} from '../src/core/daily.js';
import {loadRiddle,recordRiddleRun} from '../src/core/riddleStats.js';

test('the same seven definitions for everyone on a day, easiest to hardest',()=>{
  const a=dailyRiddleWords('2026-11-05'),b=dailyRiddleWords('2026-11-05');
  assert.equal(a.length,7);assert.deepEqual(a.map(w=>w.id),b.map(w=>w.id));
  assert.ok(a.every((w,i)=>i===0||a[i-1].d<=w.d));
  assert.equal(new Set(a.map(w=>w.id)).size,7);
});
test('different days differ, and never share a word with that day\'s Daily',()=>{
  assert.notDeepEqual(dailyRiddleWords('2026-11-05').map(w=>w.id),dailyRiddleWords('2026-11-06').map(w=>w.id));
  const daily=new Set(dailyWords('2026-11-05',7).map(w=>w.id));
  assert.ok(dailyRiddleWords('2026-11-05').every(w=>!daily.has(w.id)));
});
test('one attempt a day: a second result is refused and the first stays',()=>{
  const r=loadRiddle(undefined),first={books:[{tier:2,score:40}],solved:0,of:1};
  assert.equal(recordRiddleDay(r,'2026-11-05',first),true);
  assert.equal(recordRiddleDay(r,'2026-11-05',{books:[{tier:6}],solved:1,of:1}),false);
  assert.equal(riddleDay({riddle:r},'2026-11-05'),first);
  assert.equal(riddleDay({riddle:r},'2026-11-06'),null);
});
test('days survive loading, ordinary riddle runs and damaged saves',()=>{
  const r=loadRiddle({runs:1,days:{'2026-11-05':{books:[{tier:1}]}}});
  assert.ok(r.days['2026-11-05']);
  assert.ok(recordRiddleRun(r,[{score:95}],[1]).days['2026-11-05']);
  assert.deepEqual(loadRiddle({days:[1,2]}).days,{});
  assert.deepEqual(loadRiddle({days:'x'}).days,{});
  assert.equal(riddleDay({},'2026-11-05'),null);
});
test('riddle streak counts consecutive UTC days',()=>{
  const r={days:{'2026-11-03':{},'2026-11-04':{},'2026-11-05':{}}};
  assert.equal(riddleDayStreak(r,'2026-11-05'),3);assert.equal(riddleDayStreak(r,'2026-11-06'),3);assert.equal(riddleDayStreak(r,'2026-11-08'),0);
  assert.equal(riddleDayStreak(undefined,'2026-11-05'),0);
});
test('share text has no emojis and names the day',()=>{
  const t=riddleDayShare('2026-11-05',{solved:3,of:7,depth:420,avg:61,books:[{tier:0},{tier:6}]});
  assert.match(t,/Riddle No\. 3/);assert.match(t,/Solved 3 of 7/);assert.doesNotMatch(t,/\p{Extended_Pictographic}/u);
});
