import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nextState,rulesCardHTML,rulesBackHTML} from '../src/ui/welcome.js';
import {TIERS} from '../src/core/tiers.js';
import {COMBO_MAX} from '../src/core/combo.js';

test('drawer opens, turns, and closing resets to the front',()=>{
 let s={open:false,face:0};
 assert.deepEqual(nextState(s,'turn'),{open:false,face:0},'cannot turn a closed card');
 s=nextState(s,'toggle');assert.equal(s.open,true);
 s=nextState(s,'turn');assert.equal(s.face,1);
 s=nextState(s,'turn');assert.equal(s.face,0);
 s=nextState(nextState(s,'turn'),'close');assert.deepEqual(s,{open:false,face:0});
});
test('back card lists every tier threshold and the combo cap',()=>{
 const h=rulesBackHTML();
 for(const t of TIERS)assert.ok(h.includes(t.name)&&h.includes('>'+t.min+'<'),t.name);
 assert.ok(h.includes('×'+COMBO_MAX));
});
test('markup is keyboard operable: real buttons, aria-expanded, both faces labelled',()=>{
 const h=rulesCardHTML('<li>x</li>');
 assert.match(h,/<button[^>]*class="cc-drawer"[^>]*aria-expanded="false"[^>]*aria-controls="ccCard"/);
 assert.equal((h.match(/class="cc-turn"/g)||[]).length,2);
 assert.match(h,/aria-label="Turn the card over/);
});
test('css: reduced motion removes the slide and flip',()=>{
 const c=readFileSync(new URL('../src/ui/welcome.css',import.meta.url),'utf8');
 assert.match(c,/prefers-reduced-motion:reduce[\s\S]*\.cc-flip[\s\S]*transition:none;transform:none!important/);
 assert.match(c,/data-motion="reduce"\] \.home \.cc-flip/);
});
