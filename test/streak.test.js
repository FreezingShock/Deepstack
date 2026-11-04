import test from 'node:test';
import assert from 'node:assert/strict';
import {currentStreak,recordDaily,runDay} from '../src/core/streak.js';
import {computeStats} from '../src/core/stats.js';

test('streak counts consecutive UTC days ending today or yesterday',()=>{
  const k=['2026-11-01','2026-11-02','2026-11-03'];
  assert.equal(currentStreak(k,'2026-11-03'),3);
  assert.equal(currentStreak(k,'2026-11-04'),3);
  assert.equal(currentStreak(k,'2026-11-05'),0);
  assert.equal(currentStreak([],'2026-11-05'),0);
});
test('a missed day resets the streak but keeps the new one',()=>{
  assert.equal(currentStreak(['2026-11-01','2026-11-03','2026-11-04'],'2026-11-04'),2);
});
test('month and year boundaries',()=>{
  assert.equal(currentStreak(['2026-12-31','2027-01-01'],'2027-01-01'),2);
  assert.equal(currentStreak(['2028-02-28','2028-02-29','2028-03-01'],'2028-03-01'),3);
});
test('future-dated or malformed keys never inflate the streak',()=>{
  assert.equal(currentStreak(['2026-11-03','2030-01-01','bogus'],'2026-11-03'),1);
});
test('recordDaily allows only one result per day',()=>{
  const S={daily:{'2026-11-02':{depth:1}}};
  assert.equal(recordDaily(S,'2026-11-03',{depth:100}),true);
  assert.equal(S.streak.n,2);
  assert.equal(recordDaily(S,'2026-11-03',{depth:999}),false);
  assert.equal(S.daily['2026-11-03'].depth,100);
});
test('a run is filed under the day it started',()=>{
  assert.equal(runDay({day:'2026-11-03'},'2026-11-04'),'2026-11-03');
  assert.equal(runDay(null,'2026-11-04'),'2026-11-04');
});
test('computeStats derives the streak from results, ignoring a stale S.streak',()=>{
  const S={streak:{n:9,last:'2026-11-03'},daily:{'2026-11-03':{depth:1,books:[]}}};
  assert.equal(computeStats(S,'2026-11-03').streak,1);
});
