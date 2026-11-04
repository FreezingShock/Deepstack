import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const files=['src/styles.css',...readdirSync('src/ui').filter(f=>f.endsWith('.css')).map(f=>'src/ui/'+f)];
for(const f of files)test(`${f} has balanced braces and no stray selector text in declarations`,()=>{
 const s=readFileSync(f,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 let d=0;for(const c of s){if(c==='{')d++;if(c==='}')d--;assert.ok(d>=0,'unbalanced }');}
 assert.equal(d,0,'unbalanced {');
 // a rule block opened inside a declaration list means a mangled paste
 assert.ok(!/:[^;{}]*\{[^{}]*\}[^;{}]*;/.test(s.replace(/@media[^{]*\{|@keyframes[^{]*\{/g,'')),'rule nested inside a declaration');
});
test('only the browsing state may dim .center',()=>{
 for(const f of files){const s=readFileSync(f,'utf8');
  for(const m of s.matchAll(/([^{}]*)\.center\s*\{[^}]*opacity:\s*\.?[01]\d*!important/g))assert.ok(/body\.browsing\s*$/.test(m[1]),f+': '+m[0]);}
});
