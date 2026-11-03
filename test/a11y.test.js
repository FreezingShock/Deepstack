import {test} from 'node:test';
import assert from 'node:assert/strict';
import {timerCue,scoreSentence} from '../src/ui/a11yCues.js';

test('timer cues fire once as thresholds are crossed',()=>{
 assert.equal(timerCue(null,45),null);
 assert.equal(timerCue(45,44),null);
 assert.equal(timerCue(31,30),'30 seconds left');
 assert.equal(timerCue(30,29),null);
 assert.equal(timerCue(16,14),'15 seconds left');
 assert.equal(timerCue(6,5),'5 seconds left');
 assert.equal(timerCue(5,5),null);
});
test('score sentence reads naturally',()=>{
 const s=scoreSentence({word:'ephemeral',tier:'Hardbound',score:72,verdict:'Close.',def:'Lasting a short time.'});
 assert.equal(s,'ephemeral. Hardbound, 72 out of 100 closeness. Close. Meaning: Lasting a short time.');
});
