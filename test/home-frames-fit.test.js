// Desktop home frames: the card catalogue and the Librarian's Card keep their full edges (the browser check is
// scripts/home-frames.mjs). These are the CSS rules that were cropping them, so they can't quietly come back.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = f => readFileSync(new URL('../src/ui/' + f, import.meta.url), 'utf8');
const plaqueGap = read('plaqueGap.css');
const welcome = read('welcome.css');

test('the wall units hang out no further than the niche allows (min() with the room scale), so the niche never crops them', () => {
 assert.match(plaqueGap, /--wall:calc\(-1\*min\(60px,60px\*var\(--hs,1\) - 34px\)\)/);
});

test('the cabinet and ledger slab sit inside their frame (no negative margin, so scrollWidth equals clientWidth)', () => {
 const slab = welcome.match(/\.home \.cc-top\{[^}]*\}/);
 assert.ok(slab, 'the shared slab rule is there');
 assert.doesNotMatch(slab[0], /margin:0 -5px/);
});

test('the niche clips sideways overflow, so a sub-pixel book spine never shows a stray scrollbar', () => {
 assert.match(welcome, /#home\{overflow-x:hidden\}/);
});

test("the Librarian's Card rows are left-aligned and centred on their line, so the streak's room tag never sits on the rule", () => {
 assert.match(welcome, /\.home \.lg-row \.lg-k\{margin:0;text-align:left\}/);
 assert.match(welcome, /\.home \.lg-row\{[^}]*align-items:center;/);
});
