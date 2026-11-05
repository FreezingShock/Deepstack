import {test} from 'node:test';
import assert from 'node:assert/strict';
import {judgeLabel,FALLBACK_NOTE} from '../src/ui/judgeLabel.js';
test('shows download progress while loading',()=>{
 assert.equal(judgeLabel({state:'loading',total:0,progress:0}),'Preparing the judge…');
 assert.equal(judgeLabel({state:'loading',total:100,progress:.42}),'Preparing the judge, 42%');
});
test('shows nothing once the download finishes or the judge is ready',()=>{
 assert.equal(judgeLabel({state:'loading',total:100,progress:1}),'');
 assert.equal(judgeLabel({state:'ready',total:100,progress:1}),'');
 assert.equal(judgeLabel({state:'idle',total:0,progress:0}),'');
});
test('says plainly when the quick judge is in use',()=>{
 assert.equal(judgeLabel({state:'error'}),FALLBACK_NOTE);
});
