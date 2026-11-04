import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {riddleJudge,riddleLadder,riddleVerdict,normalize,editDistance} from '../src/core/riddleJudge.js';
import {loadRiddle,recordRiddleRun,riddleTarget,RIDDLE_SEEN_CAP} from '../src/core/riddleStats.js';
import {hintLadder} from '../src/core/hints.js';
import {tierOf} from '../src/core/tiers.js';
import {BANK,WORDS} from '../src/core/words.js';
import {buildPool} from '../src/core/wordPool.js';

const rel=JSON.parse(readFileSync(new URL('../public/data/relations.json',import.meta.url),'utf8')).rel;
const frugal=WORDS.find(w=>w.w==='frugal'),candid=WORDS.find(w=>w.w==='candid'),benevolent=WORDS.find(w=>w.w==='benevolent');

test('the exact word is Apocrypha, however it is typed', () => {
  for (const t of ['frugal','Frugal','  FRUGAL ','a frugal','frugal!']) {
    const j=riddleJudge(t,frugal,rel.frugal);assert.equal(j.kind,'exact',t);assert.ok(tierOf(j.score)===6);
  }
});
test('another form of the word and a one-letter slip still reach Apocrypha', () => {
  assert.equal(riddleJudge('Benevolents',benevolent,rel.benevolent).kind,'form');
  assert.equal(riddleJudge('frugel',frugal,rel.frugal).kind,'typo');
  assert.equal(tierOf(riddleJudge('frugel',frugal,rel.frugal).score),6);
  assert.equal(riddleJudge('cand',candid,rel.candid).score<92,true,'a stub is not a typo');
});
test('a synonym is close, not Apocrypha, and below the exact word', () => {
  const j=riddleJudge('thrifty',frugal,rel.frugal);
  assert.equal(j.kind,'synonym');assert.ok(j.score>=30&&j.score<62,'folio-ish: '+j.score);
  assert.equal(tierOf(j.score)>=3&&tierOf(j.score)<=5,true);
});
test('curated concept terms count as close even without relation data', () => {
  assert.equal(riddleJudge('honest',candid,null).kind,'concept');
});
test('broader and related words earn less than synonyms', () => {
  const s=riddleJudge('thrifty',frugal,rel.frugal).score,h=riddleJudge('cautious',frugal,rel.frugal).score;
  assert.ok(h<s&&h>0);
});
test('an antonym points the wrong way and scores nothing', () => {
  const j=riddleJudge('extravagant',frugal,rel.frugal);assert.equal(j.score,0);assert.equal(j.opposite,true);
});
test('nonsense, empty and look-alike words score near nothing and never crash', () => {
  assert.equal(riddleJudge('',frugal,null).empty,true);
  assert.equal(riddleJudge('   ',frugal,null).score,0);
  assert.equal(riddleJudge('zebra',frugal,rel.frugal).score,0);
  assert.ok(riddleJudge('frugality',frugal,rel.frugal).score<20,'a look-alike is not the word');
  assert.doesNotThrow(()=>riddleJudge('😀',candid,undefined));
});
test('normalize and editDistance basics', () => {
  assert.equal(normalize('To  Café-au'),'cafe au');assert.equal(editDistance('abc','abd'),1);assert.equal(editDistance('abc','xyz',2),3);
});
test('verdicts exist for every kind and never contain the word', () => {
  for (const k of ['exact','form','typo','synonym','concept','broader','near','related','defWord','family','opposite','none','empty']) {
    const v=riddleVerdict({kind:k},frugal);assert.ok(v&&!v.toLowerCase().includes('frugal'),k);
  }
});
test('riddle hints are only the sentence and neighbour clues, and never spell the word', () => {
  const data=JSON.parse(readFileSync(new URL('../public/data/words.json',import.meta.url),'utf8'));
  let n=0,withHint=0;const pool=buildPool(data);
  for (const w of [...WORDS,...pool]) { const l=riddleLadder(w,rel[w.w]);n++;if(l.length)withHint++; for (const h of l) {
    assert.ok(['sentence','synonym'].includes(h.kind));assert.ok(!h.text.toLowerCase().includes(w.w.toLowerCase()));
  } }
  assert.ok(withHint/n>.6,'most riddles get a hint: '+withHint/n);
});
test('riddle stats save additively and tolerate missing or damaged data', () => {
  assert.deepEqual(loadRiddle(undefined),{runs:0,solved:0,best:0,seen:[]});
  assert.deepEqual(loadRiddle({runs:'x',seen:'no'}),{runs:0,solved:0,best:0,seen:[]});
  const r=recordRiddleRun(undefined,[{score:100},{score:58},{score:95}],[1,2,3]);
  assert.deepEqual(r,{runs:1,solved:2,best:2,seen:[1,2,3]});
  const r2=recordRiddleRun(r,[{score:100}],[4]);assert.equal(r2.solved,3);assert.equal(r2.best,2);
  const big=recordRiddleRun({seen:Array.from({length:RIDDLE_SEEN_CAP},(_,i)=>i)},[],[999]);assert.equal(big.seen.length,RIDDLE_SEEN_CAP);assert.equal(big.seen.at(-1),999);
});
test('riddle target ramps up across a run', () => {
  assert.ok(riddleTarget(4,0,7)<riddleTarget(4,6,7));assert.ok(riddleTarget(0,0,7)>=.5);
});
