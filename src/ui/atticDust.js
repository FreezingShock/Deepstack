/* Dust off a book in the attic. Tap a floorless book in the attic and a small slip asks where it belongs; choosing a
   floor writes its name in with a pen stroke (the shared --pen-stroke), saves `fl`, and the book leaves the attic for
   its bay on the Shelf. Books that already have a floor just open as usual. */
import {dustOff,hasFloor} from '../core/attic.js';
import {refreshAttic} from './atticHome.js';
import {DUR} from './motion.js';
import './atticDust.css';

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
let slip=null;

export function closeDust(){if(slip){slip.remove();slip=null;}}

/* Returns true when it took the tap (a floorless book), false when the caller should open the book as usual. */
export function tryDustOff(b,{S,save,TIERS,FLOORS,floorStartFt,x=0,y=0}){
 if(!b||hasFloor(b))return false;
 closeDust();
 const T=TIERS[b.tier]||{name:'',spine:'#888'};
 const el=document.createElement('div');el.className='dust-slip';el.setAttribute('role','dialog');el.setAttribute('aria-label',`Dust off ${b.w}`);
 el.style.setProperty('--tc',T.spine);
 el.innerHTML=`<p class="dust-k">Found in the dust</p><h3>${esc(b.w)}</h3><p class="dust-t">${esc(T.name)} · which floor was it found on?</p>
  <div class="dust-floors">${FLOORS.map(f=>`<button type="button" data-f="${f.id}"><span>${esc(f.name)}</span><small>${floorStartFt(f)} ft</small></button>`).join('')}</div>
  <button type="button" class="dust-x">Leave it in the dust</button>`;
 document.body.appendChild(el);slip=el;
 const w=el.offsetWidth,h=el.offsetHeight;
 el.style.left=Math.max(8,Math.min(innerWidth-w-8,x-w/2))+'px';el.style.top=Math.max(8,Math.min(innerHeight-h-8,y-h-14))+'px';
 const first=el.querySelector('.dust-floors button');first&&first.focus({preventScroll:true});
 el.querySelector('.dust-x').onclick=closeDust;
 el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeDust();}});
 el.querySelector('.dust-floors').onclick=e=>{
  const btn=e.target.closest('button[data-f]');if(!btn||el.classList.contains('writing'))return;
  const id=+btn.dataset.f;el.classList.add('writing');btn.classList.add('pen');
  const done=()=>{
   if(slip!==el)return;
   if(dustOff(b,id,FLOORS.length)){save();refreshAttic(S.shelf);}
   el.classList.add('away');setTimeout(closeDust,reduced()?0:DUR.page);
  };
  setTimeout(done,reduced()?0:DUR.page);
 };
 return true;
}
