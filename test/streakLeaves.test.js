import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fiveWeeks,nextMilestone,streakLeaves} from '../src/ui/streakLeaves.js';
test('five weeks end on the Saturday of today\'s week',()=>{
 const d=fiveWeeks('2026-11-06');assert.equal(d.length,35);assert.equal(d[34],'2026-11-07');assert.equal(d[0],'2026-10-04');
});
test('next milestone',()=>{assert.equal(nextMilestone(0),3);assert.equal(nextMilestone(12),14);assert.equal(nextMilestone(14),30);assert.equal(nextMilestone(100),null);});
test('log shows streak, best and played days',()=>{
 const S={daily:{'2026-11-05':{books:[{w:'a'}]},'2026-11-06':{books:[{w:'b'}]}}};
 const [l,r]=streakLeaves(S,'2026-11-06',{streak:2,bestStreak:5,runs:2});
 assert.match(l,/2 days burning/);assert.match(l,/Best streak<\/span><b>5/);assert.match(l,/One to go/);
 assert.equal((r.match(/emb-d played/g)||[]).length,2);
});
test('no streak reads as unlit',()=>{
 const [l]=streakLeaves({daily:{}},'2026-11-06',{streak:0,bestStreak:0,runs:0});assert.match(l,/ember is out/);
});
