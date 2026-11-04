import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DIP_MS,coverWorld,liftWorld} from '../src/ui/screenFx.js';
test('world dip resolves without a DOM and lifting with no veil is safe',async()=>{
 assert.ok(DIP_MS>0&&DIP_MS<=400);
 await coverWorld();liftWorld();
});
test('screen chrome fades in and out without moving',()=>{
 const css=readFileSync(new URL('../src/ui/screenFx.css',import.meta.url),'utf8');
 assert.match(css,/#depthHud:not\(\[hidden\]\)/);
 assert.match(css,/@keyframes chromeout\{to\{opacity:0\}\}/);
 const tr=readFileSync(new URL('../src/ui/transitions.js',import.meta.url),'utf8');
 assert.match(tr,/#depthHud/);assert.match(tr,/ghost-fade/);
});
