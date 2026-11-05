import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/ui/tierFrames.css','utf8');
test('every tier has its own dressing',()=>{for(let t=0;t<7;t++)assert.match(css,new RegExp(`\\.book\\.t${t} \\.page::(before|after)`),`tier ${t}`);});
test('tier frames use tokens only, no raw hex',()=>{assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g,''),/#[0-9a-fA-F]{3,8}\b/);});
test('every var() resolves to a generated token',()=>{
 const tok=readFileSync('src/theme/tokens.css','utf8'),local=new Set(['--tc','--th','--ts']);
 for(const m of css.matchAll(/var\((--[\w-]+)/g))assert.ok(local.has(m[1])||tok.includes(m[1]+':'),m[1]);});
test('reduced motion stops the moving layers',()=>{assert.match(css,/prefers-reduced-motion:reduce\)\{\.book \.page::after\{animation:none/);});
