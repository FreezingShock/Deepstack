import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPractice,pickPracticeWords,markSeen,practiceLevel,coachNotes,PRACTICE_MS} from '../src/core/practice.js';
import {loadWords,dailyWords} from '../src/core/index.js';

await loadWords().catch(()=>{});

test('loading tolerates junk',()=>{
  assert.deepEqual(loadPractice(null).seen,[]);
  assert.equal(loadPractice({seen:'x',runs:'3'}).runs,3);
});
test('practice sits a little under the Lexicon, and has a long clock',()=>{
  assert.ok(practiceLevel({placed:true,L:5})<5);
  assert.ok(PRACTICE_MS>=90000);
});
test('words are fresh: no repeats in a run, none already seen, none from today\'s Daily',()=>{
  const daily=dailyWords('2026-11-05',7).map(w=>w.id);
  let p=loadPractice(null);const rating={placed:true,L:5};
  const all=new Set();
  for(let r=0;r<5;r++){
    const ws=pickPracticeWords(p,rating,7,daily);
    assert.equal(new Set(ws.map(w=>w.id)).size,7);
    for(const w of ws){assert.ok(!all.has(w.id),'repeat across runs');assert.ok(!daily.includes(w.id));all.add(w.id);p=markSeen(p,w);}
  }
});
test('coach notes explain a partial, a miss, a skip and a clean answer',()=>{
  const w={concepts:[['judging as worthless'],['the habit of estimating']]};
  assert.match(coachNotes({answer:'x',score:60,fb:{c:['a'],m:['b']},def:'d'},w).headline,/missing/i);
  assert.equal(coachNotes({answer:'x',score:90,fb:{c:['a'],m:[]},def:'d'},w).ideas.length,0);
  assert.equal(coachNotes({answer:'',score:0,def:'d'},w).skipped,true);
  assert.equal(coachNotes({answer:'x',score:5,fb:{c:[],m:['b']},def:'d'},w).ideas.length,2);
});
