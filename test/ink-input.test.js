import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {editRange,nextBirths,inkRuns,runsHtml,DRY_MS} from '../src/ui/inkInput.js';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');

test('editRange finds typed, deleted and replaced spans',()=>{
 assert.deepEqual(editRange('ab','abc'),{at:2,removed:0,added:1});
 assert.deepEqual(editRange('abc','ac'),{at:1,removed:1,added:0});
 assert.deepEqual(editRange('abc','aXYc'),{at:1,removed:1,added:2});
 assert.deepEqual(editRange('a','a'),{at:1,removed:0,added:0});
});
test('births follow the text: new letters are wet, old ones keep their age',()=>{
 let b=nextBirths([],'','hi',100);assert.deepEqual(b,[100,100]);
 b=nextBirths(b,'hi','hij',200);assert.deepEqual(b,[100,100,200]);
 b=nextBirths(b,'hij','hj',300);assert.deepEqual(b,[100,200]);
 b=nextBirths(b,'hj','hXj',400);assert.deepEqual(b,[100,400,200]);
});
test('inkRuns merges dry letters and keeps wet ones separate',()=>{
 const runs=inkRuns('abcd',[0,0,1900,1990],2000);
 assert.deepEqual(runs.map(r=>r.t),['ab','c','d']);
 assert.equal(runs[0].age,null);assert.equal(runs[1].age,100);
 assert.equal(inkRuns('x',[0],DRY_MS).length,1);
});
test('wet letters are escaped in the mirror html',()=>{
 const h=runsHtml(inkRuns('<b>&',[1000,1000,1000],1000));
 assert.doesNotMatch(h,/<b>&/);assert.match(h,/&lt;/);assert.match(h,/&amp;/);
});
test('hooked into the run screen without replacing input handlers; reduced motion and 14-letter-safe css',()=>{
 const m=read('src/app/run.js');assert.match(m,/attachInk\(ta\)/);
 const css=read('src/ui/inkInput.css');
 assert.match(css,/html\.rm/);assert.match(css,/pointer-events:none/);
 assert.doesNotMatch(css,/#[0-9a-fA-F]{3,8}\b/);
 assert.match(read('src/ui/inkInput.js'),/aria-hidden/);
});
test('empty slip rests the quill in the margin, clear of the placeholder',()=>{
 assert.match(read('src/ui/inkInput.js'),/classList\.toggle\('is-empty',!v\)/);
 assert.match(read('src/ui/inkInput.css'),/\.ink-mirror\.is-empty \.ink-nib svg\{left:-\d+px\}/);
});
