import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('src/ui/buttons.css','utf8'), main=readFileSync('src/main.js','utf8');
test('primary and top-bar buttons share one brass/leather look',()=>{
 assert.match(css,/\.btn\.pri[^{]*\.bbtn\s*\{/);
 assert.match(css,/--b-brass/);
});
test('buttons.css is loaded by main.js',()=>assert.match(main,/import '\.\/ui\/buttons\.css'/));
