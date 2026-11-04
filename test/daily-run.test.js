import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotRun,resumable} from '../src/core/dailyRun.js';

const run=()=>({day:'2026-11-04',results:[{w:'a',rows:4},{w:'b',rows:5}],combo:2,setBonus:150});
test('a snapshot round-trips into a resumable run',()=>{
  const S={dailyRun:snapshotRun(run())};
  const r=resumable(S,'2026-11-04',7);
  assert.equal(r.results.length,2);assert.equal(r.combo,2);assert.equal(r.setBonus,150);
});
test('the snapshot is a copy, not a live reference',()=>{
  const x=run(),snap=snapshotRun(x);x.results[0].rows=99;
  assert.equal(snap.results[0].rows,4);
});
test('another day, a finished Daily or junk is not resumed',()=>{
  const snap=snapshotRun(run());
  assert.equal(resumable({dailyRun:snap},'2026-11-05',7),null);
  assert.equal(resumable({dailyRun:snap,daily:{'2026-11-04':{depth:1}}},'2026-11-04',7),null);
  assert.equal(resumable({dailyRun:{day:'2026-11-04',results:[]}},'2026-11-04',7),null);
  assert.equal(resumable({dailyRun:{day:'2026-11-04',results:new Array(9).fill({})}},'2026-11-04',7),null);
  assert.equal(resumable({},'2026-11-04',7),null);
  assert.equal(resumable(null,'2026-11-04',7),null);
});
