import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/ui/shelfFilters.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/ui/bookMenusLoad.js',import.meta.url),'utf8'); // loaded lazily with the Shelf book
const js=readFileSync(new URL('../src/ui/bookMenus.js',import.meta.url),'utf8');
test('shelf filters are compact, fade at the foot, and are wired in',()=>{
 assert.match(css,/\.chipgroup\{display:grid/);
 assert.match(css,/mask-image/);
 assert.match(main,/shelfFilters\.css/);
});
test('a new player sees a sketched empty shelf on the facing page',()=>{
 assert.match(js,/empty-shelf/);
});
