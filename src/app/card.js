import {PALETTE} from '../theme/colors.js';
import {comboLabel} from '../core/combo.js';
import {playReveal} from '../ui/reveal.js';
import * as core from '../core/index.js';
import {Sfx,Feel} from '../feel.js';
import {feedbackHTML} from '../ui/feedback.js';
import {TIERS,save} from './state.js';
import {$,RM,esc,sleep} from './util.js';
import {FX} from './fx.js';
import {countUp} from './chrome.js';

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
   ${b.answer?`<p class="wrote">You wrote: \u201c${esc(b.answer)}\u201d</p>`:''}
   ${feedbackHTML(b)}
   <div class="chips">
    ${opts.fresh?`<span><b>+${b.ft} ft</b> \u00b7 ${opts.depth1} ft</span>`:b.t?`<span>${b.mode==='daily'?'No. '+Math.max(1,core.dailyNumber(new Date(b.t).toISOString().slice(0,10)))+' \u00b7 ':''}${new Date(b.t).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}${b.ft?' \u00b7 <b>+'+b.ft+' ft</b>':''}</span>`:''}
    ${opts.fresh&&b.combo?`<span class="cb">Combo <b>${comboLabel(b.combo.mult)}</b> \u00b7 ${b.combo.n} in a row</span>`:opts.fresh&&opts.broke?`<span>Combo broken</span>`:''}
    <span class="cs"><b id="cn">${opts.fresh?0:b.score}</b>/100<div class="meter"><i id="mt" style="width:${opts.fresh?0:b.score}%"></i></div></span>
   </div>
   ${!opts.fresh&&opts.nav?`<button class="btn favbtn" id="cfav" aria-pressed="${!!b.fav}">${b.fav?'★ Favourite':'☆ Mark as favourite'}</button>`:''}
   ${opts.nav?`<div class="cardnav"><button class="btn" id="cprev" aria-label="Previous book"${opts.nav.i<=0?' disabled':''}>\u2039</button><span>${opts.nav.i+1} of ${opts.nav.items.length}</span><button class="btn" id="cnext" aria-label="Next book"${opts.nav.i>=opts.nav.items.length-1?' disabled':''}>\u203a</button></div>`:''}
   <button class="btn pri go" id="go">${opts.onNext?(opts.last?'See your descent':'Next word'):'Close'} <kbd>Enter</kbd></button>
   </div>
  </div>
  <div class="cover"><span class="ct">${T.rar}</span><div class="orn"></div><div class="cw">${esc(b.w)}</div><div class="orn"></div><span class="ct">${T.name}</span></div>
 </div>`;
 L.hidden=false;requestAnimationFrame(()=>L.classList.add('on'));
 const bk=$('#bk');
 if(opts.fresh){setTimeout(async()=>{Sfx.paper();if(b.tier>=5)Sfx.sting(b.tier);if(b.tier>=4){Feel.shake(2+b.tier*1.1,b.tier>=6?900:600);Feel.slowmo(b.tier>=6?.25:b.tier>=5?.4:.6,b.tier>=6?1700:1200);}if(b.tier>=6)flashTop();bk.classList.add('open');{const pl=playReveal(L,b.tier,T.spine,RM);if(pl.ink)bk.classList.add('rv-ink');if(pl.tier>=5)bk.classList.add('rv-pulse');}{const rc=bk.getBoundingClientRect();FX.burst(rc.left+rc.width/2,rc.top+rc.height*.45,b.tier,30+b.tier*24);const hh=$('#halo');if(hh)hh.classList.add('go');}await sleep(380);if(cardOpts!==opts)return;Sfx.chime(b.tier);$('#mt').style.width=b.score+'%';countUp($('#cn'),b.score,550);await sleep(250);if(cardOpts!==opts)return;$('#vd').classList.add('on');if(b.tier>=3){const rc=bk.getBoundingClientRect();FX.burst(rc.left+rc.width/2,rc.top+80,b.tier,30+b.tier*14);}$('#go').focus();},220);}
 else{bk.classList.add('open','gone');setTimeout(()=>$('#go').focus(),50);}
 $('#go').onclick=closeCard;
 const fv=$('#cfav');if(fv)fv.onclick=()=>{b.fav=!b.fav;if(!b.fav)delete b.fav;save();fv.setAttribute('aria-pressed',!!b.fav);fv.textContent=b.fav?'★ Favourite':'☆ Mark as favourite';};
 if(opts.nav){const step=n=>openCard(opts.nav.items[opts.nav.i+n],{...opts,nav:{...opts.nav,i:opts.nav.i+n}});$('#cprev').onclick=()=>step(-1);$('#cnext').onclick=()=>step(1);}
 L.onclick=e=>{if(e.target===L&&!opts.onNext)closeCard();};
}
export function flashTop(){const f=document.createElement('div');f.style.cssText='position:fixed;inset:0;z-index:70;pointer-events:none;background:radial-gradient(circle at 50% 45%,rgba(190,252,255,.55),rgba(190,252,255,0) 60%);opacity:0;transition:opacity .25s ease-out';document.body.appendChild(f);requestAnimationFrame(()=>{f.style.opacity=1;setTimeout(()=>{f.style.transition='opacity 1.6s ease-in';f.style.opacity=0;setTimeout(()=>f.remove(),1700);},260);});}
export function closeCard(){const L=$('#cardlayer');const o=cardOpts;cardOpts=null;L.classList.remove('on');setTimeout(()=>{L.hidden=true;L.innerHTML='';},250);if(o&&o.onNext)o.onNext();}
