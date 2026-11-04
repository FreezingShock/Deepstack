import {Sfx} from '../feel.js';
import {$,RM,clamp,esc} from './util.js';
import {floorStartFt} from './state.js';

/* ---------- helpers ---------- */
export const tip=$('#tip');
export const NOHOVER=matchMedia('(hover:none)').matches;
export function showTip(t,x,y){if(NOHOVER)return;tip.textContent=t;tip.style.opacity=1;tip.style.left=clamp(x+14,6,innerWidth-200)+'px';tip.style.top=(y-34)+'px';}
export const hideTip=()=>tip.style.opacity=0;
export const ui={home:$('#home'),stage:$('#stage'),final:$('#final'),cap:$('#shelfcap'),hud:$('#depthHud'),gauge:$('#gauge'),skip:$('#skiph')};
export function type(el,text,speed=14){return new Promise(res=>{if(RM||!speed){el.textContent=text;return res();}let i=0;const id=setInterval(()=>{i++;el.textContent=text.slice(0,i);if(i%3===0)Sfx.key();if(i>=text.length){clearInterval(id);res();}},speed);});}
export function countUp(el,to,ms,from=0){if(RM){el.textContent=to;return;}const t0=performance.now();(function f(n){const u=Math.min(1,(n-t0)/ms),e=1-Math.pow(1-u,3);el.textContent=Math.round(from+(to-from)*e);if(u<1)requestAnimationFrame(f);})(t0);}
export const floorBanner=$('#floorBanner');
export let bannerT=0;
export function announceFloor(f){
 floorBanner.innerHTML=`<small>Floor ${['I','II','III','IV','V','VI','VII','VIII'][f.id]} \u00b7 ${floorStartFt(f)} ft</small><b>${esc(f.name)}</b><i>${esc(f.sub)}</i>`;
 floorBanner.style.setProperty('--fc',`rgb(${f.lamp.join(',')})`);floorBanner.style.setProperty('--fcd',`rgba(${f.lamp.join(',')},.32)`);floorBanner.dataset.motif=f.motif;floorBanner.classList.remove('on');void floorBanner.offsetWidth;floorBanner.classList.add('on');
 clearTimeout(bannerT);bannerT=setTimeout(()=>floorBanner.classList.remove('on'),RM?2500:4200);}
