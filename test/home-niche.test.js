import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Regression: returning home must drop the previous run's niche (wall word, answer slip, result line).
test('showHome clears leftover niches before opening the home niche',()=>{
 const rd=f=>readFileSync(new URL('../src/'+f,import.meta.url),'utf8');
 assert.match(rd('world/world.js'),/clearNiches\(\)\{niches\.clear\(\);\}/);
 assert.match(rd('app/home.js'),/World\.clearNiches\(\);World\.openNiche\(0,\{label:''/);
});
