import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync('src/ui/atticHome.js','utf8'),css=readFileSync('src/ui/attic.css','utf8');
test('AE2: clicking the hatch plays the pull before the climb, and reduced motion skips it',()=>{
 assert.match(js,/classList\.add\('pulling'\)/);
 assert.match(js,/setTimeout\(\(\)=>\{pulling=0;World\.setAttic\(true\)/);
 assert.match(js,/if\(reduced\(\)\|\|!cue\)\{World\.setAttic\(true\)/);
 assert.match(css,/\.attic-cue-home\.pulling \.ach-lid\{transform:rotateY/);
 assert.match(css,/\.attic-lit \.attic-beam\{opacity:1\}/);
});
test('AE3: the way down is a rope ladder from the hatch, still named "Down the ladder"',()=>{
 assert.match(js,/adl-frame/);assert.match(js,/adl-rail/);
 assert.match(js,/setAttribute\('aria-label','Down the ladder'\)/);
 assert.match(css,/@keyframes adl-drop/);
 assert.ok(!/border-bottom:2px solid var\(--c-brass-67-alpha-88\)/.test(css),'old plaque styling is gone');
 assert.match(css,/html\[data-motion="reduce"\] [^{]*\.adl-ladder/);
});
