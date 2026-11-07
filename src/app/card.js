import {PALETTE} from '../theme/colors.js';
import {comboLabel} from '../core/combo.js';
import {playReveal,revealPlan} from '../ui/reveal.js';
import {coverLockHTML,coverLockVars} from '../ui/coverLock.js';
import * as core from '../core/index.js';
import {Sfx,Feel} from '../feel.js';
import {feedbackHTML} from '../ui/feedback.js';
import {TIERS,save} from './state.js';
import {$,RM,esc,sleep} from './util.js';
import {stampCover,stampPage} from '../ui/coverSigil.js';
import {FX} from './fx.js';
import {countUp} from './chrome.js';
import {alsoAcceptedHTML} from '../ui/alsoAccepted.js';
import {fillMeans} from '../ui/alsoMeans.js';
import {marginNoteHTML,wireMarginNote} from '../ui/wordNotes.js';

/* ---------- result card ---------- */
export let cardOpts=null;
export function openCard(b,opts={}){
 cardOpts=opts;const T=TIERS[b.tier],L=$('#cardlayer');
 L.innerHTML=`<div class="book t${b.tier}" id="bk" style="--tc:${T.spine};--ti:${T.ink};--tf:${[PALETTE.ash13,PALETTE.ash13,PALETTE.white,PALETTE.white,PALETTE.ash13,PALETTE.white,PALETTE.ash13][b.tier]}">
  <div class="halo" id="halo"></div>
  <div class="page">
   <div class="tierbar"><b>${T.name}</b><span>${T.rar}</span></div>
   <div class="inner">
   <h2>${esc(b.w)}<small>${esc(b.pos)}</small></h2>
   <p class="verdict ${opts.fresh?'':'on'}" id="vd">${esc(b.verdict)}</p>
   <p class="def">${esc(b.def)}</p>
   <span class="means-slot"></span>
   ${alsoAcceptedHTML(b)||'<span class="also-slot"></span>'}
   ${marginNoteHTML(b)}
   ${b.answer?`<p class="wrote">You wrote: \u201c${esc(b.answer)}\u201d</p>`:''}
   ${feedbackHTML(b)}
   <div class="chips">
    ${opts.fresh?`<span><b>+${b.ft} ft</b> \u00b7 ${opts.depth1} ft deep</span>`:b.t?`<span>${b.mode==='daily'?'No. '+Math.max(1,core.dailyNumber(core.dayKey(b.t)))+' \u00b7 ':''}${new Date(b.t).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}${b.ft?' \u00b7 <b>+'+b.ft+' ft</b>':''}</span>`:''}
    ${opts.fresh&&b.combo?`<span class="cb">Combo <b>${comboLabel(b.combo.mult)}</b> \u00b7 ${b.combo.n} in a row</span>`:opts.fresh&&opts.broke?`<span>Combo broken</span>`:''}
    <span class="cs"><b id="cn">${opts.fresh?0:b.score}</b>/100<div class="meter"><i id="mt" style="width:${opts.fresh?0:b.score}%"></i></div></span>
   </div>
   ${opts.shelve?opts.shelve.html:''}
   ${!opts.fresh&&opts.nav?`<button class="btn favbtn" id="cfav" aria-pressed="${!!b.fav}">${b.fav?'★ Favourite':'☆ Mark as favourite'}</button>`:''}
   ${opts.nav?`<div class="cardnav"><button class="btn" id="cprev" aria-label="Previous book"${opts.nav.i<=0?' disabled':''}>\u2039</button><span>${opts.nav.i+1} of ${opts.nav.items.length}</span><button class="btn" id="cnext" aria-label="Next book"${opts.nav.i>=opts.nav.items.length-1?' disabled':''}>\u203a</button></div>`:''}
   <button class="btn pri go" id="go">${opts.onNext?(opts.last?'See your descent':'Next word'):'Close'} <kbd>Enter</kbd></button>
   </div>
  </div>
  <div class="cover"><span class="ct">${T.rar}</span><div class="orn"></div><div class="cw">${esc(b.w)}</div><div class="orn"></div><span class="ct">${T.name}</span></div>
  ${opts.fresh?coverLockHTML(revealPlan(b.tier).cover.style):''}
 </div>`;
 L.hidden=false;requestAnimationFrame(()=>L.classList.add('on'));
 fillMeans(L,b);
 wireMarginNote(L,b);
 const bk=$('#bk');stampCover(bk.querySelector('.cover'),b.w,b.tier);stampPage(bk.querySelector('.page'),b.w,b.tier);
 if(opts.fresh){const pl0=revealPlan(b.tier);bk.classList.add('rvc');const cvv=coverLockVars(pl0.cover,RM),dl=RM?0:pl0.cover.delay;for(const k in cvv)bk.style.setProperty(k,cvv[k]);
 /* hurry: a press (Enter, Space or a tap) during the reveal jumps to the finished card, like "click or press space to hurry" on the descent, so nothing is lost while the cover swings */
 const onHurry=e=>{if(e.type==='keydown'&&(e.repeat||(e.key!=='Enter'&&e.key!==' ')))return;if(e.type==='keydown')e.preventDefault(); /* the press lands on the focused Next button; keep it from also clicking through */hurry();};
 const hurry=()=>{removeEventListener('keydown',onHurry,true);removeEventListener('pointerdown',onHurry,true);if(opts.hurried||cardOpts!==opts)return;opts.hurried=true;
  bk.classList.add('open');if(!opts.counting){Sfx.chime(b.tier);const cn=$('#cn');if(cn)cn.textContent=b.score;}
  const mt=$('#mt');if(mt)mt.style.width=b.score+'%';const vd=$('#vd');if(vd)vd.classList.add('on');const hh=$('#halo');if(hh)hh.classList.add('go');
  if(b.tier>=3){const rc=bk.getBoundingClientRect();FX.settle(rc.left+rc.width/2,rc.top+80,b.tier);}
  $('#go')?.focus();};
 addEventListener('keydown',onHurry,true);addEventListener('pointerdown',onHurry,true);
 setTimeout(async()=>{Sfx.paper();/* the closure comes undone first; the sting, shake and burst land when the cover starts to swing (Apocrypha's burst starts at once: it implodes first) */const at=(fn,ms)=>ms>0?setTimeout(()=>{if(cardOpts===opts)fn();},ms):fn();if(pl0.sound.sting)at(()=>Sfx.sting(b.tier),dl);if(pl0.shake)at(()=>Feel.shake(pl0.shake.amp,pl0.shake.ms),dl);if(pl0.slow)at(()=>Feel.slowmo(pl0.slow.scale,pl0.slow.ms),dl);bk.classList.add('open');{const pl=playReveal(L,b.tier,T.spine,RM);if(pl.ink)bk.classList.add('rv-ink');if(pl.pulse)bk.classList.add('rv-pulse');}at(()=>{const rc=bk.getBoundingClientRect();FX.reveal(rc.left+rc.width/2,rc.top+rc.height*.45,b.tier);const hh=$('#halo');if(hh)hh.classList.add('go');},b.tier>=6?0:dl);await sleep(380+pl0.cover.delay);if(cardOpts!==opts||opts.hurried)return;opts.counting=true;Sfx.chime(b.tier);$('#mt').style.width=b.score+'%';countUp($('#cn'),b.score,550);await sleep(250);if(cardOpts!==opts||opts.hurried)return;removeEventListener('keydown',onHurry,true);removeEventListener('pointerdown',onHurry,true);$('#vd').classList.add('on');if(b.tier>=3){const rc=bk.getBoundingClientRect();FX.settle(rc.left+rc.width/2,rc.top+80,b.tier);}$('#go').focus();},220);}
 else if(RM||opts.stepped){bk.classList.add('open','gone');setTimeout(()=>$('#go').focus(),50);}
 else{/* a card from the shelf opens like a book: the cover swings over, then the page is read */requestAnimationFrame(()=>requestAnimationFrame(()=>{if(cardOpts===opts)bk.classList.add('open');}));setTimeout(()=>{if(cardOpts===opts)$('#go').focus();},360);}
 $('#go').onclick=closeCard;
 if(opts.shelve)opts.shelve.wire(bk);
 const fv=$('#cfav');if(fv)fv.onclick=()=>{b.fav=!b.fav;if(!b.fav)delete b.fav;save();fv.setAttribute('aria-pressed',!!b.fav);fv.textContent=b.fav?'★ Favourite':'☆ Mark as favourite';};
 if(opts.nav){const step=n=>openCard(opts.nav.items[opts.nav.i+n],{...opts,stepped:true,nav:{...opts.nav,i:opts.nav.i+n}});$('#cprev').onclick=()=>step(-1);$('#cnext').onclick=()=>step(1);}
 L.onclick=e=>{if(e.target===L&&!opts.onNext)closeCard();};
}
export function closeCard(){const L=$('#cardlayer');const o=cardOpts;cardOpts=null;
 /* a shelf card swings shut before the layer fades; fresh results and reduced motion fade as before */
 const swing=!RM&&o&&!o.fresh&&!o.stepped&&!L.classList.contains('shutting')&&L.querySelector('#bk.open:not(.gone)');
 if(swing){L.classList.add('shutting');L.querySelector('#bk').classList.remove('open');}
 setTimeout(()=>{if(cardOpts)return;L.classList.remove('on');setTimeout(()=>{if(cardOpts)return;L.hidden=true;L.innerHTML='';L.classList.remove('shutting');},250);},swing?330:0);
 if(o&&o.onNext)o.onNext();}
