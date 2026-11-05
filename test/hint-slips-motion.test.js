import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hintSlipHtml} from '../src/ui/hintSlips.js';
const css=readFileSync(new URL('../src/ui/hintSlips.css',import.meta.url),'utf8');
test('slips stagger by order and the gap breathes with shared tokens',()=>{
 assert.match(hintSlipHtml({kind:'sentence',text:'a ___ b'},null,0,2),/--hn:1/);
 assert.match(css,/hslip-breath/);
 assert.match(css,/var\(--m-linger\)/);
});
test('reduced motion stills the slips and the gap',()=>{
 assert.match(css,/prefers-reduced-motion:reduce[^}]*mark\.gap\{animation:none/);
 assert.match(css,/data-motion="reduce"\] \.hslip mark\.gap\{animation:none/);
});
