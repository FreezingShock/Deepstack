import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.js','utf8'), load=readFileSync('src/ui/bookMenusLoad.js','utf8'), lazy=readFileSync('src/ui/lazyScreens.js','utf8'), home=readFileSync('src/ui/home.js','utf8');
test('Shelf, Daily and Stats code and CSS stay out of the first-paint bundle',()=>{
 for(const m of ['bookMenus.js','dailyBook.js','dailyBook.css','statsPages.css','shelfBays.css'])assert.doesNotMatch(main,new RegExp("import [^\\n]*"+m.replace('.','\\.')));
 for(const m of ['bookMenus.js','dailyBook.js','dailyBook.css','statsPages.css','shelfBays.css','shelfFilters.css'])assert.match(load,new RegExp(m.replace('.','\\.')));
 assert.match(lazy,/import\('\.\/bookMenusLoad\.js'\)/);
});
test('clicking a lazy book before it loaded waits for it, and it is prewarmed after first paint',()=>{
 assert.match(home,/pages\.load\(\)\.then/);
 assert.match(lazy,/deferAfterPaint/);
 assert.match(main,/lazyBooks\(/);
});
