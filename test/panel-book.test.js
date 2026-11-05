import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {panelSpreads,PANEL_COLORS} from '../src/ui/panelBook.js';

const top=readFileSync('src/ui/topbar.js','utf8'),card=readFileSync('src/app/card.js','utf8');

test('a panel book is one spread with the heading on the left page',()=>{
 const s=panelSpreads({kicker:'k',title:'Settings',left:'<p>L</p>',right:'<p>R</p>'});
 assert.equal(s.length,1);
 assert.match(s[0].l,/Settings/);assert.match(s[0].l,/<p>L<\/p>/);assert.equal(s[0].r,'<p>R</p>');
});
test('panel books use colour tokens, not hex',()=>{
 for(const v of Object.values(PANEL_COLORS))assert.ok(v==='none'||/^var\(--c-/.test(v),v);
});
test('Settings and Credits open through openPanelBook, with the plain panel only as a fallback',()=>{
 assert.match(top,/openPanelBook\(/);
 assert.match(top,/if\(useBook\)\{openAsBook/);
});
test('a shelf card swings its cover open and shut; stepping and reduced motion do not',()=>{
 assert.match(card,/RM\|\|opts\.stepped/);
 assert.match(card,/stepped:true/);
 assert.match(card,/shutting/);
});
