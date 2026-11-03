import test from 'node:test';
import assert from 'node:assert/strict';
import {computeStats,longestStreak,liveStreak,msUntilNextDaily,fmtCountdown} from '../src/core/stats.js';

test('longestStreak finds the longest consecutive run',()=>{
  assert.equal(longestStreak(['2026-01-01','2026-01-02','2026-01-04','2026-01-05','2026-01-06']),3);
  assert.equal(longestStreak([]),0);
});
test('liveStreak lapses after a missed day',()=>{
  assert.equal(liveStreak({n:5,last:'2026-01-05'},'2026-01-06'),5);
  assert.equal(liveStreak({n:5,last:'2026-01-05'},'2026-01-05'),5);
  assert.equal(liveStreak({n:5,last:'2026-01-05'},'2026-01-07'),0);
});
test('computeStats aggregates tiers, skips, depth',()=>{
  const bk=(tier,score,answer='x',ft=8)=>({w:'w'+tier,tier,score,answer,ft,no:1});
  const S={bestDepth:120,streak:{n:2,last:'2026-01-02'},daily:{
    '2026-01-01':{depth:90,avg:40,best:3,books:[bk(3,50),bk(0,0,'')]},
    '2026-01-02':{depth:120,avg:60,best:5,books:[bk(5,80),bk(2,35)]}}};
  const s=computeStats(S,'2026-01-02');
  assert.equal(s.runs,2);assert.equal(s.books,4);assert.equal(s.answered,3);
  assert.deepEqual(s.tiers,[0,0,1,1,0,1,0]);
  assert.equal(s.deepest,120);assert.equal(s.deepestDay,'2026-01-02');
  assert.equal(s.best.score,80);assert.equal(s.rarest,5);assert.equal(s.streak,2);assert.equal(s.bestStreak,2);
  assert.equal(s.avg,55);
});
test('countdown formatting',()=>{
  assert.equal(fmtCountdown(3600e3*5+60e3*7),'5h 07m');
  assert.equal(fmtCountdown(75e3),'1m 15s');
  assert.ok(msUntilNextDaily(Date.UTC(2026,0,1,23,0,0))===3600e3);
});
