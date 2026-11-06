import test from 'node:test';
import assert from 'node:assert/strict';
import {tabLabel,bindTimings,isDailyRun} from '../src/ui/dailyBind.js';
test('tab label is a short date',()=>{assert.equal(tabLabel('2026-11-06'),'6 Nov');assert.equal(tabLabel('bad'),'');});
test('bind scene is about 1.4s for seven books and instant under reduced motion',()=>{
  const t=bindTimings(7);assert.ok(t.total<=2000&&t.total>800);assert.equal(bindTimings(7,true).total,0);});
test('only real Dailies bind',()=>{
  assert.ok(isDailyRun({books:[]}));assert.ok(isDailyRun({mode:'daily'}));
  assert.ok(!isDailyRun({practice:true}));assert.ok(!isDailyRun({mode:'unlimited'}));assert.ok(!isDailyRun({mode:'riddle'}));assert.ok(!isDailyRun(null));});
