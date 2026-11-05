import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mayUseQuickJudge} from '../src/scorer/index.js';

test('the quick judge is never allowed for a strict (Daily) answer',()=>{
  assert.equal(mayUseQuickJudge({strict:true}),false);
  assert.equal(mayUseQuickJudge({strict:true,onWait(){}}),false);
});
test('Unlimited and Practice may still use the quick judge',()=>{
  assert.equal(mayUseQuickJudge(undefined),true);
  assert.equal(mayUseQuickJudge({}),true);
});
test('the real Daily run asks for the strict judge; Unlimited and Practice do not',()=>{
  const run=readFileSync(new URL('../src/app/run.js',import.meta.url),'utf8');
  assert.match(run,/judgeAnswer\(text,w,run\.practice\|\|run\.mode\?undefined:\{strict:true/);
});
test('the strict path has no route to the lexical fallback',()=>{
  const src=readFileSync(new URL('../src/scorer/index.js',import.meta.url),'utf8');
  const strict=src.slice(src.indexOf('if (!mayUseQuickJudge(opts))'),src.indexOf('if (!(await whenReady(6000))) return fallback'));
  assert.ok(strict.length>50);
  assert.doesNotMatch(strict,/fallback\(/);
});
