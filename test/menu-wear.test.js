import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/ui/menuWear.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('menu wear is loaded and uses no raw hex',()=>{
 assert.match(main,/menuWear\.css/);
 assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b/i);
});
test('wear styles spines, titles, plaque and mantel',()=>{
 for(const s of ['.hb-spine::before','.hb-t','.descend','.mantel-beam'])assert.ok(css.includes(s),s);
 assert.doesNotMatch(css,/animation|@keyframes/);
});
