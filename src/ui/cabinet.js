/* The card catalogue: a tall oak cabinet built into the left wall of the home room, eight small box drawers, each
   holding one index card for the house: Rules, Tiers, Scoring, Tips, Keys, Credits, Today, and the Settings drawer
   (which opens the Settings book instead of a card). Pulling a drawer slides it out; its card lifts out and glides to
   the middle of the room under a veil. Cards flip for their back page and deal to the next or previous drawer
   (arrow keys, the side buttons, or swipe-free taps), so the whole cabinet can be read by cycling.
   Pure data + markup builders, plus one delegated controller that survives showHome() re-rendering.
   Look and motion: cabinet.css (static under reduced motion). The ledger on the opposite wall stays in welcome.js. */
import {TIERS} from '../core/tiers.js';
import {COMBO_MAX,COMBO_STEP,COMBO_TIER} from '../core/combo.js';
import {HINT_COST} from '../core/hints.js';
import {SHORTCUT_GROUPS} from './keysCore.js';

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FT_PER_ROW=4;

/* ---------- card bodies (pure) ---------- */
const para=t=>`<p class="cb-p">${t}</p>`;
const note=t=>`<p class="cb-note">${t}</p>`;
const numbered=items=>`<ol class="cb-steps">${items.map(([h,p],i)=>`<li><span class="cb-n" aria-hidden="true">${i+1}</span><b>${esc(h)}</b><span>${esc(p)}</span></li>`).join('')}</ol>`;

