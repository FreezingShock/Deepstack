import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Regression: returning home must drop the previous run's niche (wall word, answer slip, result line).
test('showHome clears leftover niches before opening the home niche',()=>{
 const src=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(src,/clearNiches\(\)\{niches\.clear\(\);\}/);
 assert.match(src,/World\.clearNiches\(\);World\.openNiche\(0,\{label:'No\. '/);
});
