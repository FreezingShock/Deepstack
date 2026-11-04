import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {tokensCss} from '../scripts/gen-tokens.mjs';
import {COLORS,ALPHA,TIER_COLORS,FLOOR_COLORS,tokenEntries} from '../src/theme/colors.js';

const HEX=/^#[0-9a-f]{6}([0-9a-f]{2})?$/;
test('tokens.css is in sync with colors.js (run npm run gen:tokens)',()=>{
 assert.equal(readFileSync('src/theme/tokens.css','utf8'),tokensCss());
});
test('every color is a lowercase 6 or 8 digit hex and names are unique',()=>{
 const entries=tokenEntries();
 for(const[k,v]of entries)assert.match(v,HEX,k);
 assert.equal(new Set(entries.map(e=>e[0])).size,entries.length);
});
test('tier and floor palettes cover every tier and floor',async()=>{
 const {TIERS}=await import('../src/core/tiers.js');const {FLOORS}=await import('../src/core/floors.js');
 assert.equal(Object.keys(TIER_COLORS).length,TIERS.length);
 for(const t of TIERS){const c=TIER_COLORS[t.name.toLowerCase()];assert.ok(c,t.name);}
 for(const f of FLOORS)assert.ok(FLOOR_COLORS[f.key],f.key);
});
test('alpha tokens are 8-digit and opaque tokens are 6-digit',()=>{
 for(const v of Object.values(COLORS))assert.equal(v.length,7);
 for(const v of Object.values(ALPHA))assert.equal(v.length,9);
});

// Ratchet: files listed here were converted to tokens; they may not gain raw hex colors.
// Lower (or add) a file's number when you convert it. New code should use var(--c-*) or import src/theme/colors.js.
const budget=JSON.parse(readFileSync('test/fixtures/hex-budget.json','utf8'));
const count=f=>(readFileSync(f,'utf8').match(/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b/g)||[]).length;
for(const[f,max]of Object.entries(budget))test(`${f} stays within ${max} raw hex colors`,()=>{
 assert.ok(count(f)<=max,`${f} has ${count(f)} raw hex colors (budget ${max}); use a token from src/theme/colors.js`);
});
