import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync('src/ui/atticHome.js','utf8'),css=readFileSync('src/ui/attic.css','utf8');
test('the attic entrance is a real button with the count in its label and on the tag',()=>{
 assert.match(js,/createElement\('button'\)/);
 assert.match(js,/ach-hatch/);assert.match(js,/ach-tag/);
 assert.match(js,/aria-label',`Pull the cord and climb up to the attic: \$\{count\}/);
 assert.ok(!/↑ The attic/.test(js),'old pill text is gone');
});
test('the entrance sits dead centre in the ceiling and uses the shared motion tokens',()=>{
 const rule=css.match(/\.attic-cue-home\{[^}]*\}/)[0];
 assert.match(rule,/left:50%/);assert.match(rule,/top:0/);
 assert.match(css,/transition:transform var\(--m-smooth\) var\(--e-settle\)/);
 assert.match(css,/where\(html\.rm\) \.ach-cord\{animation:none\}/);
 assert.match(css,/:focus-visible \.ach-hatch/);
});
