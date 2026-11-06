import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DRAWERS,CARD_IDS,cycle,nextState,cabinetHTML,tiersFront,scoringBack,keysFront,loadSeen,markSeen} from '../src/ui/cabinet.js';
import {ledgerHTML} from '../src/ui/welcome.js';
import {TIERS} from '../src/core/tiers.js';
import {COMBO_MAX} from '../src/core/combo.js';
import {nicheWidth,nicheScale} from '../src/world/nicheWidth.js';

const steps=[{n:1,h:'Explain',p:'Say it.'}];
test('eight drawers, every one a real button; seven cards plus the Settings action',()=>{
 const h=cabinetHTML({steps});
 assert.equal(DRAWERS.length,8);
 assert.equal((h.match(/class="cc-drawer"/g)||[]).length,8);
 assert.equal(CARD_IDS.length,7);
 assert.equal((h.match(/class="cc-slot"/g)||[]).length,7);
 assert.match(h,/data-act="#bSettings"/);
 assert.ok(!/Tiers A|Sets N/.test(h),'the fake A to M and N to Z drawers are gone');
 assert.match(h,/aria-expanded="false" aria-controls="cc-rules"/);
});
test('state: open, swap, turn only with a back, next/prev wrap, close resets',()=>{
 let s={open:'',face:0};
 assert.deepEqual(nextState(s,'turn'),s);
 s=nextState(s,'open','tiers');assert.equal(s.open,'tiers');
 assert.equal(nextState(s,'turn').face,0,'tiers has no back');
 s=nextState(s,'open','rules');s=nextState(s,'turn');assert.equal(s.face,1);
 s=nextState(s,'next');assert.deepEqual(s,{open:'tiers',face:0});
 assert.equal(cycle('rules',-1),CARD_IDS[CARD_IDS.length-1]);
 assert.equal(cycle(CARD_IDS[CARD_IDS.length-1],1),'rules');
 assert.deepEqual(nextState(s,'close'),{open:'',face:0});
 assert.deepEqual(nextState(nextState({open:'',face:0},'open','tips'),'open','tips'),{open:'',face:0},'pulling the open drawer again closes it');
});
test('cards tell the truth: every tier threshold, your best tier, the combo cap, the home keys',()=>{
 const t=tiersFront(3);
 for(const x of TIERS)assert.ok(t.includes(x.name)&&t.includes('>'+x.min+'<'),x.name);
 assert.equal((t.match(/class="best"/g)||[]).length,1);
 assert.ok(scoringBack().includes('×'+COMBO_MAX));
 assert.ok(keysFront().includes('Open Rooms'));
});
test('first-visit slip on Rules goes once read',()=>{
 const mem={};const st={getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=v;}};
 assert.deepEqual(loadSeen(st),{});
 assert.match(cabinetHTML({steps,seen:loadSeen(st)}),/cc-new/);
 markSeen('rules',st);
 assert.ok(!/cc-new/.test(cabinetHTML({steps,seen:loadSeen(st)})));
 assert.deepEqual(loadSeen({getItem:()=>'{bad'}),{});
});
test('css: reduced motion shows and hides the card with no flight or flip',()=>{
 const c=readFileSync(new URL('../src/ui/cabinet.css',import.meta.url),'utf8');
 assert.match(c,/data-motion="reduce"\] \.home \.cc-flip[^{]*\{transition:none\}/);
 assert.match(c,/data-motion="reduce"\] \.home \.cc-slot:not\(\[data-s="on"\]\)\{display:none\}/);
 assert.match(c,/prefers-reduced-motion:reduce/);
});
test('the ledger still mirrors the cabinet',()=>{
 const l=ledgerHTML({streak:3,deepest:844,books:7,floor:'The Hollow'});
 for(const t of ['Streak','Deepest','844 ft','Books','The Hollow','Librarian’s Card'])assert.ok(l.includes(t),t);
 assert.ok(!ledgerHTML({streak:0,deepest:0,books:0,floor:''}).includes('Floor'));
});
test('niche: unchanged up to 1100 px, grows to 1100 and no further',()=>{
 for(const W of [320,375,768,1000,1100])assert.equal(nicheWidth(W),Math.min(W-24,760));
 assert.ok(nicheWidth(1280)>760&&nicheWidth(1280)<1000);
 assert.equal(nicheWidth(1920),1100);assert.equal(nicheWidth(3840),1100);
 assert.equal(nicheScale(760),1);assert.ok(Math.abs(nicheScale(1100)-1.447)<.01);
});
