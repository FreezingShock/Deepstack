import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nextState,rulesCardHTML,rulesBackHTML,ledgerHTML} from '../src/ui/welcome.js';
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
test('css: reduced motion removes the lift, glide and flip; the card is only shown or hidden',()=>{
 const c=readFileSync(new URL('../src/ui/welcome.css',import.meta.url),'utf8');
 assert.match(c,/prefers-reduced-motion:reduce[\s\S]*\.cc-flip[\s\S]*transition:none;transform:none!important/);
 assert.match(c,/data-motion="reduce"\] \.home \.cc-flip/);
 assert.match(c,/data-motion="reduce"\] \.home \.cc-slot\{transform:translate\(-50%,-50%\)!important/);
 assert.match(c,/data-motion="reduce"\] \.home \.cat-card\[data-open="0"\] \.cc-slot\{display:none\}/);
 assert.match(c,/data-motion="reduce"\] \.home \.lg-row dd/);
});
test('cabinet: three drawers (only the top is a control), a veil that closes the card, and the ledger mirrors the cabinet',()=>{
 const h=rulesCardHTML('<li>x</li>');
 assert.equal((h.match(/class="cc-drawer"/g)||[]).length,1);
 assert.equal((h.match(/class="cc-fake" aria-hidden="true"/g)||[]).length,2);
 assert.match(h,/class="cc-scrim" aria-hidden="true"/);
 const l=ledgerHTML({streak:3,deepest:844,books:7,floor:'The Hollow'});
 for(const t of ['Streak','Deepest','844 ft','Books','The Hollow','Borrower’s record'])assert.ok(l.includes(t),t);
 assert.match(l,/aria-label="Your records"/);
 assert.ok(!ledgerHTML({streak:0,deepest:0,books:0,floor:''}).includes('Floor'));
});
