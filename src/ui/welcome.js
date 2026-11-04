/* The home rules card: a card-catalogue drawer on the niche ledge. Pulling it slides the card out;
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

/** The whole drawer: pull + card with a front (the rules) and a back (combo and tiers). */
export function rulesCardHTML(stepsHTML){
 const turn=(l,aria)=>`<button type="button" class="cc-turn" aria-label="${aria}">${l}</button>`;
 return `<aside class="cat-card" data-open="0" data-face="0" aria-label="How it works">
 <div class="cc-slot"><div class="cc-flip" id="ccCard">
  <div class="cc-face cc-front"><i class="wc-pin" aria-hidden="true"></i><div class="wc-head">Rules of the house</div><ol class="how">${stepsHTML}</ol>${turn('Turn ↻','Turn the card over: combo and tier rules')}</div>
  <div class="cc-face cc-back"><i class="wc-pin" aria-hidden="true"></i><div class="wc-head">Combo &amp; tiers</div>${rulesBackHTML()}${turn('↺ Turn','Turn the card back: rules of the house')}</div>
 </div></div>
 <button type="button" class="cc-drawer" aria-expanded="false" aria-controls="ccCard"><span class="cc-plate">Rules of the house</span><i class="cc-knob" aria-hidden="true"></i></button>
</aside>`;
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
  if(pull){apply(card,nextState(st,'toggle'));return;}
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
