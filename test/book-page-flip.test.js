import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync('src/ui/home.js','utf8'),css=readFileSync('src/ui/home.css','utf8');
test('books turn with page-corner zones, not round arrow buttons',()=>{
 const pf=readFileSync('src/ui/pageFlip.js','utf8');assert.ok(pf.includes('bs-corner prev')&&pf.includes('bs-corner next'));
 assert.ok(!js.includes('bs-turn'));
});
test('the flip animates transform/opacity only and honours reduced motion',()=>{
 assert.match(css,/@keyframes fl-next\{to\{transform:rotateY\(-180deg\)\}\}/);
 assert.ok(/reduce\s*\|\|/.test(js),'reduced motion swaps pages without a leaf');
});
test('corner hit zones are large',()=>{
 assert.match(css,/\.bs-corner\{[^}]*width:24%;height:26%/);
});