export function rulesFront(steps){
 return numbered(steps.map(s=>[s.h,s.p]))+note('A Daily is seven words, the same for everyone. Come back tomorrow and the next candle is lit.');
}
export function rulesBack(){
 return `<dl class="cb-defs"><div><dt>Daily</dt><dd>Seven shared words, once a day. Keeps your streak.</dd></div><div><dt>Unlimited</dt><dd>Words matched to you. Each answer moves your rank.</dd></div><div><dt>Practice</dt><dd>Rehearse the Daily. Nothing is recorded.</dd></div><div><dt>Rooms</dt><dd>Seven topic rooms, each with its own Daily and rank.</dd></div></dl>`;
}
/** Seven tiers: colour, name, rarity and the score that earns it. best (a tier id, or -1) gets a brass marker. */
export function tiersFront(best=-1,counts=[]){
 const rows=TIERS.map(t=>{const n=counts[t.id]|0;return `<li class="${t.id===best?'best':''}${n?'':' miss'}"><i class="cc-dot" style="background:${t.spine}" aria-hidden="true"></i><span class="tn">${esc(t.name)}${n?` <small>×${n}</small>`:''}</span><span class="tr">${esc(t.rar)}</span><b>${t.min}</b>${t.id===best?'<em>your best</em>':''}</li>`;}).join('');
 return `<ul class="cb-tiers" aria-label="Score needed for each tier">${rows}</ul>`+note(counts.some(Boolean)?'Dim tiers are still to be earned. Score is closeness to the real meaning, out of 100.':'Score is closeness to the real meaning, out of 100.');
}
export function scoringFront(){
 const h=Object.entries({sentence:'In a sentence',synonym:'A neighbour',opening:'How it begins'}).map(([k,l])=>`<li><span>${l}</span><b>−${HINT_COST[k]*FT_PER_ROW} ft</b></li>`).join('');
 return para('Every answer is scored on how close it comes to the real meaning, <b>on this device</b>. Your own words are fine; nothing is sent anywhere.')+para('The score picks the book’s tier, and better books sink deeper. A hint is an easier word bought with depth:')+`<ul class="cb-hints">${h}</ul>`;
}
export function scoringBack(){
 const t=TIERS[COMBO_TIER].name;
 let chain='';for(let n=1;n<=1+Math.round((COMBO_MAX-1)/COMBO_STEP);n++)chain+=`<li class="${n===1?'':'on'}"><b>${n===1?'×1':'×'+Math.min(COMBO_MAX,1+COMBO_STEP*(n-1))}</b><span>${n===1?'first':'link '+n}</span></li>`;
 return para(`<b>Combo.</b> ${esc(t)} or better, answered back to back, chains a bonus on the depth you earn: +${COMBO_STEP} a link, up to ×${COMBO_MAX}.`)+`<ol class="cb-chain" aria-label="Combo multipliers">${chain}</ol>`+note('A weaker answer, or a skip, breaks the chain.');
}
export const TIPS=[
 ['Say what it does','Name the core idea first, then one detail.'],
 ['Use plain words','A near-synonym and a reason beat a grand sentence.'],
 ['Skip the word itself','Explain it; do not repeat it.'],
 ['No word count','One clear sentence is enough.'],
 ['Stuck? Take a hint','It costs a little depth, never the round.'],
];
export function tipsFront(){return numbered(TIPS);}
/** Keys: the home keys on the front, the word-screen and everywhere keys on the back. */
export function keysRows(rows){return `<dl class="cb-keys">${rows.map(([k,d])=>`<div><dt>${k.split(' / ').map(x=>`<kbd>${esc(x)}</kbd>`).join('<i>or</i>')}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`;}
const keyGroup=name=>(SHORTCUT_GROUPS.find(g=>g[0]===name)||['',[]])[1];
export function keysFront(){return keysRows(keyGroup('At the library'));}
export function keysBack(){return keysRows([...keyGroup('On a word'),...keyGroup('Anywhere')])+note('Press <kbd>?</kbd> any time for every key.');}
export const CREDIT_LINES=[
 ['Word meanings','Wiktionary, parsed by kaikki.org. CC BY-SA 4.0.'],
 ['Synonyms','Princeton WordNet and the Moby Thesaurus. Word frequency from OpenSubtitles (hermitdave).'],
 ['The judge','all-MiniLM-L6-v2 (Sentence-Transformers, Apache 2.0), run on your device with Transformers.js.'],
];
export function creditsFront(){return `<dl class="cb-defs">${CREDIT_LINES.map(([h,p])=>`<div><dt>${esc(h)}</dt><dd>${esc(p)}</dd></div>`).join('')}</dl>`;}
export function creditsBack(){return para('Deepstack was made by <b>nate</b>, one word at a time, with a great deal of patience from the shelves.')+para('Your library lives on <b>this device</b>: shelf, streak and rank are saved in this browser and nowhere else, and answers are judged here too.')+note('Clearing this site’s data erases the shelf. Full credits, with links, are in the quill at the top of the room.');}
/** Today's page: where the Daily stands right now, with the same action the Descend plaque offers. t: {no, kind, tag, streak, played}. */
export function todayFront(t){
 if(!t)return para('Today’s page is blank.');
 const line=t.kind==='resume'?`You are part way down: ${esc(t.tag.replace(/^Daily No\. \d+ · /,''))}.`
  :t.played?'Today’s Daily is written. The next one opens at midnight UTC.':'Seven words, the same for everyone. Not yet written.';
 const streak=t.streak>0?`<p class="cb-streak"><b>${t.streak}</b> ${t.streak===1?'day':'days'} in a row. ${t.played?'Tonight’s candle is lit.':'Write today’s to light the next candle.'}</p>`:note('No streak yet. Write today’s Daily to light the first candle.');
 const go=t.played?`<div class="cb-go"><button type="button" class="cc-go" data-go="#bRes">Today’s result</button><button type="button" class="cc-go cc-go2" data-go="#bNext">Descend</button></div>`
  :`<div class="cb-go"><button type="button" class="cc-go" data-go="#bPlay">${t.kind==='resume'?'Continue':'Descend'}</button></div>`;
 const room=t.room?`<p class="cb-room"><i aria-hidden="true"></i>${esc(t.room.name)}</p>`:'';
 return room+`<p class="cb-big">Daily No. ${esc(t.no)}</p>`+para(line)+streak+go;
}
/* ---------- the drawers ---------- */
/** id, plate (drawer label), title/sub (card head), front/back (HTML builders), kind: 'card' or 'action'. */
export const DRAWERS=[
 {id:'rules',plate:'Rules',title:'How to play',sub:'Please observe',front:ctx=>rulesFront(ctx.steps),back:rulesBack,backTitle:'Ways to play',backSub:'Choose your descent'},
 {id:'tiers',plate:'Tiers',title:'Tiers of books',sub:'What an answer earns',front:ctx=>tiersFront(ctx.bestTier,ctx.tierCounts)},
 {id:'scoring',plate:'Scoring',title:'How you are judged',sub:'Closeness, not spelling',front:scoringFront,back:scoringBack,backTitle:'Combos',backSub:'Keep the chain unbroken'},
 {id:'tips',plate:'Tips',title:'A strong answer',sub:'Five small habits',front:tipsFront},
 {id:'keys',plate:'Keys',title:'Keys of the library',sub:'At the library',front:keysFront,back:keysBack,backTitle:'Keys, continued',backSub:'On a word, and anywhere'},
 {id:'settings',plate:'Settings',kind:'action',action:'#bSettings',label:'Open Settings'},
 {id:'credits',plate:'Credits',title:'Credits',sub:'Who made this possible',front:creditsFront,back:creditsBack,backTitle:'The maker',backSub:'Of the Reading Room'},
 {id:'today',plate:'Today',title:'Today’s page',sub:'The Daily, as it stands',front:ctx=>todayFront(ctx.today)},
];
export const CARD_IDS=DRAWERS.filter(d=>d.kind!=='action').map(d=>d.id);
/** The next/previous card id, skipping action drawers, wrapping round. */
export const cycle=(id,dir)=>{const i=CARD_IDS.indexOf(id);return CARD_IDS[(i+dir+CARD_IDS.length)%CARD_IDS.length];};

/* Which drawers have been opened (a quiet per-browser note: the first-visit "new" slip on Rules goes once it is read). */
export const SEEN_KEY='deepstack.cabinet.v1';
export function loadSeen(storage=globalThis.localStorage){try{const o=JSON.parse(storage.getItem(SEEN_KEY)||'{}');return o&&typeof o==='object'&&o.seen&&typeof o.seen==='object'?o.seen:{};}catch{return {};}}
export function markSeen(id,storage=globalThis.localStorage){try{const seen={...loadSeen(storage),[id]:1};storage.setItem(SEEN_KEY,JSON.stringify({seen}));}catch{}}

/** The whole cabinet. ctx: {steps:[{h,p}], bestTier:-1..6, tierCounts:[books per tier], today:{no,kind,tag,streak,played}, seen:{id:1}}. */
export function cabinetHTML(ctx){
 const c={steps:[],bestTier:-1,tierCounts:[],today:null,seen:{},...ctx};
 const drawers=DRAWERS.map(d=>{
  const tint=d.id==='tiers'&&c.bestTier>=0?`<i class="cc-tint" style="background:${TIERS[c.bestTier].spine}" aria-hidden="true"></i>`:'';
  const fresh=d.id==='rules'&&!c.seen.rules?'<i class="cc-new" aria-hidden="true">new</i>':'';
  const attrs=d.kind==='action'?`data-act="${esc(d.action)}" aria-label="${esc(d.label)}"`:`aria-expanded="false" aria-controls="cc-${d.id}" aria-haspopup="dialog"`;
  return `<button type="button" class="cc-drawer" data-d="${d.id}" ${attrs}>${fresh}<span class="cc-plate">${tint}${esc(d.plate)}</span>${d.id==='rules'?'<span class="cc-plate cc-bar" aria-hidden="true">Card catalogue</span>':''}<i class="cc-knob" aria-hidden="true"></i></button>`;
 }).join('');
 const turn=(l,aria,cls)=>`<button type="button" class="cc-turn ${cls}" aria-label="${aria}">${l}</button>`;
 const cards=DRAWERS.filter(d=>d.kind!=='action').map((d,i)=>{
  const two=!!d.back,n=`${i+1} of ${CARD_IDS.length}`;
  const foot=side=>`<div class="cc-foot"><button type="button" class="cc-nav cc-prev" aria-label="Previous card">‹</button>${two?turn(side==='f'?'Turn ↻':'↺ Turn',side==='f'?`Turn the card over: ${esc(d.backTitle||'')}`:'Turn the card back','cc-flipbtn'):''}<span class="cc-no">${d.id==='today'&&c.today&&c.today.room?esc(c.today.room.short):`No. ${n}`}</span><button type="button" class="cc-nav cc-next" aria-label="Next card">›</button></div>`;
  const face=(side,t,s,html)=>`<div class="cc-face cc-${side==='f'?'front':'back'}"><div class="wc-head">${esc(t)}</div><p class="cc-sub">${esc(s)}</p><div class="cc-body">${html}</div>${foot(side)}</div>`;
  return `<div class="cc-slot" id="cc-${d.id}" data-card="${d.id}"${d.id==='today'&&c.today&&c.today.room?` style="--rc:${c.today.room.rgb.join(',')}"`:''} data-s="off" data-face="0" inert aria-label="${esc(d.title)}"><div class="cc-flip">${face('f',d.title,d.sub,d.front(c))}${two?face('b',d.backTitle,d.backSub,d.back(c)):''}</div></div>`;
 }).join('');
 return `<aside class="cat-card" data-open="" aria-label="Card catalogue">
 <div class="cc-cab"><div class="cc-top" data-prop-slot="bell"></div><div class="cc-run"><div class="cc-plate-head" aria-hidden="true">Card catalogue</div><div class="cc-grid">${drawers}</div></div></div>
 <button type="button" class="cc-tab" data-d="rules" aria-haspopup="dialog" aria-label="Card catalogue: rules, tiers, keys and more" title="Card catalogue"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="1.8" width="12" height="3.6" rx=".6"/><rect x="2" y="6.2" width="12" height="3.6" rx=".6"/><rect x="2" y="10.6" width="12" height="3.6" rx=".6"/></g></svg></button>
 <div class="cc-scrim" aria-hidden="true"></div>${cards}
</aside>`;
}

/* ---------- state (pure) ---------- */
/** st: {open: id|'' , face: 0|1}. Actions: open(id), close, turn, next, prev. */
export function nextState(st,action,id){
 const s={open:st.open||'',face:st.face?1:0},d=DRAWERS.find(x=>x.id===s.open);
 const hasBack=!!(d&&d.back);
 if(action==='open'&&CARD_IDS.includes(id)){if(s.open===id)return nextState(s,'close');s.open=id;s.face=0;}
 else if(action==='close'){s.open='';s.face=0;}
 else if(action==='turn'&&s.open&&hasBack)s.face=s.face?0:1;
 else if((action==='next'||action==='prev')&&s.open){s.open=cycle(s.open,action==='next'?1:-1);s.face=0;}
 return s;
}

/* ---------- controller ---------- */
let bound=false;
export function initCabinet({doc=document,sfx={}}={}){
 if(bound)return;bound=true;
 const cue=k=>{try{sfx.cue&&sfx.cue(k);}catch{}};
 const read=cab=>({open:cab.dataset.open||'',face:cab.dataset.face==='1'?1:0});
 const slotOf=(cab,id)=>cab.querySelector(`.cc-slot[data-card="${id}"]`);
 /* fit the card to short windows: scale it down rather than let it spill or scroll */
 const fit=cab=>{const sl=cab.dataset.open&&slotOf(cab,cab.dataset.open);if(!sl)return;
  const h=sl.querySelector('.cc-flip').offsetHeight||1,w=sl.offsetWidth||1,vw=doc.defaultView.innerWidth,vh=doc.defaultView.innerHeight;
  cab.style.setProperty('--cs',String(Math.max(.55,Math.min(1,(vh-36)/h,(vw-24)/w)).toFixed(3)));};
 /* the control a card comes from: its drawer, or the corner tab where the cabinet is not shown (phones, short rooms) */
 const anchor=(cab,id)=>{const dr=cab.querySelector(`.cc-drawer[data-d="${id}"]`);return dr&&dr.offsetParent!==null?dr:cab.querySelector('.cc-tab');};
 const where=(cab,id)=>{const dr=anchor(cab,id);if(!dr)return;const r=dr.getBoundingClientRect(),pl=(cab.closest('.hz-plaque')||cab).getBoundingClientRect();
  cab.style.setProperty('--from-x',Math.round(r.left+r.width/2-(pl.left+pl.width/2))+'px');cab.style.setProperty('--from-y',Math.round(r.top+r.height/2-(pl.top+pl.height/2))+'px');};
 const apply=(cab,st,dir=0)=>{
  const prev=cab.dataset.open||'';
  cab.dataset.open=st.open;cab.dataset.face=String(st.face);
  for(const dr of cab.querySelectorAll('.cc-drawer[aria-expanded]'))dr.setAttribute('aria-expanded',String(dr.dataset.d===st.open));
  if(st.open&&prev!==st.open&&!dir)where(cab,st.open);
  for(const sl of cab.querySelectorAll('.cc-slot')){
   const id=sl.dataset.card;let s='off';
   if(id===st.open)s='on';else if(id===prev&&dir)s=dir>0?'prev':'next';
   if(id===st.open&&prev!==st.open&&dir){sl.classList.add('nt');sl.dataset.s=dir>0?'next':'prev';void sl.offsetWidth;sl.classList.remove('nt');}
   sl.dataset.s=s;sl.dataset.face=id===st.open?String(st.face):'0';
   /* only the open card is a dialog (the rest of the page, e.g. the attic keys, treats an open dialog as a modal) */
   if(s==='on'){sl.removeAttribute('inert');sl.setAttribute('role','dialog');sl.setAttribute('aria-modal','true');}else{sl.setAttribute('inert','');sl.removeAttribute('role');sl.removeAttribute('aria-modal');}
  }
  /* a card that has slid away rests hidden at its drawer again after the move */
  if(dir)setTimeout(()=>{for(const sl of cab.querySelectorAll('.cc-slot[data-s="prev"],.cc-slot[data-s="next"]'))if(sl.dataset.card!==cab.dataset.open)sl.dataset.s='off';},520);
  fit(cab);
 };
 const focusCard=(cab,id)=>{const sl=slotOf(cab,id);if(!sl)return;let n=0;/* the faces become visible a beat after the card lands, so retry until focus sticks */
  const go=()=>{const f=sl.querySelector(sl.dataset.face==='1'?'.cc-back .cc-flipbtn':'.cc-front .cc-flipbtn')||sl.querySelector('.cc-front .cc-next');if(!f||sl.dataset.s!=='on')return;f.focus({preventScroll:true});if(doc.activeElement!==f&&++n<12)setTimeout(go,60);};setTimeout(go,30);};
 const closeCab=cab=>{const id=cab.dataset.open;apply(cab,nextState(read(cab),'close'));cue('drawer');
  const dr=id&&anchor(cab,id);if(dr)dr.focus({preventScroll:true});};
 const open=(cab,id,dir=0)=>{const st=read(cab),was=st.open;apply(cab,nextState(was?{...st,open:''}:st,'open',id),dir);
  cue(was?'turn':'drawer');
  try{markSeen(id);}catch{}cab.querySelector('.cc-new')?.remove();
  focusCard(cab,id);};
 doc.addEventListener('click',e=>{
  const cab=e.target.closest&&e.target.closest('.cat-card');if(!cab)return;
  const dr=e.target.closest('.cc-drawer,.cc-tab');
  if(dr){
   if(dr.dataset.act){const t=doc.querySelector(dr.dataset.act);if(t){cue('knock');t.click();}return;}
   const id=dr.dataset.d;if(cab.dataset.open===id)closeCab(cab);else open(cab,id);return;}
  if(e.target.closest('.cc-scrim')){closeCab(cab);return;}
  const go=e.target.closest('.cc-go');
  if(go){const sel=go.dataset.go;closeCab(cab);setTimeout(()=>{const t=doc.querySelector(sel);if(t)t.click();},300);return;}
  const st=read(cab);if(!st.open)return;
  if(e.target.closest('.cc-flipbtn')){const n=nextState(st,'turn');apply(cab,n);cue('turn');focusCard(cab,st.open);return;}
  const nav=e.target.closest('.cc-nav');
  if(nav){const dir=nav.classList.contains('cc-next')?1:-1;const to=cycle(st.open,dir);apply(cab,{open:to,face:0},dir);cue('turn');try{markSeen(to);}catch{}focusCard(cab,to);}
 });
 /* window capture: while a card is open it owns the keyboard, so the room's own keys (1 to 5, D, N, ?) do nothing behind the veil */
 doc.defaultView.addEventListener('keydown',e=>{
  const cab=doc.querySelector('.cat-card[data-open]:not([data-open=""])');if(!cab||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='Escape'){e.stopPropagation();e.preventDefault();closeCab(cab);return;}
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.stopPropagation();e.preventDefault();const st=read(cab),dir=e.key==='ArrowRight'?1:-1,to=cycle(st.open,dir);apply(cab,{open:to,face:0},dir);cue('turn');try{markSeen(to);}catch{}focusCard(cab,to);return;}
  if(e.key==='Tab'){
   const sl=slotOf(cab,cab.dataset.open);if(!sl)return;
   const f=[...sl.querySelectorAll('button')].filter(b=>doc.defaultView.getComputedStyle(b).visibility!=='hidden');
   if(!f.length)return;const first=f[0],last=f[f.length-1];
   if(!sl.contains(doc.activeElement)){e.preventDefault();first.focus();}
   else if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}
   return;}
  if(e.key.length===1&&e.key!==' ')e.stopPropagation();
 },true);
 doc.defaultView.addEventListener('resize',()=>{const cab=doc.querySelector('.cat-card[data-open]:not([data-open=""])');if(cab){where(cab,cab.dataset.open);fit(cab);}});
}
