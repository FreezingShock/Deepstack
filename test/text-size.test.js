import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';

const files=d=>readdirSync(d).flatMap(f=>{const p=join(d,f);return statSync(p).isDirectory()?files(p):p.endsWith('.css')?[p]:[];});
test('every font size is routed through --ts so the text size setting reaches it',()=>{
 for(const f of files('src')){
  const css=readFileSync(f,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
  for(const m of css.matchAll(/font(?:-size)?:\s*([^;}]*)/g)){
   const v=m[1];
   if(!/\d(px|vw)\b/.test(v)||v.includes('var(--ts')||v.includes('max(16px'))continue;
   assert.fail(`${f}: ${m[0]}`);
  }
 }
});
test('text size levels set --ts',()=>{
 const css=readFileSync('src/ui/topbar.css','utf8');
 assert.match(css,/:root\{--ts:1\}/);
 assert.match(css,/data-text="large"\]\{--ts:1\.15\}/);
 assert.match(css,/data-text="xlarge"\]\{--ts:1\.3\}/);
});
