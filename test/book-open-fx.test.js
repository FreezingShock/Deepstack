import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OPEN_BUDGET_MS,bookTimings,BOOK_TIMING} from '../src/ui/bookOpenFx.js';
import {BOOK_OPEN_MS} from '../src/ui/home.js';
const css=readFileSync('src/ui/bookOpenFx.css','utf8'),js=readFileSync('src/ui/home.js','utf8');
test('opening takes under 600 ms and home.js uses the same numbers',()=>{
 const t=bookTimings(false);
 assert.ok(t.open<OPEN_BUDGET_MS,'open '+t.open);
 assert.equal(t.open,BOOK_OPEN_MS);
 assert.equal(t.open,BOOK_TIMING.fly+BOOK_TIMING.hold+BOOK_TIMING.swing);
});
test('closing swings the cover shut then flies home, quickly',()=>{
 const t=bookTimings(false);
 assert.ok(t.swing>0&&t.close<=OPEN_BUDGET_MS+100);
 assert.ok(js.includes('thud(sp)')&&js.includes("classList.remove('intro','open')"));
});
test('reduced motion is a plain fade with no flight or swing',()=>{
 const t=bookTimings(true);
 assert.equal(t.fly+t.swing+t.hold,0);
 assert.ok(t.open<=200&&t.close<=200);
 assert.match(css,/\.bk-spread\.rm\{[^}]*opacity:0;transition:opacity/);
 assert.match(css,/\.bk-spread\.rm \.bs-cover[^{]*\{display:none/);
});
test('ribbon, page block and endpapers exist and use token colours only',()=>{
 for(const k of ['.bs-ribbon','.bs-blk','.cv-in'])assert.ok(css.includes(k),k);
 assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css),'no raw hex');
});
