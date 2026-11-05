import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nextSteps,missedWords} from '../src/core/nextStep.js';
import {nextStepHTML,rereadHTML} from '../src/ui/nextStep.js';

const bk=(w,score,answer='x')=>({w,score,answer,def:'d'});
const good={books:[bk('a',80),bk('b',60)],mode:'daily'};
const mixed={books:[bk('a',80),bk('b',10),bk('c',0,''),bk('d',29)],mode:'daily'};
const T='2026-11-05';
const ids=s=>s.map(x=>x.id);

test('Daily unplayed, no streak: Daily first, then own descent',()=>{
  const s=nextSteps({daily:{}},good,T);
  assert.deepEqual(ids(s),['daily','unlimited']);assert.equal(s[0].text,"Today's Daily");
});
test('Daily unplayed with a streak at risk says so',()=>{
  const s=nextSteps({daily:{'2026-11-04':{},'2026-11-03':{}}},good,T);
  assert.match(s[0].text,/2-day streak/);
});
test('Daily played: no Daily choice, one more descent',()=>{
  const s=nextSteps({daily:{[T]:{}}},{...good,mode:'unlimited'},T);
  assert.deepEqual(ids(s),['unlimited']);assert.equal(s[0].text,'One more descent');
});
test('missed words add a read-again choice in any state',()=>{
  assert.deepEqual(ids(nextSteps({daily:{[T]:{}}},mixed,T)),['unlimited','reread']);
  assert.deepEqual(ids(nextSteps({daily:{}},mixed,T)),['daily','unlimited','reread']);
});
test('missedWords: skips first, then lowest score, capped, keeps run index',()=>{
  const m=missedWords(mixed);
  assert.deepEqual(m.map(x=>x.w),['c','b','d']);assert.equal(m[0].i,2);
  assert.equal(missedWords(good).length,0);
  assert.equal(missedWords({books:Array.from({length:7},(_,i)=>bk('w'+i,i))}).length,4);
});
test('markup is plain written buttons and escapes words',()=>{
  assert.match(nextStepHTML([{id:'daily',text:'<b>'}]),/&lt;b&gt;/);
  assert.match(rereadHTML([{w:'x<y',i:1,def:'d'}]),/data-i="1"/);
  const css=readFileSync('src/ui/nextStep.css','utf8');
  assert.doesNotMatch(css,/border:\s*[1-9]|outline:\s*1/);assert.doesNotMatch(css,/overflow-y:\s*(auto|scroll)/);
  assert.match(readFileSync('src/main.js','utf8'),/ui\/nextStep\.css/);
});
