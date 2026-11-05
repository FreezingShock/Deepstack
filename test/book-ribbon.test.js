import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ribbonTarget,remember,recall,forget,ribbonKey,ribbonLabel} from '../src/ui/bookRibbon.js';
test('tug jumps to contents, then back to the remembered page',()=>{
 forget();const k=ribbonKey('Your shelf');
 assert.equal(recall(k),0);remember(k,3);
 assert.equal(ribbonTarget(3,recall(k),6),0);
 remember(k,0);assert.equal(recall(k),3,'contents does not erase the bookmark');
 assert.equal(ribbonTarget(0,recall(k),6),3);
 assert.equal(ribbonTarget(0,recall(k),2),0,'stale page past the end is ignored');
});
test('books are remembered separately and labels read plainly',()=>{
 forget();remember('Stats',2);assert.equal(recall('Sets'),0);
 assert.equal(ribbonLabel(2,2),'Back to contents');assert.equal(ribbonLabel(0,2),'Return to where you stopped');
});
