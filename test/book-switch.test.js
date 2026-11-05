import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync('src/ui/home.js','utf8'),css=readFileSync('src/ui/bookOpenFx.css','utf8'),hearth=readFileSync('src/ui/hearth.js','utf8');
test('book pages are painted before the first frame, not on a timer mid-animation',()=>{
 assert.ok(js.includes('queueMicrotask(()=>{if(!closed)paint();})'));
 const i=js.indexOf("sp.classList.add('intro')"),timed=js.slice(i,i+60);
 assert.ok(!/paint\(\)/.test(timed),'the intro timer must not paint');
});
test('no rise-in animation replays when the open book settles',()=>{
 assert.ok(css.includes('.bk-spread.intro .pg-in>*{animation:none}'));
});
test('the room comes back while the book is flying home and a click mid-close is queued',()=>{
 assert.ok(js.includes('onFly()')&&js.includes("root.classList.remove('book-opening')"));
 assert.ok(js.includes('pending=()=>el.onclick(e)'));
 assert.ok(js.includes("if(!el.classList.contains('opening'))pending"),'re-clicking the book that is closing is not queued');
});
test('curls, page edges and the spine fade rather than pop; the landing glow animates opacity only',()=>{
 assert.ok(css.includes('.bk-spread:not(.open) .bs-corner{display:block;opacity:0;visibility:hidden}'));
 assert.ok(!/@keyframes bk-glow\{[^}]*(box-shadow|filter)/.test(css));
 assert.ok(css.includes('.hbook.opening{visibility:visible;opacity:0'));
});
test('the hearth runs at half rate while a book is on screen',()=>{
 assert.ok(hearth.includes("home.classList.contains('book-opening') ? 33 : 0"));
});
