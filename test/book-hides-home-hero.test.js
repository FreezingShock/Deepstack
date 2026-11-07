import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('open book fades the home wordmark and plaque',()=>{
 const css=readFileSync(new URL('../src/ui/bookOpenFx.css',import.meta.url),'utf8');
 assert.match(css,/\.book-opening \.hz-title,\.book-opening \.hz-plaque\{opacity:0\}/);
 assert.match(css,/:where\(html\.rm\) \.hz-title,:where\(html\.rm\) \.hz-plaque\{transition:none/);
});
