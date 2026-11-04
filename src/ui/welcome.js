/* The home rules card: a card-catalogue cabinet built into the niche wall, plus the ledger on the opposite wall. Pulling it slides the card out;
   the card flips to a second card with the combo and tier rules. Pure markup builder + one delegated
   controller, so it survives showHome() re-rendering. Motion lives in welcome.css (static when reduced). */
import {TIERS} from '../core/tiers.js';
import {COMBO_MAX,COMBO_STEP,COMBO_TIER} from '../core/combo.js';

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/** Back card: how combos chain and what each tier needs. */
export function rulesBackHTML(){
 const tiers=TIERS.map(t=>`<li><i class="cc-dot" style="background:${t.spine}" aria-hidden="true"></i><span>${esc(t.name)}</span><b>${t.min}</b></li>`).join('');
 return `<p class="cc-combo"><b>Combo.</b> ${esc(TIERS[COMBO_TIER].name)} or better, answered back to back, chains a bonus: +${COMBO_STEP} a link, up to ×${COMBO_MAX}.</p><ul class="cc-tiers" aria-label="Score needed for each tier">${tiers}</ul>`;
}

/** The whole cabinet: a built-in card-catalogue run (three drawers, the top one holds the rules), a shelf for the bell,
 *  and the card itself, which lifts out of the top drawer and settles at the room's centre. Flip it for combo and tiers. */
export function rulesCardHTML(stepsHTML){
 const turn=(l,aria)=>`<button type="button" class="cc-turn" aria-label="${aria}">${l}</button>`;
 const fake=l=>`<div class="cc-fake" aria-hidden="true"><span class="cc-plate">${l}</span><i class="cc-knob"></i></div>`;
 return `<aside class="cat-card" data-open="0" data-face="0" aria-label="Card catalogue">
 <div class="cc-cab"><div class="cc-top" data-prop-slot="bell"></div><div class="cc-run">
  <button type="button" class="cc-drawer" aria-expanded="false" aria-controls="ccCard"><span class="cc-plate">Library rules</span><i class="cc-knob" aria-hidden="true"></i></button>
  ${fake('Tiers A–M')}${fake('Sets N–Z')}
 </div></div>
 <div class="cc-scrim" aria-hidden="true"></div>
 <div class="cc-slot"><div class="cc-flip" id="ccCard" role="region" aria-label="Library rules">
  <div class="cc-face cc-front"><i class="wc-pin" aria-hidden="true"></i><div class="wc-head">Library rules</div><p class="cc-sub">Please observe</p><ol class="how">${stepsHTML}</ol>${turn('Turn ↻','Turn the card over: combo and tier rules')}</div>
  <div class="cc-face cc-back"><i class="wc-pin" aria-hidden="true"></i><div class="wc-head">Combo &amp; tiers</div><p class="cc-sub">Of the Reading Room</p>${rulesBackHTML()}${turn('↺ Turn','Turn the card back: rules of the house')}</div>
 </div></div>
</aside>`;
}

/** The ledger: the Borrower's record, a framed board bolted to the right wall, with a shelf for the stamp. */
export function ledgerHTML({streak,deepest,books,floor}){
 const row=(k,v)=>`<div class="lg-row"><dt>${k}</dt><dd>${esc(v)}</dd></div>`;
 return `<aside class="ledger" aria-label="Your records"><div class="cc-top" data-prop-slot="stamp"></div><div class="lg-frame"><div class="lg-plate">Borrower’s record</div>
 <dl class="lg-page">${row('Streak',streak)}${row('Deepest',deepest+' ft')}${row('Books',books)}${floor?row('Floor',floor):''}</dl></div></aside>`;
}

/** Pure state step, exported for tests. */
export function nextState(st,action){
 const s={open:!!st.open,face:st.face?1:0};
 if(action==='toggle')s.open=!s.open;
 else if(action==='close')s.open=false;
 else if(action==='turn'&&s.open)s.face=s.face?0:1;
 if(!s.open)s.face=0;
 return s;
}

function apply(card,st){
 card.dataset.open=st.open?'1':'0';card.dataset.face=String(st.face);
 const d=card.querySelector('.cc-drawer');if(d)d.setAttribute('aria-expanded',String(st.open));
}
const read=card=>({open:card.dataset.open==='1',face:card.dataset.face==='1'?1:0});

let bound=false;
export function initRulesCard(doc=document){
 if(bound)return;bound=true;
 doc.addEventListener('click',e=>{
  const card=e.target.closest&&e.target.closest('.cat-card');if(!card)return;
  const turn=e.target.closest('.cc-turn'),pull=e.target.closest('.cc-drawer');
  const st=read(card);
  if(pull){apply(card,nextState(st,'toggle'));
   if(!st.open)card.querySelector('.cc-front .cc-turn')?.focus({preventScroll:true});return;}
  if(e.target.closest('.cc-scrim')){apply(card,nextState(st,'close'));card.querySelector('.cc-drawer')?.focus({preventScroll:true});return;}
  if(turn||(st.open&&e.target.closest('.cc-face'))){apply(card,nextState(st,'turn'));
   if(turn)card.querySelector(st.face?'.cc-front .cc-turn':'.cc-back .cc-turn')?.focus({preventScroll:true});}
 });
 doc.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const card=e.target.closest&&e.target.closest('.cat-card');
  if(!card||card.dataset.open!=='1')return;
  e.stopPropagation();apply(card,nextState(read(card),'close'));
  card.querySelector('.cc-drawer')?.focus({preventScroll:true});
 },true);
}
