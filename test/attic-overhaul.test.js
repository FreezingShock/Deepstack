import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ladderGeom} from '../src/world/atticClimb.js';
const src=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');

test('the ladder is slim: thin rails, narrow overall, on desktop and phone',()=>{
 for(const [W,H] of [[375,667],[1280,800]]){
  const g=ladderGeom(W,H,100,1);
  assert.ok(g.rail<=5&&g.gap+g.rail*2<=40,`ladder ${g.gap+g.rail*2}px wide`);
 }
});
test('rows cannot change until the attic is fully in, and scrolling down turns round while climbing',()=>{
 const w=src('src/world/world.js'),h=src('src/ui/atticHome.js');
 assert.match(w,/if\(atticT<1\)return true/);
 assert.match(h,/if\(!World\.atticReady\)\{if\(d>1\)close\(\);return;\}/);
});
test('home books have a rim and the opening fade is on the shared motion tokens',()=>{
 const css=src('src/ui/homeBookEdges.css');
 assert.match(css,/\.hbook::after/);
 assert.match(css,/var\(--m-base\) var\(--e-cruise\)/);
 assert.match(src('src/main.js'),/homeBookEdges\.css/);
});
